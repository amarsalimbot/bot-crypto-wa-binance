const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const { GoogleGenAI } = require("@google/genai");
const pino = require("pino");
const http = require("http");
const fs = require("fs");
const path = require("path");

const APP_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Makassar";
const PORT = Number(process.env.PORT || 7860);
const WHATSAPP_PHONE_NUMBER = String(process.env.WHATSAPP_PHONE_NUMBER || "").replace(/\D/g, "");
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const MONITOR_INTERVAL_SECONDS = Math.max(30, Number(process.env.MONITOR_INTERVAL_SECONDS || 60));
const SIGNAL_COOLDOWN_MINUTES = Math.max(5, Number(process.env.SIGNAL_COOLDOWN_MINUTES || 45));
const DEFAULT_MODE = (process.env.DEFAULT_MODE || "trader").toLowerCase() === "investor" ? "investor" : "trader";
const OWNER_JID = WHATSAPP_PHONE_NUMBER ? `${WHATSAPP_PHONE_NUMBER}@s.whatsapp.net` : "";
const DATA_DIR = path.join(__dirname, "data");
const STATE_FILE = path.join(DATA_DIR, "crypto-bot-state.json");

const WATCHLIST = [
    { asset: "PAXG", symbol: "PAXGUSDT", name: "PAX Gold" },
    { asset: "XAUT", symbol: "XAUTUSDT", name: "Tether Gold" },
    { asset: "BTC", symbol: "BTCUSDT", name: "Bitcoin" },
    { asset: "BNB", symbol: "BNBUSDT", name: "BNB" },
    { asset: "ETH", symbol: "ETHUSDT", name: "Ethereum" }
];

const NEWS_FEEDS = [
    "https://www.coindesk.com/arc/outboundfeeds/rss/",
    "https://cointelegraph.com/rss",
    "https://cryptonews.com/news/feed/"
];

const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

let sockGlobal = null;
let sedangStart = false;
let reconnectTimer = null;
let jumlahReconnect = 0;
let monitorTimer = null;
let state = loadState();
const memoryCache = {
    market: new Map(),
    news: { at: 0, items: [] }
};

function tunggu(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function nowText() {
    return new Date().toLocaleString("id-ID", { timeZone: APP_TIMEZONE });
}

function formatUsd(value, digits = 2) {
    const number = Number(value || 0);
    return `$${number.toLocaleString("en-US", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    })}`;
}

function formatPct(value) {
    const number = Number(value || 0);
    const sign = number > 0 ? "+" : "";
    return `${sign}${number.toFixed(2)}%`;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function loadState() {
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        if (!fs.existsSync(STATE_FILE)) {
            return { subscribers: {}, lastAlerts: {}, settings: { defaultMode: DEFAULT_MODE } };
        }
        const parsed = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
        return {
            subscribers: parsed.subscribers || {},
            lastAlerts: parsed.lastAlerts || {},
            settings: parsed.settings || { defaultMode: DEFAULT_MODE }
        };
    } catch (err) {
        console.log("Gagal membaca state, memakai state kosong:", err.message);
        return { subscribers: {}, lastAlerts: {}, settings: { defaultMode: DEFAULT_MODE } };
    }
}

function saveState() {
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    } catch (err) {
        console.log("Gagal menyimpan state:", err.message);
    }
}

function normalizeAsset(input) {
    const text = String(input || "").toUpperCase();
    return WATCHLIST.find(item => text.includes(item.asset) || text.includes(item.symbol));
}

function getAllRecipients() {
    const ids = Object.entries(state.subscribers)
        .filter(([, config]) => config.active)
        .map(([jid]) => jid);
    if (OWNER_JID && !ids.includes(OWNER_JID)) ids.push(OWNER_JID);
    return ids;
}

function subscriberMode(jid) {
    return state.subscribers[jid]?.mode || state.settings.defaultMode || DEFAULT_MODE;
}

async function fetchJson(url, timeoutMs = 15000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: { "User-Agent": "crypto-wa-bot/1.0" }
        });
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        return response.json();
    } finally {
        clearTimeout(timeout);
    }
}

async function fetchText(url, timeoutMs = 15000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: { "User-Agent": "crypto-wa-bot/1.0" }
        });
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        return response.text();
    } finally {
        clearTimeout(timeout);
    }
}

