---
title: Bot Crypto WA Binance
emoji: BTC
colorFrom: yellow
colorTo: blue
sdk: docker
pinned: false
---

# Bot WhatsApp Analisa Crypto Binance

Bot WhatsApp berbasis Node.js + Baileys untuk memantau koin Binance secara realtime:

- PAXG/USDT
- XAUT/USDT
- BTC/USDT
- BNB/USDT
- ETH/USDT

Bot bisa menjawab harga realtime, membuat analisa teknikal, membaca berita crypto dari internet, mengirim alert otomatis, dan menjadi asisten AI WhatsApp untuk pertanyaan crypto maupun topik umum.

## Fitur

- Harga dan candle realtime dari Binance public API sebagai sumber utama.
- CoinGecko otomatis menjadi fallback hanya ketika Binance error, dibatasi lokasi, atau pair tidak tersedia.
- Analisa teknikal otomatis dengan RSI, EMA, MACD, volume, volatilitas, support, dan resistance.
- Sinyal `ENTRY`, `SELL`, atau `WAIT`.
- Mode `trader` untuk sinyal lebih cepat.
- Mode `investor` untuk sinyal lebih selektif.
- Alert otomatis ke WhatsApp ketika sinyal kuat muncul.
- Laporan market otomatis berkala tanpa perlu diminta manual.
- Laporan berisi arah kemungkinan koin, teknikal, fundamental/news terbaru, dan catatan risiko.
- Cooldown alert agar bot tidak spam.
- Analisis berita crypto dari RSS internet.
- ChatGPT/OpenAI sebagai AI utama memakai Responses API.
- Gemini otomatis menjadi fallback jika ChatGPT timeout, error, atau tidak memberi jawaban.
- Chat AI serbaguna dengan memori percakapan singkat per nomor WhatsApp.
- Pertanyaan crypto otomatis diperkaya harga, indikator, sinyal, dan berita terbaru dari sistem bot.
- Auto-chat untuk pesan pribadi; di grup AI hanya merespons jika diawali `ai`, `chatgpt`, `chat`, atau `tanya`.
- Ringkasan berita dan fundamental memakai router ChatGPT lalu Gemini fallback.
- Keep-alive HTTP endpoint untuk Railway/Hugging Face.
- Login WhatsApp memakai pairing code.

## Perintah WhatsApp

Ketik salah satu perintah berikut ke nomor bot:

```text
menu
ai jelaskan strategi DCA dengan sederhana
ai analisa risiko BTC sekarang
ai status
ai reset
ai retry
harga
harga BTC
harga ETH
analisa BTC
analisa ETH investor
analisa BNB trader
berita
berita BTC
laporan
watchlist
alert on
alert off
mode trader
mode investor
status
```

## Environment Variables

Variable wajib:

```text
WHATSAPP_PHONE_NUMBER=6281234567890
```

Variable opsional:

```text
OPENAI_API_KEY=isi_api_key_openai_anda
OPENAI_MODEL=gpt-5.4-mini
GEMINI_API_KEY=isi_api_key_gemini_anda
GEMINI_MODEL=gemini-2.5-flash
AI_AUTO_CHAT=true
AI_TIMEOUT_SECONDS=30
AI_PROVIDER_COOLDOWN_MINUTES=5
AI_HISTORY_TURNS=4
AI_HISTORY_TTL_MINUTES=60
AI_MAX_OUTPUT_TOKENS=1200
AI_MAX_OUTPUT_CHARS=3500
BINANCE_API_KEY=opsional_api_key_binance_anda
BINANCE_API_BASE=https://api.binance.com
COINGECKO_API_KEY=isi_api_key_coingecko_anda
COINGECKO_API_TYPE=demo
APP_TIMEZONE=Asia/Makassar
PORT=7860
MONITOR_INTERVAL_SECONDS=60
SIGNAL_COOLDOWN_MINUTES=45
DEFAULT_MODE=trader
AUTO_REPORT_ENABLED=true
AUTO_REPORT_MODE=candle
AUTO_REPORT_INTERVAL_MINUTES=60
AUTO_REPORT_START_DELAY_SECONDS=90
TRADER_CANDLE_MINUTES=15
INVESTOR_CANDLE_MINUTES=60
CANDLE_REPORT_DELAY_SECONDS=20
TICKER_CACHE_SECONDS=20
CANDLE_CACHE_MINUTES=2
FORCE_REFRESH_ON_REQUEST=true
FORCE_REFRESH_DEDUP_SECONDS=10
BINANCE_RESTRICTED_COOLDOWN_MINUTES=360
BINANCE_ERROR_COOLDOWN_SECONDS=60
COINGECKO_RATE_COOLDOWN_MINUTES=10
```

