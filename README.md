# ترنج — وب‌سایت مزون لباس عروس

وب‌سایت مزون با **پرو آنلاین مبتنی بر هوش مصنوعی** (Google Gemini / Nano Banana)، کیف اعتبار، دعوت دوستان و **لندینگ تعاملی WebGL**.

اسناد مرجع:

- [PRD — نیازمندی‌های محصول](docs/PRD.md)
- [TRD — نیازمندی‌های فنی](docs/TRD.md)
- [مهارت‌های موردنیاز تیم](docs/SKILLS.md)

## پشته فنی

| بخش | فناوری |
| --- | --- |
| وب‌اپ | Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 (RTL، فونت وزیرمتن self-host) |
| پایگاه داده | PostgreSQL + Prisma 7 |
| صف | Redis + BullMQ (Worker جدا برای تولید تصویر) |
| ذخیره فایل | S3-compatible (در توسعه: RustFS در docker compose) |
| تولید تصویر | `@google/genai` با الگوی Provider (Gemini یا mock) |
| لندینگ | Three.js + React Three Fiber + شیدرهای GLSL |
| پرداخت | زرین‌پال (+ درگاه mock برای توسعه) |
| پیامک | کاوه‌نگار (+ mock برای توسعه) |

## ساختار پروژه

```
/docs                         # PRD، TRD، مهارت‌ها
/prisma
  schema.prisma               # مدل داده (TRD §5)
  migrations/                 # مایگریشن‌ها
  seed.ts                     # داده اولیه (لباس‌ها، بسته‌ها، تنظیمات)
/public/landing               # دارایی‌های لندینگ (بافت، نقشه عمق، پوستر، config)
/scripts
  generate-assets.ts          # تولید آفلاین دارایی‌های لندینگ با Gemini Pro (TRD §7.6)
  generate-placeholder-assets.ts # دارایی‌های placeholder بدون نیاز به API
/src
  /app
    (site)/page.tsx           # لندینگ
    (site)/gowns/...          # گالری و جزئیات مدل
    (site)/booking/...        # رزرو وقت پرو حضوری
    (site)/account/...        # پروفایل، پرو آنلاین، کیف اعتبار، دعوت
    admin/...                 # پنل مدیر
    api/...                   # Route Handlers
  /components/landing         # صحنه WebGL و fallback
  /components/ui              # اجزای مشترک رابط
  /lib/ai                     # Provider تولید تصویر (Gemini / mock)
  /lib/credits                # منطق ledger، سهمیه و دعوت
  /lib/payments               # درگاه پرداخت
  /lib/sms                    # سرویس پیامک
  /lib/storage                # فضای ذخیره‌سازی و URL امضاشده
  /lib/auth                   # OTP، نشست، نقش‌ها
/worker                       # پردازنده صف (پرو آنلاین، حذف خودکار عکس‌ها)
docker-compose.yml            # Postgres، Redis، Storage (+ web و worker با profile app)
```

## راه‌اندازی توسعه

پیش‌نیاز: Node.js 22، Docker.

```bash
cp .env.example .env
docker compose up -d db redis storage
npm install            # prisma generate هم اجرا می‌شود
npm run db:migrate     # اعمال مایگریشن‌ها
npm run db:seed        # داده نمونه
npm run dev            # وب‌اپ روی http://localhost:3000
npm run worker         # در ترمینال جدا: Worker صف پرو
```

در حالت توسعه، `AI_PROVIDER=mock`، `SMS_PROVIDER=mock` و `PAYMENT_PROVIDER=mock` هستند؛ یعنی بدون هیچ کلیدی کل جریان (ورود OTP، پرو، شارژ، دعوت) قابل اجراست. کد OTP در کنسول سرور چاپ می‌شود و در محیط غیر production در پاسخ API هم برگردانده می‌شود.

شماره‌های موجود در `ADMIN_PHONES` پس از ورود نقش مدیر می‌گیرند و به `/admin` دسترسی دارند.

## دستورات

| دستور | کار |
| --- | --- |
| `npm run dev` | اجرای وب‌اپ |
| `npm run worker` | اجرای Worker صف |
| `npm run lint` / `npm run typecheck` / `npm test` | کیفیت کد |
| `npm run build` | build تولید |
| `npm run assets:placeholder` | ساخت دارایی‌های placeholder لندینگ |
| `npm run assets:generate` | تولید دارایی‌های واقعی لندینگ با Gemini Pro (نیازمند `GEMINI_API_KEY`) |

## استقرار

`docker compose --profile app up -d --build` وب‌اپ و Worker را همراه سرویس‌ها اجرا می‌کند. Worker می‌تواند جدا از وب‌اپ در منطقه‌ای مستقر شود که دسترسی قانونی به Gemini دارد (TRD §14).
