# Nexlify Marketplace

A modern, India-centric marketplace app built with React, Vite, TypeScript, Supabase, and Tailwind CSS. Users can buy and sell locally, manage profiles, and enjoy a PWA experience with offline support.

---

## Features
- User authentication (email sign-up, email verification)
- User profiles (with avatar, bio, university, etc.)
- List items for sale with images
- Real-time chat between buyers and sellers
- Progressive Web App (PWA): installable, offline support
- Supabase as backend (database, auth, storage)

---

## Technologies Used
- [Vite](https://vitejs.dev/) (React + TypeScript)
- [Supabase](https://supabase.com/) (Database, Auth, Storage)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)

---

## Getting Started

### 1. Clone the Repository
```sh
git clone https://github.com/Ritikmandal13/nexlify-marketplace.git
cd nexlify-marketplace
```

### 2. Install Dependencies
```sh
npm install
```

### 3. Set Up Environment Variables
- Copy `.env.example` to `.env` and fill in your Supabase project credentials:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

### 4. Start the Development Server
```sh
npm run dev
```
- The app will run at `http://localhost:8080` (or as shown in your terminal).

---

## Deployment (Vercel)
1. Push your code to GitHub.
2. Go to [Vercel](https://vercel.com/) and import your repo.
3. Use these settings:
   - **Install Command:** `npm install`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Set your environment variables in Vercel dashboard.
5. Deploy and get your live URL!

---

## Supabase Setup
- Create a Supabase project at [supabase.com](https://supabase.com/).
- Set up tables: `users`, `listings`, `messages`, etc.
- Set up Storage buckets (e.g., `avatars`, `listing-images`).
- Configure Auth settings (Site URL = your Vercel URL).
- Add RLS policies for security.
- (Optional) Add triggers for automatic profile creation.

---

## PWA Features
- Manifest and service worker included for installability and offline support.
- To test PWA: open in Chrome, go to Application tab, and install from the address bar.

---

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## License
[MIT](LICENSE)
