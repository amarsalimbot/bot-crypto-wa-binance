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

- Harga realtime dari Binance public API.
- Default `auto`: Binance dicoba lebih dulu, CoinGecko dipakai hanya saat Binance error/restricted/rate limit.
- Mode trading Binance Spot berbasis perintah WhatsApp dengan default aman `paper`.
- Manual market/limit buy-sell, open orders, cancel order, balance, positions, dan report.
- Order book imbalance, demand/sell pressure, buy wall/sell wall, taker buy ratio, spread, dan entry check.
- Live trading hanya aktif jika `TRADING_MODE=live`, `ENABLE_LIVE_TRADING=true`, serta Binance API key dan secret sudah diisi.
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
/auto_status
/bot_on
/bot_off
/balance
/price BTCUSDT
/buy_market BTCUSDT 50
/sell_market BTCUSDT 50
/buy_limit BTCUSDT 50 60000
/sell_limit BTCUSDT 50 65000
/sell_all BTCUSDT
/open_orders BTCUSDT
/cancel_order BTCUSDT ORDER_ID
/orderbook BTCUSDT
/demand BTCUSDT
/sell_pressure BTCUSDT
/market_pressure BTCUSDT
/wall BTCUSDT
/entry_check BTCUSDT 60000
/set_risk 1
/set_daily_loss 5
/positions
/report
/confirm KODE
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
COINGECKO_API_KEY=isi_api_key_coingecko_anda
COINGECKO_API_TYPE=demo
BINANCE_API_KEY=isi_api_key_binance_opsional
BINANCE_SECRET_KEY=isi_secret_key_binance_opsional
BINANCE_API_BASES=https://api.binance.com,https://data-api.binance.vision
APP_TIMEZONE=Asia/Makassar
PORT=7860
MARKET_DATA_PROVIDER=auto
TRADING_MODE=paper
ENABLE_LIVE_TRADING=false
ENABLE_MANUAL_TRADE=true
ENABLE_AUTO_TRADE=true
AUTO_TRADING=false
CONFIRM_MANUAL_ORDER=true
PAPER_USDT_BALANCE=1000
RISK_PER_TRADE=1
MAX_DAILY_LOSS=5
MAX_TRADES_PER_DAY=5
COOLDOWN_AFTER_LOSS_MINUTES=60
MIN_SIGNAL_SCORE=75
MIN_RISK_REWARD=1.5
ORDERBOOK_DEPTH_LIMIT=100
ORDERBOOK_IMBALANCE_THRESHOLD=0.20
BUY_PRESSURE_THRESHOLD=0.60
SELL_PRESSURE_THRESHOLD=0.60
ENABLE_WALL_DETECTION=true
WALL_VOLUME_MULTIPLIER=3
MAX_SPREAD_PERCENT=0.15
MAX_SLIPPAGE_PERCENT=0.30
ENABLE_ANTI_FOMO=true
MAX_RSI_BUY=70
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
- `COINGECKO_API_KEY` dipakai sebagai fallback harga/candle saat Binance error. Di Railway, isi variable ini dengan API key CoinGecko Anda.
- `COINGECKO_API_TYPE` isi `demo` untuk Demo API/free key, atau `pro` jika key Anda adalah CoinGecko Pro. Default `demo`.
- `BINANCE_API_KEY` opsional. Endpoint harga/candle Binance public tidak wajib API key, tetapi jika variable ini diisi bot akan mengirimnya sebagai header `X-MBX-APIKEY`.
- `BINANCE_SECRET_KEY` hanya diperlukan untuk fitur akun/order live seperti balance live, open orders live, dan order live.
- `BINANCE_API_BASES` daftar endpoint Binance yang dicoba berurutan. Default mencoba `api.binance.com` lalu `data-api.binance.vision`.
- `MARKET_DATA_PROVIDER` bisa `auto`, `binance`, atau `coingecko`. Default `auto`: Binance realtime lebih dulu, lalu CoinGecko fallback jika Binance error.
- `TRADING_MODE=paper` membuat semua order manual hanya simulasi dan tidak dikirim ke Binance. Ubah ke `live` hanya setelah siap.
- `ENABLE_LIVE_TRADING=false` adalah pengunci tambahan. Live order baru dikirim jika `TRADING_MODE=live` dan `ENABLE_LIVE_TRADING=true`.
- `CONFIRM_MANUAL_ORDER=true` membuat perintah buy/sell hanya membuat preview dulu. Kirim `/confirm KODE` untuk mengeksekusi.
- `PAPER_USDT_BALANCE` saldo simulasi awal untuk paper trading.
- `RISK_PER_TRADE`, `MAX_DAILY_LOSS`, dan `MAX_TRADES_PER_DAY` dipakai untuk status dan validasi dasar agar bot tidak overtrading.
- `ORDERBOOK_DEPTH_LIMIT`, `ORDERBOOK_IMBALANCE_THRESHOLD`, `BUY_PRESSURE_THRESHOLD`, dan `SELL_PRESSURE_THRESHOLD` mengatur analisis demand/sell pressure.
- `ENABLE_WALL_DETECTION` dan `WALL_VOLUME_MULTIPLIER` mengatur deteksi buy wall dan sell wall.
- `MAX_SPREAD_PERCENT`, `MIN_RISK_REWARD`, `ENABLE_ANTI_FOMO`, dan `MAX_RSI_BUY` dipakai oleh entry check dan scoring anti-FOMO.
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
- `BINANCE_ERROR_COOLDOWN_SECONDS` membuat bot sebentar melewati Binance saat terjadi error sementara seperti `429`, `5xx`, timeout, atau network error.
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