Keterangan:

- `WHATSAPP_PHONE_NUMBER` adalah nomor WhatsApp bot dalam format internasional tanpa tanda plus.
- `OPENAI_API_KEY` mengaktifkan ChatGPT sebagai AI prioritas pertama.
- `OPENAI_MODEL` mengatur model OpenAI. Default `gpt-5.4-mini` agar respons cepat dan biaya lebih ringan.
- `GEMINI_API_KEY` mengaktifkan Gemini sebagai fallback otomatis jika OpenAI tidak merespons.
- `GEMINI_MODEL` mengatur model Gemini fallback.
- `AI_AUTO_CHAT=true` membuat pesan biasa di chat pribadi diteruskan ke AI setelah tidak cocok dengan perintah bot.
- `AI_TIMEOUT_SECONDS` menentukan berapa lama bot menunggu satu provider sebelum mencoba fallback.
- `AI_PROVIDER_COOLDOWN_MINUTES` mencegah provider yang sedang error dicoba berulang kali pada setiap pesan.
- `AI_HISTORY_TURNS` menentukan jumlah percakapan terakhir yang dijadikan konteks, maksimal 10.
- `AI_HISTORY_TTL_MINUTES` menghapus memori chat yang sudah tidak aktif.
- `AI_MAX_OUTPUT_TOKENS` membatasi keluaran model OpenAI agar biaya dan durasi lebih terkendali.
- `AI_MAX_OUTPUT_CHARS` memotong jawaban terlalu panjang agar aman dikirim melalui WhatsApp.
- `BINANCE_API_KEY` opsional. Endpoint harga/candle publik Binance tetap berjalan tanpa key. Jangan masukkan Binance secret key karena bot tidak membutuhkannya.
- `BINANCE_API_BASE` mengatur host Binance Spot API. Default `https://api.binance.com`.
- `COINGECKO_API_KEY` dipakai untuk mengirim API key CoinGecko pada request harga dan candle. Di Railway, isi variable ini dengan API key CoinGecko Anda.
- `COINGECKO_API_TYPE` isi `demo` untuk Demo API/free key, atau `pro` jika key Anda adalah CoinGecko Pro. Default `demo`.
- Bot selalu mencoba Binance realtime terlebih dahulu. Variable lama `MARKET_DATA_PROVIDER` tidak lagi diperlukan dan tidak dapat memaksa CoinGecko menjadi sumber utama.
- `MONITOR_INTERVAL_SECONDS` minimal 30 detik.
- `SIGNAL_COOLDOWN_MINUTES` mencegah alert berulang untuk koin dan arah sinyal yang sama.
- `DEFAULT_MODE` bisa `trader` atau `investor`.
- `AUTO_REPORT_ENABLED=true` membuat bot mengirim laporan otomatis setelah online.
- `AUTO_REPORT_MODE` bisa `candle`, `interval`, atau `both`. Default `candle`.
- `TRADER_CANDLE_MINUTES=15` membuat laporan trader dikirim setelah candle 15 menit close.
- `INVESTOR_CANDLE_MINUTES=60` membuat laporan investor dikirim setelah candle 1 jam close.
- `CANDLE_REPORT_DELAY_SECONDS=20` memberi jeda setelah candle close agar data market sudah update.
- `AUTO_REPORT_INTERVAL_MINUTES` hanya dipakai jika `AUTO_REPORT_MODE=interval` atau `both`.
- `AUTO_REPORT_START_DELAY_SECONDS` mengatur jeda laporan pertama setelah bot online.
- `TICKER_CACHE_SECONDS` default 20 detik agar harga tetap segar tanpa mudah kena rate limit.
- `CANDLE_CACHE_MINUTES` default 2 menit. Candle terakhir tetap disinkronkan dengan harga live terbaru.
- `FORCE_REFRESH_ON_REQUEST=true` membuat perintah `harga`, `analisa`, dan laporan otomatis mengambil harga terbaru.
- `FORCE_REFRESH_DEDUP_SECONDS` mencegah force refresh 5 koin menjadi 5 request batch beruntun.
- `BINANCE_RESTRICTED_COOLDOWN_MINUTES` membuat bot berhenti sementara mencoba Binance jika server terkena blokir lokasi `451`.
- `BINANCE_ERROR_COOLDOWN_SECONDS` menentukan cooldown singkat saat Binance mengalami error sementara sebelum bot mencoba Binance lagi.
- `COINGECKO_RATE_COOLDOWN_MINUTES` membuat bot memakai cache dulu saat CoinGecko membalas `429`.

