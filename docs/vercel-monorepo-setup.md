# Vercel — monorepo (`apps/web`)

Next.js loyihasi `apps/web` ichida. Vercel **repository root**da `.next` qidiradi; shuning uchun loyihada **Root Directory** sozlamasi majburiy.

## Bir marta sozlash (Dashboard)

1. [Vercel Dashboard](https://vercel.com) → loyiha (**nishon-ai** yoki GitHub ulangan nom).
2. **Settings** → **General** → **Root Directory** → `apps/web` yozing va saqlang.
3. **Settings** → **General** → **Build & Development Settings**:
   - **Build Command**: bo‘sh qoldiring (default `next build` `apps/web` ichida ishlaydi).
   - **Install Command**: bo‘sh qoldiring yoki `pnpm install --frozen-lockfile` (repo ildizidan ishlaydi).
4. **Save** qiling, keyin **Deployments** → **Redeploy** (yoki GitHubga yangi push).

Repodagi `vercel.json` `installCommand` + `framework` beradi. **Root Directory = `apps/web`** bo‘lganda Vercel odatda `next build` ni `apps/web` ichida ishga tushiradi (Build Command bo‘sh).

Agar Dashboardda avval **Build Command** override qilingan bo‘lsa (masalan eski `pnpm --filter web build`), uni **o‘chirib** default qiling — aks holda `.next` joyi yana noto‘g‘ri bo‘lishi mumkin.

## CLI

Repodan (ildizdan):

```bash
vercel deploy --prod --yes
```

Loyiha allaqachon `elmurodovs-projects/nishon-ai` ga ulangan bo‘lishi kerak. Agar `vercel deploy apps/web` ishlatilsa, alohida loyiha yaratilishi mumkin — monorepo uchun **ishlatmang**.

## Oldingi xatolar

- **`.next` ni ildizga `cp` qilish** — symlink / trace xatolari (`styled-jsx ENOENT`).
- **Faqat `apps/web` papkasini yuklash** — `pnpm-lock.yaml` yo‘q, workspace buziladi.

## Custom domain

`adspectr.com` Vercelda shu loyihaga ulangan bo‘lsa, muvaffaqiyatli deploydan keyin avtomatik yangilanadi.
