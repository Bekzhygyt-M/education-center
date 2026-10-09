# Ta'lim markazi — boshqaruv tizimi

Ta'lim markazlari uchun Uzbek Latin tilidagi ichki tizim: o'qituvchilar, o'quvchilar, guruhlar, xonalar, haftalik jadval, darslar, davomat va dars rejalarini boshqaradi.

## Texnologiyalar

- Next.js 16 App Router va React 19
- TypeScript, Tailwind CSS, shadcn/Base UI
- PostgreSQL, Prisma 7 va `@prisma/adapter-pg`
- Auth.js credentials autentifikatsiyasi va bcrypt

## Lokal sozlash

1. PostgreSQL-da bo'sh `education_center_dev` bazasini yarating.
2. `.env.example` dan `.env` yarating:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/education_center_dev?schema=public"
AUTH_SECRET="uzun-tasodifiy-maxfiy-kalit"
AUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST="true"
```

3. Client, migratsiyalar va development server:

```bash
npm run db:generate
npm run db:deploy
npm run dev
```

`npm run db:migrate` yangi development migratsiyalarini yaratadi; deploy uchun `npm run db:deploy` ishlating.

## Development seed

Seed faqat nomi `_dev` bilan tugaydigan bo'sh bazaga hamda aniq tasdiq bilan yozadi:

```powershell
$env:SET_ALLOW_SEED = "1"
npm run db:seed
```

Seed production yoki NewEra bazalarini rad etadi. Uning loginlari faqat lokal demo uchun; shared yoki production muhitida ishlatmang.

## Rollar

- **Administrator** barcha modullarni boshqaradi.
- **O'qituvchi** faqat o'z guruhlari, o'quvchilari, jadvali, darslari, davomati va dars rejalarini boshqaradi.

Ruxsat tekshiruvlari server queries va Server Actions ichida bajariladi; UI ni yashirish xavfsizlik chegarasi emas.

## Tekshiruvlar

```bash
npm run typecheck
npm run lint
npm test
```

## Cheklovlar

Loyiha ichki foydalanish uchun ishlatiladi, ammo audit jurnali, parolni tiklash, e-mail xabarnomalari, backup/monitoring va database darajasidagi schedule exclusion constraint hali yo'q. Shuning uchun uni qo'shimcha operatsion xavfsizliksiz production-ready deb hisoblamang.
