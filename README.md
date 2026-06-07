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

Bot bisa menjawab harga realtime, membuat analisa teknikal, membaca berita crypto dari internet, dan mengirim alert otomatis ketika muncul sinyal entry atau sell.

## Fitur

- Harga realtime dari Binance public API.
- Analisa teknikal otomatis dengan RSI, EMA, MACD, volume, volatilitas, support, dan resistance.
- Sinyal `ENTRY`, `SELL`, atau `WAIT`.
- Mode `trader` untuk sinyal lebih cepat.
- Mode `investor` untuk sinyal lebih selektif.
- Alert otomatis ke WhatsApp ketika sinyal kuat muncul.
- Laporan market otomatis berkala tanpa perlu diminta manual.
- Laporan berisi arah kemungkinan koin, teknikal, fundamental/news terbaru, dan catatan risiko.
- Cooldown alert agar bot tidak spam.
- Analisis berita crypto dari RSS internet.
- Ringkasan dampak berita memakai DeepSeek jika `DEEPSEEK_API_KEY` diisi.
- Keep-alive HTTP endpoint untuk Railway/Hugging Face.
- Login WhatsApp memakai pairing code.

## Perintah WhatsApp

Ketik salah satu perintah berikut ke nomor bot:

```text
menu
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
DEEPSEEK_API_KEY=isi_api_key_deepseek_anda
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions
APP_TIMEZONE=Asia/Makassar
PORT=7860
MARKET_DATA_PROVIDER=coingecko
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
COINGECKO_RATE_COOLDOWN_MINUTES=10
```

Keterangan:

- `WHATSAPP_PHONE_NUMBER` adalah nomor WhatsApp bot dalam format internasional tanpa tanda plus.
- `DEEPSEEK_API_KEY` dipakai untuk merangkum dampak berita. Tanpa ini, bot tetap jalan tetapi hanya menampilkan daftar berita.
- `DEEPSEEK_MODEL` default `deepseek-chat`.
- `DEEPSEEK_API_URL` default endpoint chat completion DeepSeek.
- `MARKET_DATA_PROVIDER` bisa `coingecko`, `auto`, atau `binance`. Gunakan `coingecko` jika server terkena error Binance `451 restricted location`.
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
- `COINGECKO_RATE_COOLDOWN_MINUTES` membuat bot memakai cache dulu saat CoinGecko membalas `429`.

Monitor otomatis mengecek 1 koin per siklus. Dengan watchlist 5 koin dan interval 60 detik, semua koin akan diputar sekitar 5 menit sekali. Laporan otomatis default mengikuti pergantian candle: trader 15m dan investor 1h.

## Cara Menjalankan Lokal

```bash
npm install
npm start
```

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
docker run --env WHATSAPP_PHONE_NUMBER=6281234567890 --env DEEPSEEK_API_KEY=xxx -p 7860:7860 bot-crypto-wa
```

## Catatan Penting

Bot ini bukan penasihat keuangan. Sinyal yang dikirim adalah analisis probabilitas dari data pasar dan berita, bukan jaminan profit. Selalu gunakan risk management, stop loss, ukuran posisi yang sehat, dan cek ulang kondisi market sebelum entry.