async function getTicker(symbol) {
    const cached = memoryCache.market.get(`ticker:${symbol}`);
    if (cached && Date.now() - cached.at < 10_000) return cached.data;

    const data = await fetchJson(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
    const ticker = {
        symbol,
        price: Number(data.lastPrice),
        high: Number(data.highPrice),
        low: Number(data.lowPrice),
        changePct: Number(data.priceChangePercent),
        volume: Number(data.volume),
        quoteVolume: Number(data.quoteVolume)
    };
    memoryCache.market.set(`ticker:${symbol}`, { at: Date.now(), data: ticker });
    return ticker;
}

async function getKlines(symbol, interval = "15m", limit = 120) {
    const key = `klines:${symbol}:${interval}:${limit}`;
    const cached = memoryCache.market.get(key);
    if (cached && Date.now() - cached.at < 30_000) return cached.data;

    const rows = await fetchJson(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
    const candles = rows.map(row => ({
        openTime: row[0],
        open: Number(row[1]),
        high: Number(row[2]),
        low: Number(row[3]),
        close: Number(row[4]),
        volume: Number(row[5]),
        closeTime: row[6]
    }));
    memoryCache.market.set(key, { at: Date.now(), data: candles });
    return candles;
}

function sma(values, length) {
    if (values.length < length) return null;
    const slice = values.slice(-length);
    return slice.reduce((sum, value) => sum + value, 0) / length;
}

function ema(values, length) {
    if (values.length < length) return null;
    const multiplier = 2 / (length + 1);
    let value = values.slice(0, length).reduce((sum, item) => sum + item, 0) / length;
    for (let i = length; i < values.length; i++) value = values[i] * multiplier + value * (1 - multiplier);
    return value;
}

function rsi(values, length = 14) {
    if (values.length <= length) return null;
    let gains = 0;
    let losses = 0;
    for (let i = values.length - length; i < values.length; i++) {
        const diff = values[i] - values[i - 1];
        if (diff >= 0) gains += diff;
        else losses += Math.abs(diff);
    }
    if (losses === 0) return 100;
    const rs = gains / losses;
    return 100 - (100 / (1 + rs));
}

function macd(values) {
    const fast = ema(values, 12);
    const slow = ema(values, 26);
    if (fast == null || slow == null || values.length < 35) return { value: null, signal: null, histogram: null };

    const macdSeries = [];
    for (let i = 26; i <= values.length; i++) {
        const segment = values.slice(0, i);
        macdSeries.push(ema(segment, 12) - ema(segment, 26));
    }
    const signal = ema(macdSeries, 9);
    const value = fast - slow;
    return { value, signal, histogram: signal == null ? null : value - signal };
}

function supportResistance(candles, lookback = 50) {
    const slice = candles.slice(-lookback);
    return {
        support: Math.min(...slice.map(c => c.low)),
        resistance: Math.max(...slice.map(c => c.high))
    };
}

function volatility(candles) {
    const closes = candles.slice(-20).map(c => c.close);
    if (closes.length < 2) return 0;
    const returns = [];
    for (let i = 1; i < closes.length; i++) returns.push(((closes[i] - closes[i - 1]) / closes[i - 1]) * 100);
    const avg = returns.reduce((sum, value) => sum + value, 0) / returns.length;
    const variance = returns.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) / returns.length;
    return Math.sqrt(variance);
}

function scoreSignal({ ticker, candles15m, candles1h, mode }) {
    const close15 = candles15m.map(c => c.close);
    const close1h = candles1h.map(c => c.close);
    const last = close15[close15.length - 1];
    const rsi15 = rsi(close15, 14);
    const ema9 = ema(close15, 9);
    const ema21 = ema(close15, 21);
    const ema50h = ema(close1h, 50);
    const macd15 = macd(close15);
    const sr = supportResistance(candles15m, 60);
    const vol = volatility(candles15m);
    const avgVolume = sma(candles15m.slice(0, -1).map(c => c.volume), 20) || 1;
    const latestVolume = candles15m[candles15m.length - 1].volume;
    const volumeRatio = latestVolume / avgVolume;

    let entryScore = 0;
    let sellScore = 0;
    const reasonsEntry = [];
    const reasonsSell = [];

    if (ema9 && ema21 && ema9 > ema21) {
        entryScore += 18;
        reasonsEntry.push("EMA 9 di atas EMA 21");
    } else {
        sellScore += 14;
        reasonsSell.push("EMA pendek melemah");
    }

    if (ema50h && last > ema50h) {
        entryScore += mode === "investor" ? 20 : 12;
        reasonsEntry.push("harga di atas tren 1 jam");
    } else if (ema50h) {
        sellScore += mode === "investor" ? 18 : 10;
        reasonsSell.push("harga di bawah tren 1 jam");
    }

    if (rsi15 != null && rsi15 >= 42 && rsi15 <= 62) {
        entryScore += 14;
        reasonsEntry.push(`RSI sehat ${rsi15.toFixed(1)}`);
    }
    if (rsi15 != null && rsi15 < 32) {
        entryScore += mode === "investor" ? 12 : 8;
        reasonsEntry.push(`RSI oversold ${rsi15.toFixed(1)}`);
    }
    if (rsi15 != null && rsi15 > 72) {
        sellScore += 20;
        reasonsSell.push(`RSI overbought ${rsi15.toFixed(1)}`);
    }

    if (macd15.histogram != null && macd15.histogram > 0) {
        entryScore += 16;
        reasonsEntry.push("MACD histogram positif");
    } else if (macd15.histogram != null) {
        sellScore += 14;
        reasonsSell.push("MACD histogram negatif");
    }

    const distanceFromSupport = ((last - sr.support) / last) * 100;
    const distanceToResistance = ((sr.resistance - last) / last) * 100;
    if (distanceFromSupport >= 0 && distanceFromSupport <= 1.8) {
        entryScore += 12;
        reasonsEntry.push("harga dekat area support");
    }
    if (distanceToResistance >= 0 && distanceToResistance <= 1.2) {
        sellScore += 14;
        reasonsSell.push("harga dekat resistance");
    }

    if (volumeRatio > 1.25 && ticker.changePct > 0) {
        entryScore += 10;
        reasonsEntry.push(`volume naik ${volumeRatio.toFixed(1)}x`);
    }
    if (ticker.changePct < -2.5) {
        sellScore += 18;
        reasonsSell.push(`tekanan 24 jam ${formatPct(ticker.changePct)}`);
    }
    if (vol > 1.8) {
        sellScore += mode === "investor" ? 6 : 12;
        reasonsSell.push(`volatilitas tinggi ${vol.toFixed(2)}%`);
    }

    const buyThreshold = mode === "investor" ? 58 : 62;
    const sellThreshold = mode === "investor" ? 68 : 60;
    let action = "WAIT";
    let score = Math.max(entryScore, sellScore);
    let reasons = ["belum ada konfirmasi kuat"];

    if (entryScore >= buyThreshold && entryScore >= sellScore + 8) {
        action = "ENTRY";
        score = entryScore;
        reasons = reasonsEntry;
    } else if (sellScore >= sellThreshold && sellScore > entryScore) {
        action = "SELL";
        score = sellScore;
        reasons = reasonsSell;
    }

    return {
        action,
        score: Math.min(100, Math.round(score)),
        entryScore: Math.min(100, Math.round(entryScore)),
        sellScore: Math.min(100, Math.round(sellScore)),
        reasons,
        indicators: {
            rsi: rsi15,
            ema9,
            ema21,
            ema50h,
            macdHistogram: macd15.histogram,
            support: sr.support,
            resistance: sr.resistance,
            volatility: vol,
            volumeRatio
        }
    };
}

async function analyzeAsset(asset, mode = DEFAULT_MODE) {
    const item = typeof asset === "string" ? normalizeAsset(asset) : asset;
    if (!item) throw new Error("Koin tidak ada di watchlist.");

    const [ticker, candles15m, candles1h] = await Promise.all([
        getTicker(item.symbol),
        getKlines(item.symbol, "15m", 150),
        getKlines(item.symbol, "1h", 120)
    ]);

    return {
        ...item,
        ticker,
        mode,
        signal: scoreSignal({ ticker, candles15m, candles1h, mode })
    };
}

async function getAllPrices() {
    const results = [];
    for (const item of WATCHLIST) {
        try {
            results.push({ ...item, ticker: await getTicker(item.symbol) });
        } catch (err) {
            results.push({ ...item, error: err.message });
        }
        await sleep(120);
    }
    return results;
}

function buildPriceMessage(rows) {
    let text = `DAFTAR HARGA REALTIME BINANCE\nUpdate: ${nowText()}\n\n`;
    for (const row of rows) {
        if (row.error) {
            text += `${row.asset}: gagal ambil data (${row.error})\n`;
            continue;
        }
        const digits = row.ticker.price >= 100 ? 2 : 4;
        text += `${row.asset}/USDT: ${formatUsd(row.ticker.price, digits)} (${formatPct(row.ticker.changePct)} 24j)\n`;
        text += `High/Low: ${formatUsd(row.ticker.high, digits)} / ${formatUsd(row.ticker.low, digits)}\n\n`;
    }
    text += "Ketik: analisa BTC, analisa ETH investor, berita, alert on.";
    return text.trim();
}

function buildAnalysisMessage(result) {
    const { asset, name, ticker, signal, mode } = result;
    const digits = ticker.price >= 100 ? 2 : 4;
    const label = signal.action === "ENTRY" ? "ENTRY / BUY" : signal.action === "SELL" ? "SELL / TAKE PROFIT / RISK OFF" : "WAIT";
    const reasons = signal.reasons.slice(0, 5).map(reason => `- ${reason}`).join("\n");
    const i = signal.indicators;

    return `${asset} (${name}) - ${mode.toUpperCase()}
Harga: ${formatUsd(ticker.price, digits)} (${formatPct(ticker.changePct)} 24j)
Sinyal: ${label}
Confidence: ${signal.score}/100
Entry score: ${signal.entryScore}/100
Sell score: ${signal.sellScore}/100

Alasan:
${reasons}

Level teknikal:
Support: ${formatUsd(i.support, digits)}
Resistance: ${formatUsd(i.resistance, digits)}
RSI 15m: ${i.rsi == null ? "-" : i.rsi.toFixed(1)}
Volume: ${i.volumeRatio.toFixed(2)}x rata-rata
Volatilitas 15m: ${i.volatility.toFixed(2)}%

Catatan: ini analisis probabilitas, bukan nasihat keuangan. Gunakan risk management.`;
}

function decodeEntities(text) {
    return String(text || "")
        .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function parseRssItems(xml, source) {
    const matches = [...String(xml || "").matchAll(/<item\b[\s\S]*?<\/item>/gi)];
    return matches.slice(0, 8).map(match => {
        const item = match[0];
        const title = item.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "";
        const link = item.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] || "";
        const pubDate = item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1] || "";
        const description = item.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1] || "";
        return {
            source,
            title: decodeEntities(title),
            link: decodeEntities(link),
            pubDate: decodeEntities(pubDate),
            description: decodeEntities(description).slice(0, 240)
        };
    }).filter(item => item.title);
}

