# Made by Maa — Customer Website

React web app that mirrors the Flutter customer app: browse kitchens and dishes, cart, checkout, and orders — connected to the same backend at `https://madebymaa.online`.

## Setup

```bash
cd website
npm install
cp .env.example .env   # optional — defaults to production API
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (proxies `/api`, `/uploads`, `/storage`) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

## Features

- **5-tab navigation:** Explore, Nearby, Orders, Cart, Profile
- **Browse:** Featured kitchens, cuisines, dish categories, all kitchens/dishes
- **Filters:** Open/closed, cuisine, rating, veg/non-veg, search
- **Cart:** Single-kitchen cart (same rule as the app)
- **Auth:** Phone OTP login via backend
- **Checkout:** COD with delivery quote from API

## Project structure

```
website/
├── public/images/     # Brand logo & empty-state illustrations
├── src/
│   ├── api/           # API client + Optica2 endpoints
│   ├── components/    # Bottom nav, cards, shared UI
│   ├── pages/         # Route pages
│   ├── stores/        # Zustand (cart, session, location)
│   └── types/         # Shared TypeScript types
```

Sibling to the Flutter app at `../customer/`.
