# Nishon AI — Contabo (o'z serveringizda) deploy qo'llanmasi

Bu qo'llanma loyihani **Contabo (yoki istalgan Ubuntu VPS)** da bitta buyruq bilan
ishga tushiradi: Postgres + Redis + API + Web + Caddy (avtomatik HTTPS) — hammasi
Docker Compose orqali. Render'dagi variant `DEPLOY.md` da qoladi (ikkalasi ham ishlaydi).

Kerak bo'ladi: bitta domen (masalan `example.com`) va unga kirish (DNS sozlash).

---

## 1. Server tayyorlash (Ubuntu 22.04)

VPS'ga `root` sifatida SSH bilan kiring va Docker'ni o'rnating:

```bash
# Docker + compose plugin
curl -fsSL https://get.docker.com | sh
docker --version && docker compose version
```

Minimal resurs: **2 vCPU / 4 GB RAM** (web build uchun). Kamroq bo'lsa, image'larni
lokal kompyuterda build qilib, registry orqali yuborish tavsiya etiladi.

---

## 2. DNS yozuvlari

Domeningiz DNS panelida ikkita **A-record** qo'shing (VPS IP manzilingizga):

| Type | Name  | Value (IP)      |
|------|-------|-----------------|
| A    | `@`   | `<VPS_IP>`      |
| A    | `api` | `<VPS_IP>`      |

Natijada: web → `https://example.com`, API → `https://api.example.com`.
DNS tarqalishini kuting (bir necha daqiqa) — Caddy TLS sertifikatini shu asosda oladi.

---

## 3. Kodni klonlash va sozlash

```bash
git clone https://github.com/Elmun-Technologies/nishon-ai.git
cd nishon-ai

cp .env.contabo.example .env
nano .env         # to'ldiring (pastda tushuntirilgan)
```

`.env` da eng muhim maydonlar:
- `DOMAIN=example.com`, `ACME_EMAIL=siz@example.com`
- `POSTGRES_PASSWORD=` — kuchli parol
- `JWT_SECRET=` va `JWT_REFRESH_SECRET=` — har biri `openssl rand -hex 32`
- `ENCRYPTION_KEY=` — `openssl rand -hex 16` (aniq 32 belgi)
- `AI_PROVIDER` + `OPENAI_API_KEY` (yoki `anthropic` + `ANTHROPIC_API_KEY`)
- `META_APP_ID` / `META_APP_SECRET` (Meta reklama uchun)

Ixtiyoriy kalitlar (`FAL_KEY`, `TGSTAT_API_KEY`, `PAYME_*`, `TELEGRAM_BOT_TOKEN`,
`GOOGLE_CLIENT_ID/SECRET` va h.k.) bo'sh qolsa — mos funksiya "sozlanmagan" deб
halol ishlaydi, dastur baribir ko'tariladi.

Kalit generatsiya misoli:
```bash
echo "JWT_SECRET=$(openssl rand -hex 32)"
echo "JWT_REFRESH_SECRET=$(openssl rand -hex 32)"
echo "ENCRYPTION_KEY=$(openssl rand -hex 16)"
```

---

## 4. Ishga tushirish

```bash
docker compose -f docker-compose.contabo.yml up -d --build
```

Bu: image'larni build qiladi, DB migratsiyalarini avtomatik bajaradi
(API konteyneri `start:prod:with-migrations` bilan ishga tushadi), va Caddy
Let's Encrypt sertifikatini oladi.

Holatni tekshirish:
```bash
docker compose -f docker-compose.contabo.yml ps
docker compose -f docker-compose.contabo.yml logs -f api    # API loglari
curl -s https://api.example.com/ready                       # {"status":"ok"...} kutiladi
```

`/ready` DB yoki Redis o'lik bo'lsa 503 qaytaradi — shuning uchun ishonchli signal.

---

## 5. OAuth callback URL'larini ro'yxatdan o'tkazish

Yangi domeningizga moslab (bu qadam bo'lmasa OAuth ishlamaydi):

- **Meta** (developers.facebook.com → App → Facebook Login → Valid OAuth Redirect URIs):
  `https://api.example.com/meta/callback`
- **Google** (Cloud Console → Credentials → OAuth client → Authorized redirect URIs):
  `https://api.example.com/auth/google/callback`
- **Payme** webhook (agar ishlatilsa): `https://api.example.com/billing/payme`

---

## 6. Yangilanish (deploy)

```bash
cd nishon-ai
git pull
docker compose -f docker-compose.contabo.yml up -d --build
```

> Eslatma: `NEXT_PUBLIC_API_BASE_URL` web image'ga **build vaqtida** joylashadi.
> `DOMAIN` o'zgarsa, web'ni qayta build qiling (`--build` shuni bajaradi).

---

## 7. Zaxira nusxa (backup) — sizning zimmangizda

Render'dan farqli, self-host'da DB backup **sizning mas'uliyatingiz**. Kunlik
`pg_dump` cron misoli:

```bash
# crontab -e  → har kuni 03:00 da
0 3 * * * docker compose -f /root/nishon-ai/docker-compose.contabo.yml exec -T postgres \
  pg_dump -U nishon nishon | gzip > /root/backups/nishon-$(date +\%F).sql.gz
```

`/root/backups` papkasini oldindan yarating (`mkdir -p /root/backups`) va eski
nusxalarni tozalab turing.

---

## 8. Render vs Contabo — qisqacha

| | Render (managed) | Contabo (self-host) |
|---|---|---|
| HTTPS/TLS | avtomatik | Caddy avtomatik (bu setup) |
| DB backup | avtomatik | siz (pg_dump cron) |
| Deploy | git push → avto | `git pull && up -d --build` |
| Qayta ishga tushirish | avto health-check | Docker `restart: always` |
| Narx | qimmatroq | arzon, belgilangan |
| Ops yuki | past | yuqori (yangilanish, xavfsizlik, monitoring) |

Xulosa: **narx/nazorat** — Contabo; **soddalik** — Render. Bu setup Contabo'ni
bitta buyruqli deploy qiladi.

---

## 9. Muammolarni topish

| Belgi | Sabab | Yechim |
|------|-------|--------|
| TLS sertifikat olinmadi | DNS hali tarqalmagan / port 80,443 band | `dig api.example.com`, 80/443 ochiqligini tekshiring, `docker compose logs caddy` |
| API 503 `/ready` | Postgres/Redis ko'tarilmagan | `docker compose logs postgres redis` |
| `column ... does not exist` | migratsiya o'tmagan | `docker compose logs api` — migration xatosini ko'ring |
| Web'da eski API domeni | `NEXT_PUBLIC_API_BASE_URL` build'da eski | web'ni `--build` bilan qayta tuzing |
| RAM yetmadi (build) | 4 GB dan kam | swap qo'shing yoki image'ni lokalda build qiling |