async function getCryptoNews() {
    if (Date.now() - memoryCache.news.at < 10 * 60 * 1000 && memoryCache.news.items.length) {
        return memoryCache.news.items;
    }

    const items = [];
    for (const feed of NEWS_FEEDS) {
        try {
            const xml = await fetchText(feed);
            items.push(...parseRssItems(xml, new URL(feed).hostname));
        } catch (err) {
            console.log(`Gagal ambil RSS ${feed}:`, err.message);
        }
    }

    const keywords = /\b(bitcoin|btc|ethereum|eth|bnb|binance|gold|paxg|xaut|fed|rate|inflation|etf|stablecoin|regulation|crypto)\b/i;
    const unique = [];
    const seen = new Set();
    for (const item of items) {
        const key = item.title.toLowerCase();
        if (!seen.has(key) && keywords.test(`${item.title} ${item.description}`)) {
            seen.add(key);
            unique.push(item);
        }
    }

    memoryCache.news = { at: Date.now(), items: unique.slice(0, 12) };
    return memoryCache.news.items;
}

async function summarizeNews(assetText = "") {
    const items = await getCryptoNews();
    const asset = normalizeAsset(assetText);
    const filtered = asset
        ? items.filter(item => new RegExp(`\\b(${asset.asset}|${asset.name}|${asset.symbol}|crypto|market|binance|gold|fed|etf)\\b`, "i").test(`${item.title} ${item.description}`))
        : items;
    const selected = (filtered.length ? filtered : items).slice(0, 6);

    if (!selected.length) {
        return "Belum berhasil mengambil berita crypto terbaru. Coba lagi beberapa menit lagi.";
    }

    if (!ai) {
        let text = `BERITA PASAR CRYPTO\nUpdate: ${nowText()}\n\n`;
        selected.slice(0, 5).forEach((item, index) => {
            text += `${index + 1}. ${item.title}\n${item.link}\n\n`;
        });
        text += "Isi GEMINI_API_KEY untuk ringkasan dampak pasar otomatis.";
        return text.trim();
    }

    const prompt = `Kamu analis pasar crypto berbahasa Indonesia.
Ringkas berita berikut untuk trader dan investor Binance. Fokus pada dampak ke BTC, ETH, BNB, PAXG, XAUT.
Berikan output singkat:
1. Sentimen pasar
2. Dampak potensial
3. Risiko utama
4. Koin yang perlu dipantau
5. Judul sumber ringkas

Berita:
${selected.map((item, index) => `${index + 1}. ${item.title}\n${item.description}\nSumber: ${item.source}\nLink: ${item.link}`).join("\n\n")}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });
        const text = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "";
        return `ANALISIS BERITA CRYPTO\nUpdate: ${nowText()}\n\n${text.trim()}`;
    } catch (err) {
        console.log("Gemini news error:", err.message);
        return selected.map((item, index) => `${index + 1}. ${item.title}\n${item.link}`).join("\n\n");
    }
}

function menuText(jid) {
    return `BOT ANALISA CRYPTO BINANCE

Watchlist realtime:
PAXG, XAUT, BTC, BNB, ETH

Perintah utama:
- harga
- harga BTC
- analisa BTC
- analisa ETH investor
- analisa BNB trader
- berita
- berita BTC
- alert on
- alert off
- mode trader
- mode investor
- status

Fitur:
- harga realtime dari Binance
- sinyal ENTRY, SELL, atau WAIT
- monitor otomatis setiap ${MONITOR_INTERVAL_SECONDS} detik
- alert otomatis saat sinyal kuat muncul
- analisis berita internet via RSS dan Gemini
- mode trader lebih agresif, mode investor lebih selektif

Mode kamu sekarang: ${subscriberMode(jid).toUpperCase()}`;
}

async function sendSafe(jid, text) {
    if (!sockGlobal || !jid || !text) return;
    try {
        await sockGlobal.sendMessage(jid, { text });
    } catch (err) {
        console.log(`Gagal kirim ke ${jid}:`, err.message);
    }
}

function canSendAlert(jid, asset, action) {
    const key = `${jid}:${asset}:${action}`;
    const last = state.lastAlerts[key] || 0;
    return Date.now() - last > SIGNAL_COOLDOWN_MINUTES * 60 * 1000;
}

function markAlertSent(jid, asset, action) {
    state.lastAlerts[`${jid}:${asset}:${action}`] = Date.now();
    saveState();
}

async function runMarketMonitor() {
    const recipients = getAllRecipients();
    if (!sockGlobal || recipients.length === 0) return;

    for (const item of WATCHLIST) {
        let result;
        try {
            result = await analyzeAsset(item, DEFAULT_MODE);
        } catch (err) {
            console.log(`Monitor gagal ${item.asset}:`, err.message);
            continue;
        }

        if (!["ENTRY", "SELL"].includes(result.signal.action)) {
            await sleep(250);
            continue;
        }

        for (const jid of recipients) {
            const mode = subscriberMode(jid);
            const perUserResult = mode === result.mode ? result : await analyzeAsset(item, mode);
            if (!["ENTRY", "SELL"].includes(perUserResult.signal.action)) continue;
            if (!canSendAlert(jid, item.asset, perUserResult.signal.action)) continue;

            const title = perUserResult.signal.action === "ENTRY" ? "ALERT ENTRY" : "ALERT SELL";
            await sendSafe(jid, `${title}\n\n${buildAnalysisMessage(perUserResult)}`);
            markAlertSent(jid, item.asset, perUserResult.signal.action);
            await sleep(300);
        }
    }
}

function startMarketMonitor() {
    if (monitorTimer) clearInterval(monitorTimer);
    monitorTimer = setInterval(() => {
        runMarketMonitor().catch(err => console.log("Monitor error:", err.message));
    }, MONITOR_INTERVAL_SECONDS * 1000);

    setTimeout(() => {
        runMarketMonitor().catch(err => console.log("Monitor awal error:", err.message));
    }, 10_000);
}

function startKeepAliveServer() {
    const server = http.createServer((req, res) => {
        if (req.url === "/" || req.url === "/health") {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                status: "online",
                bot: sockGlobal ? "aktif_atau_mencoba_koneksi" : "belum_aktif",
                watchlist: WATCHLIST.map(item => item.asset),
                subscribers: Object.values(state.subscribers).filter(item => item.active).length,
                reconnect: jumlahReconnect,
                monitor_interval_seconds: MONITOR_INTERVAL_SECONDS,
                time: nowText()
            }));
            return;
        }
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
    });

    server.listen(PORT, () => {
        console.log(`Keep-alive server aktif di port ${PORT}`);
    });

    setInterval(() => {
        console.log(`Bot masih hidup: ${nowText()}`);
    }, 5 * 60 * 1000);
}

function cleanupSocket() {
    try {
        if (sockGlobal?.ev?.removeAllListeners) {
            sockGlobal.ev.removeAllListeners("connection.update");
            sockGlobal.ev.removeAllListeners("messages.upsert");
            sockGlobal.ev.removeAllListeners("creds.update");
        }
        if (sockGlobal?.ws?.close) sockGlobal.ws.close();
    } catch (err) {
        console.log("Cleanup socket dilewati:", err.message);
    }
    sockGlobal = null;
}

function jadwalkanReconnect(alasan = "koneksi terputus", jedaKhusus = null) {
    if (reconnectTimer) return;

    jumlahReconnect++;
    const jeda = jedaKhusus || Math.min(5000 + jumlahReconnect * 3000, 60000);
    console.log(`Reconnect karena ${alasan}. Coba lagi dalam ${jeda / 1000} detik.`);

    reconnectTimer = setTimeout(async () => {
        reconnectTimer = null;
        sedangStart = false;
        cleanupSocket();
        await startBot();
    }, jeda);
}

async function ambilNomorWhatsApp() {
    if (!WHATSAPP_PHONE_NUMBER || WHATSAPP_PHONE_NUMBER.length < 10) {
        throw new Error("WHATSAPP_PHONE_NUMBER belum diisi. Contoh: 6281234567890");
    }
    return WHATSAPP_PHONE_NUMBER;
}

async function handleMessage(sock, msg) {
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        msg.message.videoMessage?.caption ||
        "";

    if (!text && msg.message.audioMessage) {
        return sock.sendMessage(from, { text: "VN belum didukung. Tolong ketik perintah dalam bentuk teks." });
    }
    if (!text) return;

    const pesan = text.trim();
    const lower = pesan.toLowerCase();

    try {
        if (/^(menu|help|bantuan|fitur|panduan|cara pakai)$/i.test(lower)) {
            return sock.sendMessage(from, { text: menuText(from) });
        }

        if (/^(alert|sinyal|monitor)\s+on$/i.test(lower)) {
            state.subscribers[from] = {
                active: true,
                mode: subscriberMode(from),
                updatedAt: new Date().toISOString()
            };
            saveState();
            return sock.sendMessage(from, { text: `Alert otomatis aktif. Mode: ${subscriberMode(from).toUpperCase()}.` });
        }

        if (/^(alert|sinyal|monitor)\s+off$/i.test(lower)) {
            state.subscribers[from] = {
                ...(state.subscribers[from] || {}),
                active: false,
                updatedAt: new Date().toISOString()
            };
            saveState();
            return sock.sendMessage(from, { text: "Alert otomatis dimatikan untuk nomor ini." });
        }

        if (/^mode\s+(trader|investor)$/i.test(lower)) {
            const mode = lower.includes("investor") ? "investor" : "trader";
            state.subscribers[from] = {
                ...(state.subscribers[from] || {}),
                active: state.subscribers[from]?.active ?? true,
                mode,
                updatedAt: new Date().toISOString()
            };
            saveState();
            return sock.sendMessage(from, { text: `Mode diubah ke ${mode.toUpperCase()}. Alert otomatis juga aktif untuk nomor ini.` });
        }

        if (/^(status|cek status)$/i.test(lower)) {
            const active = state.subscribers[from]?.active ? "AKTIF" : "OFF";
            return sock.sendMessage(from, {
                text: `STATUS BOT
Koneksi: online
Alert nomor ini: ${active}
Mode: ${subscriberMode(from).toUpperCase()}
Watchlist: ${WATCHLIST.map(item => item.asset).join(", ")}
Interval monitor: ${MONITOR_INTERVAL_SECONDS} detik
Cooldown alert: ${SIGNAL_COOLDOWN_MINUTES} menit
Update: ${nowText()}`
            });
        }

        if (/^(harga|price|cek harga|daftar harga)\b/i.test(lower)) {
            const asset = normalizeAsset(pesan);
            if (asset) {
                const ticker = await getTicker(asset.symbol);
                const digits = ticker.price >= 100 ? 2 : 4;
                return sock.sendMessage(from, {
                    text: `${asset.asset}/USDT realtime Binance
Harga: ${formatUsd(ticker.price, digits)}
24j: ${formatPct(ticker.changePct)}
High: ${formatUsd(ticker.high, digits)}
Low: ${formatUsd(ticker.low, digits)}
Volume quote: ${formatUsd(ticker.quoteVolume, 0)}
Update: ${nowText()}`
                });
            }
            return sock.sendMessage(from, { text: buildPriceMessage(await getAllPrices()) });
        }

        if (/^(analisa|analisis|signal|sinyal|entry|sell)\b/i.test(lower)) {
            const asset = normalizeAsset(pesan);
            if (!asset) {
                return sock.sendMessage(from, { text: "Sebutkan koinnya. Contoh: analisa BTC, analisa PAXG investor." });
            }
            const mode = /\binvestor\b/i.test(lower) ? "investor" : /\btrader\b/i.test(lower) ? "trader" : subscriberMode(from);
            const result = await analyzeAsset(asset, mode);
            return sock.sendMessage(from, { text: buildAnalysisMessage(result) });
        }

        if (/^(berita|news|kabar pasar)\b/i.test(lower)) {
            return sock.sendMessage(from, { text: await summarizeNews(pesan) });
        }

        if (/^(watchlist|koin)$/i.test(lower)) {
            return sock.sendMessage(from, { text: `Watchlist: ${WATCHLIST.map(item => `${item.asset} (${item.symbol})`).join(", ")}` });
        }

        return sock.sendMessage(from, {
            text: `Saya belum paham perintahnya.

Coba:
- harga
- harga BTC
- analisa BTC
- berita
- alert on
- mode investor

Ketik menu untuk daftar lengkap.`
        });
    } catch (err) {
        console.error("Error proses pesan:", err.message || err);
        return sock.sendMessage(from, {
            text: `Gagal memproses data realtime: ${err.message || "unknown error"}. Coba lagi beberapa saat lagi.`
        });
    }
}

async function startBot() {
    if (sedangStart) {
        console.log("Bot sedang start, proses dobel dilewati.");
        return;
    }

    sedangStart = true;

    try {
        console.log("Memulai Bot Analisa Crypto Binance...");
        console.log("Metode login WhatsApp: pairing code.");

        cleanupSocket();

        const { state: authState, saveCreds } = await useMultiFileAuthState("./session");
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: authState,
            logger: pino({ level: "silent" }),
            printQRInTerminal: false,
            browser: ["Ubuntu", "Chrome", "20.0.04"],
            connectTimeoutMs: 90_000,
            keepAliveIntervalMs: 30_000,
            retryRequestDelayMs: 5_000,
            markOnlineOnConnect: false,
            syncFullHistory: false,
            shouldIgnoreJid: jid => jid?.includes("@broadcast")
        });

        sockGlobal = sock;
        sock.ev.on("creds.update", saveCreds);

        sock.ev.on("connection.update", async ({ connection, qr, lastDisconnect }) => {
            if (qr) console.log("QR diterima tapi diabaikan. Script ini memakai pairing code.");
            if (connection === "connecting") console.log("Menghubungkan ke WhatsApp...");

            if (connection === "open") {
                console.log("Bot Analisa Crypto terhubung dan online.");
                sedangStart = false;
                jumlahReconnect = 0;
                if (reconnectTimer) {
                    clearTimeout(reconnectTimer);
                    reconnectTimer = null;
                }
                startMarketMonitor();
                if (OWNER_JID) {
                    await sendSafe(OWNER_JID, `Bot Analisa Crypto online.\nKetik menu untuk melihat fitur.\nUpdate: ${nowText()}`);
                }
            }

            if (connection === "close") {
                sedangStart = false;
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const alasan = lastDisconnect?.error?.message || "unknown";
                const alasanLower = String(alasan).toLowerCase();

                console.log(`Koneksi terputus. Status: ${statusCode || "unknown"}`);
                console.log(`Alasan: ${alasan}`);
                cleanupSocket();

                if (statusCode === DisconnectReason.loggedOut) {
                    console.log("WhatsApp logout. Hapus folder session lalu deploy ulang untuk login lagi.");
                    return;
                }
                if (statusCode === 440 || alasanLower.includes("conflict")) return jadwalkanReconnect("conflict session WhatsApp", 60000);
                if (statusCode === 408 || alasanLower.includes("timed out")) return jadwalkanReconnect("timeout koneksi", 20000);
                if (statusCode === 515) return jadwalkanReconnect("restart required", 15000);
                jadwalkanReconnect("WhatsApp close", 20000);
            }
        });

        sock.ev.on("messages.upsert", async ({ messages }) => {
            try {
                const msg = messages?.[0];
                if (!msg) return;
                await handleMessage(sock, msg);
            } catch (err) {
                console.error("Error messages.upsert:", err.message || err);
            }
        });

        if (!sock.authState.creds.registered) {
            const nomorWhatsApp = await ambilNomorWhatsApp();

            console.log("Menunggu koneksi siap sebelum meminta kode...");
            await tunggu(5000);

            console.log("Meminta kode masuk WhatsApp...");
            console.log(`Nomor WhatsApp: ${nomorWhatsApp}`);

            try {
                const kodeLogin = await sock.requestPairingCode(nomorWhatsApp);
                const kodeRapi = String(kodeLogin).match(/.{1,4}/g)?.join("-") || kodeLogin;
                console.log("========================================");
                console.log(`KODE MASUK WHATSAPP: ${kodeRapi}`);
                console.log("========================================");
                console.log("Cara pakai:");
                console.log("1. Buka WhatsApp di HP");
                console.log("2. Masuk ke Perangkat tertaut");
                console.log("3. Pilih Tautkan perangkat");
                console.log("4. Pilih Tautkan dengan nomor telepon");
                console.log("5. Masukkan kode di atas");
            } catch (err) {
                console.log("Gagal meminta kode masuk:", err.message || err);
                sedangStart = false;
                cleanupSocket();
                jadwalkanReconnect("gagal meminta pairing code", 30000);
                return;
            }
        } else {
            console.log("Session WhatsApp sudah terdaftar. Tidak perlu kode masuk lagi.");
        }

        sedangStart = false;
    } catch (err) {
        sedangStart = false;
        cleanupSocket();
        console.error("Gagal start bot:", err.message || err);
        jadwalkanReconnect("gagal start bot", 30000);
    }
}

process.on("uncaughtException", err => {
    console.error("uncaughtException:", err.message || err);
    jadwalkanReconnect("uncaughtException", 15000);
});

process.on("unhandledRejection", err => {
    console.error("unhandledRejection:", err?.message || err);
    jadwalkanReconnect("unhandledRejection", 15000);
});

process.on("SIGINT", () => {
    console.log("Bot dihentikan manual.");
    cleanupSocket();
    process.exit(0);
});

process.on("SIGTERM", () => {
    console.log("Bot menerima SIGTERM.");
    cleanupSocket();
    process.exit(0);
});

startKeepAliveServer();
startBot();