## Trading Spot dan Market Pressure

Default bot adalah `TRADING_MODE=paper`, jadi perintah order tidak mengirim transaksi live ke Binance. Perintah seperti `/buy_market BTCUSDT 50` akan membuat preview order. Jika `CONFIRM_MANUAL_ORDER=true`, bot memberi kode konfirmasi dan order baru diproses setelah Anda mengetik `/confirm KODE`.

Untuk live trading, isi `BINANCE_API_KEY`, `BINANCE_SECRET_KEY`, `TRADING_MODE=live`, dan `ENABLE_LIVE_TRADING=true`. Gunakan API key khusus Spot Trading, jangan aktifkan izin withdraw, dan mulai dari nominal kecil.

Perintah analisis market pressure:

```text
/orderbook BTCUSDT
/demand BTCUSDT
/sell_pressure BTCUSDT
/market_pressure BTCUSDT
/wall BTCUSDT
/entry_check BTCUSDT 60000
```

Analisis ini membaca order book Binance, bid/ask volume, imbalance, taker buy ratio dari candle, spread, buy wall, sell wall, support/resistance, RSI, dan risk/reward. Hasilnya adalah alat bantu keputusan, bukan jaminan arah harga.

## Railway, Binance, dan CoinGecko API Key

Tambahkan variable berikut di Railway agar harga utama tetap dari Binance dan fallback CoinGecko siap saat server Binance error:

```text
WHATSAPP_PHONE_NUMBER=6281234567890
MARKET_DATA_PROVIDER=auto
COINGECKO_API_KEY=api_key_coingecko_anda
COINGECKO_API_TYPE=demo
BINANCE_API_KEY=api_key_binance_opsional
BINANCE_SECRET_KEY=secret_key_binance_opsional_untuk_live_trading
TRADING_MODE=paper
ENABLE_LIVE_TRADING=false
CONFIRM_MANUAL_ORDER=true
TICKER_CACHE_SECONDS=20
CANDLE_CACHE_MINUTES=2
FORCE_REFRESH_DEDUP_SECONDS=10
```

Catatan:

- API key Binance tidak wajib untuk harga/candle public. Isi `BINANCE_API_KEY` hanya jika Anda memang ingin bot mengirim API key pada request Binance.
- Secret key Binance hanya diperlukan untuk fitur akun/order live. Mode aman Railway tetap `TRADING_MODE=paper` dan `ENABLE_LIVE_TRADING=false`.
- API key Binance tidak selalu menyelesaikan error lokasi/IP `451`; jika itu terjadi, bot otomatis memakai CoinGecko selama cooldown.
- Jika API key CoinGecko Anda dari paket Demo/free, biarkan `COINGECKO_API_TYPE=demo`. Jika dari paket Pro, isi `COINGECKO_API_TYPE=pro`.

Rekomendasi supaya harga tetap akurat tetapi tidak cepat kena rate limit:

```text
MARKET_DATA_PROVIDER=auto
COINGECKO_API_KEY=api_key_anda
COINGECKO_API_TYPE=demo
TICKER_CACHE_SECONDS=20
CANDLE_CACHE_MINUTES=2
FORCE_REFRESH_DEDUP_SECONDS=10
```

Setelah deploy ulang, kirim perintah `status` ke WhatsApp bot. Baris `Provider market` harus tampil `AUTO (Binance -> CoinGecko fallback)`, dan baris `CoinGecko API` harus tampil `aktif (demo)` atau `aktif (pro)` jika key sudah diisi.

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
