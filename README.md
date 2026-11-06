# Nimbus — Grooming Department Software

> Built for **Doglab Software Development**  
> Modern, mobile-first management system for pet grooming salons.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, React 18, TypeScript)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Calendar**: [FullCalendar React](https://fullcalendar.io/) (Day / Week / Month with responsive touch support)
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL in SG Region)
- **PWA**: Mobile-first responsive Progressive Web App (`manifest.json` included for home screen installation)

---

## 📂 Project Structure

```
c:\code\nimbus\
├── prisma\
│   ├── schema.prisma       # Complete 18-model schema (Staff, Pets, Appointments, Pricing, Memberships)
│   └── seed.ts             # Default seed (Staff, Services, 4 Membership Tiers)
├── public\
│   └── manifest.json       # PWA manifest for mobile installation
├── src\
│   ├── app\
│   │   ├── layout.tsx      # Root layout with PWA meta & AppShell
│   │   ├── globals.css     # Tailwind styling + CSS variables + FullCalendar styling
│   │   ├── page.tsx        # Salon Dashboard (KPIs, Today's schedule, Quick actions)
│   │   ├── calendar\       # Day/Week/Month appointment calendar
│   │   ├── appointments\   # Appointment list with status filters
│   │   │   ├── new\        # Booking form with auto-duration & groomer assignment
│   │   │   ├── walk-in\    # Fast walk-in entry (immediate ARRIVED status)
│   │   │   └── [id]\       # Appointment details & status transitions
│   │   ├── customers\      # Customer search & list
│   │   │   ├── new\        # Customer creation with referral source
│   │   │   └── [id]\       # Profile with pets list & appointment history
│   │   ├── pets\           # Pets directory
│   │   │   ├── [id]\       # Pet detail, vaccination expiry, permanent warnings banner, visit history
│   │   │   └── new\        # (under /customers/[id]/pets/new)
│   │   └── staff\          # Groomer & receptionist profiles + weekly schedules
│   ├── components\
│   │   ├── layout\         # Responsive AppShell (sidebar on desktop, bottom nav on mobile)
│   │   └── ui\             # Accessible shadcn/ui components (Button, Dialog, Select, etc.)
│   └── lib\
│       ├── prisma.ts       # Prisma Client singleton
│       ├── supabase.ts     # Supabase client
│       └── utils.ts        # Helper functions, status colors, and constants
├── components.json         # shadcn/ui configuration
├── next.config.js          # Next.js configuration
├── package.json            # Dependencies & scripts
├── tailwind.config.ts      # Tailwind configuration
└── tsconfig.json           # TypeScript configuration
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
# or
pnpm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your Supabase credentials:
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
```

### 3. Generate Prisma Client & Run Seed
```bash
npx prisma db push
npm run db:seed
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📱 Mobile PWA Support
Nimbus is built mobile-first. Staff on tablets or phones can install the app directly to their home screen:
1. Open the URL in Safari (iOS) or Chrome (Android).
2. Tap **Share** (iOS) or the three-dot menu (Android).
3. Select **"Add to Home Screen"**.