Monitor otomatis mengecek 1 koin per siklus. Dengan watchlist 5 koin dan interval 60 detik, semua koin akan diputar sekitar 5 menit sekali. Laporan otomatis default mengikuti pergantian candle: trader 15m dan investor 1h.

## Cara Kerja AI dan Fallback

Urutan provider selalu:

1. ChatGPT/OpenAI dari `OPENAI_API_KEY`.
2. Gemini dari `GEMINI_API_KEY` jika OpenAI timeout, error, atau jawabannya kosong.
3. Fallback non-AI untuk berita/laporan agar fitur utama bot tetap berjalan.

Contoh konfigurasi Railway:

```text
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.4-mini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
AI_AUTO_CHAT=true
AI_TIMEOUT_SECONDS=30
AI_PROVIDER_COOLDOWN_MINUTES=5
```

Kirim `ai status` untuk mengecek provider. Kirim `ai reset` untuk menghapus memori percakapan nomor tersebut. Kirim `ai retry` untuk menghapus cooldown provider dan langsung mencoba ChatGPT lagi. Kunci API tidak pernah ditampilkan pada pesan status.

## Prioritas Binance dan Fallback CoinGecko

Gunakan konfigurasi berikut di Railway:

```text
BINANCE_API_KEY=opsional_api_key_binance_anda
COINGECKO_API_KEY=api_key_anda
COINGECKO_API_TYPE=demo
FORCE_REFRESH_ON_REQUEST=true
TICKER_CACHE_SECONDS=20
BINANCE_ERROR_COOLDOWN_SECONDS=60
```

`harga BTC`, `analisa BTC`, dan laporan otomatis akan mencoba Binance terlebih dahulu. Jika Binance gagal, jawaban akan menampilkan sumber `CoinGecko fallback`. Pair yang memang tidak tersedia di Binance juga otomatis memakai CoinGecko tanpa mematikan Binance untuk pair lain.

Setelah deploy ulang, kirim perintah `status`. Baris prioritas market harus menampilkan `Binance realtime utama -> CoinGecko fallback`.

## Cara Menjalankan Lokal

```bash
npm ci
npm start
```

Dependency dikunci di `package-lock.json` agar versi yang dipakai lokal, Docker, dan deploy tetap konsisten.

Saat pertama kali jalan, bot akan menampilkan pairing code di log terminal. Masukkan kode itu di WhatsApp:

1. Buka WhatsApp di HP.
2. Masuk ke Perangkat tertaut.
3. Pilih Tautkan perangkat.
4. Pilih Tautkan dengan nomor telepon.
5. Masukkan kode dari terminal.

## Deploy Docker

Project ini sudah memakai `Dockerfile`.

```bash
docker build -t bot-crypto-wa .
docker run --env WHATSAPP_PHONE_NUMBER=6281234567890 --env OPENAI_API_KEY=xxx --env GEMINI_API_KEY=xxx -p 7860:7860 bot-crypto-wa
```

## Catatan Penting

Bot ini bukan penasihat keuangan. Sinyal yang dikirim adalah analisis probabilitas dari data pasar dan berita, bukan jaminan profit. Selalu gunakan risk management, stop loss, ukuran posisi yang sehat, dan cek ulang kondisi market sebelum entry.
