# HustleKE - Kenyan Freelance Marketplace

A decentralized, AI-driven freelance marketplace specifically built for the Kenyan ecosystem. Connect with global clients, get paid instantly via M-Pesa, and enjoy zero commission fees.

## 🎯 Core Philosophy
**"Local Trust, Global Standards"**

## ✨ Key Features

### For Freelancers
- **Zero Commission**: Keep 100% of your earnings
- **Instant M-Pesa Payouts**: Get paid directly to your phone
- **AI Proposal Polisher**: Let AI enhance your proposals to win more jobs
- **Hustle Score**: Build trust with verified status and successful jobs
- **Offline-First PWA**: Work even with limited connectivity

### For Clients
- **Verified Talent Pool**: ID-verified and skill-tested freelancers
- **M-Pesa Escrow**: Secure payments held until work is approved
- **AI Job Posting**: Get help writing professional job descriptions
- **Local Focus**: Find Kenyan talent who understand the local context

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** (App Router) - Server-side rendering for SEO
- **Tailwind CSS** - Mobile-first responsive design
- **Zustand** - Lightweight state management
- **Lucide React** - Modern icon library

### Backend & Database
- **Supabase** - PostgreSQL database with real-time subscriptions
- **Supabase Auth** - Authentication with email/phone
- **Supabase Storage** - File storage for portfolios

### Third-Party Integrations
- **Safaricom Daraja API** - M-Pesa STK Push & B2C payments
- **OpenAI API** - AI proposal enhancement and job matching

## 📁 Project Structure

```
hustle-ke/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Landing page
│   │   ├── layout.tsx         # Root layout with PWA support
│   │   ├── dashboard/         # Freelancer dashboard
│   │   ├── jobs/              # Find work & job listings
│   │   ├── post-job/          # Client job posting
│   │   ├── login/             # Authentication
│   │   ├── signup/            # Registration
│   │   └── api/               # API routes
│   ├── components/            # Reusable components
│   ├── lib/                   # Utilities & Supabase client
│   └── types/                 # TypeScript definitions
├── supabase/
│   └── schema.sql            # Database schema
├── public/                   # Static assets
│   ├── manifest.json         # PWA manifest
│   └── service-worker.js     # Offline support
└── .env.example             # Environment variables template
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Safaricom Daraja API credentials (for M-Pesa)
- OpenAI API key (for AI features)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/hustle-ke.git
cd hustle-ke
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```
Fill in your credentials in `.env.local`:
- Supabase URL and keys
- M-Pesa Daraja API credentials
- OpenAI API key

4. **Set up the database**
- Go to your Supabase project dashboard
- Open the SQL Editor
- Copy the contents of `supabase/schema.sql`
- Run the SQL to create all tables

5. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 💳 M-Pesa Integration Setup

### 1. Create Daraja Portal Account
- Visit [Safaricom Developer Portal](https://developer.safaricom.co.ke/)
- Register and create a new app
- Get your Consumer Key and Consumer Secret

### 2. Configure Credentials
Add these to your `.env.local`:
```
MPESA_CONSUMER_KEY=your-key
MPESA_CONSUMER_SECRET=your-secret
MPESA_PASSKEY=your-passkey
MPESA_SHORTCODE=your-shortcode
MPESA_CALLBACK_URL=https://your-domain.com/api/mpesa/callback
```

### 3. For Testing (Sandbox)
Use these test credentials:
- **Phone**: 254708374149
- **PIN**: Any 4-digit number (e.g., 1234)

## 🤖 AI Features Setup

1. Get an OpenAI API key from [platform.openai.com](https://platform.openai.com)
2. Add to `.env.local`:
```
OPENAI_API_KEY=sk-your-key-here
```

## 📱 PWA Features

The app is built as a Progressive Web App with:
- **Offline Support**: Browse jobs and view dashboard offline
- **Installable**: Add to home screen on mobile
- **Push Notifications**: Get notified of new jobs and messages
- **Background Sync**: Submit proposals even when offline

## 🏗️ Database Schema

### Core Tables
- **profiles** - User profiles with verification status
- **jobs** - Job listings with AI match scores
- **proposals** - Job applications with AI enhancement scores
- **escrow_transactions** - Secure payment holding
- **wallets** - User M-Pesa wallet balances
- **messages** - Real-time chat between users
- **reviews** - Job completion ratings

### Key Features
- **Row Level Security (RLS)** - Secure data access
- **Real-time subscriptions** - Live updates
- **Indexes** - Optimized queries
- **Triggers** - Automated hustle score calculations

## 🔐 Security Features

- **Supabase Auth** - Secure authentication
- **RLS Policies** - Database-level security
- **M-Pesa Escrow** - Funds held securely
- **ID Verification** - Optional identity verification
- **Hustle Score** - Trust algorithm prevents scams

## 🎨 Customization

### Colors
The app uses a green-based color scheme representing:
- **Green** (#16a34a) - Growth, money, Kenya
- **Blue** - Trust, professionalism
- **Purple** - AI, innovation

### Fonts
- Default: Geist Sans & Mono (included with Next.js)
- Can be customized in `tailwind.config.ts`

## 📝 API Routes

### M-Pesa Endpoints
- `POST /api/mpesa` - Initiate STK Push
- `POST /api/mpesa/callback` - Handle M-Pesa callbacks
- `POST /api/mpesa/b2c-result` - Handle B2C payment results

### AI Endpoints
- `POST /api/ai/enhance-proposal` - AI proposal polishing
- `POST /api/ai/generate-title` - AI job title generation
- `POST /api/ai/match-jobs` - AI job matching

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run E2E tests (if configured)
npm run test:e2e
```

## 🚢 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Other Platforms
Build the app:
```bash
npm run build
```

The `out/` folder contains the static export.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for the Kenyan freelance community
- Powered by Safaricom M-Pesa
- AI features by OpenAI
- Database by Supabase

## 📞 Support

- Email: support@hustleke.co.ke
- Twitter: [@HustleKE](https://twitter.com/HustleKE)
- Website: [hustleke.co.ke](https://hustleke.co.ke)

---

**Built with ❤️ in Nairobi, Kenya 🇰🇪**
