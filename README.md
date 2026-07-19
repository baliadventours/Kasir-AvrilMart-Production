# 🛒 POS & Inventory Management System

Modern Point of Sale and Inventory Management application built with React, Vite, TailwindCSS, and Supabase.

![POS System](https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop)

## ✨ Key Features

### 🛒 Point of Sale (POS)
- **Dual Pricing System**: Harga Eceran (Retail) & Harga Grosir (Wholesale)
- Real-time cart management
- **Barcode scanning support**
- Product search & filtering
- Tax calculation (10%)
- Payment processing dengan kalkulasi kembalian
- **Thermal receipt printing** (80mm optimized)
- Transaction history

### 📦 Inventory Management (Admin Only)
- Add, edit, delete products
- **CSV bulk import** - Import ratusan produk sekaligus
- Stock level tracking dengan color-coded indicators
- Low stock alerts (automatic badges)
- Product categorization
- Dual price management (retail & wholesale)
- Image support via URL

### 📊 Sales Analytics (Admin Only)
- Complete sales history
- Revenue tracking by price type (Eceran vs Grosir)
- Transaction details dengan item breakdown
- User activity tracking (who processed each sale)
- Real-time synchronization dengan database

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account
- Vercel account (for deployment)

### Local Development

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd pos-inventory
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. **Run development server**
```bash
npm run dev
```

5. **Open browser**
```
http://localhost:5173
```

## 📚 Documentation

Dokumentasi lengkap tersedia:

- **[📘 Installation Guide](./INSTALLATION.md)** - Step-by-step installation (START HERE!)
- **[🚀 Quick Start](./QUICKSTART.md)** - Quick reference untuk setup cepat
- **[🆕 Panduan Instalasi Toko Baru](./PANDUAN_INSTALASI_TOKO_BARU.md)** - Complete guide untuk setup toko baru (30 menit!)
- **[🌐 Deployment Guide](./DEPLOYMENT.md)** - Complete setup untuk Vercel + Supabase
- **[🔒 Security Guide](./SECURITY.md)** - Security architecture & best practices
- **[🛡️ Security Audit Report](./SECURITY_AUDIT_REPORT.md)** - Production readiness audit & recommendations
- **[📋 Admin Guide](./ADMIN_GUIDE.md)** - Quick reference untuk administrator
- **[❓ FAQ](./FAQ.md)** - Frequently Asked Questions
- **[🗄️ Database Schema](./supabase-schema.sql)** - Full PostgreSQL schema
- **[🔐 Security Fix Script](./fix-security-for-production.sql)** - Critical security fixes before go-live
- **[🔧 Cache Fix Guide](./CACHE_FIX_GUIDE.md)** - Fix blank page / cache problems

## 🗄️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS v4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Backend**: Supabase Edge Functions (Deno)
- **Deployment**: Vercel
- **Icons**: Lucide React

## 📁 Project Structure

```
pos-inventory/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── login.tsx
│   │   │   ├── pos-interface.tsx
│   │   │   ├── inventory-manager.tsx
│   │   │   ├── sales-history.tsx
│   │   │   └── user-management.tsx
│   │   ├── App.tsx
│   │   └── types.ts
│   ├── services/
│   │   └── supabase.ts         # API client
│   ├── utils/
│   │   └── helpers.ts          # Utility functions
│   └── styles/
│       └── theme.css
├── supabase/
│   └── functions/
│       └── server/
│           └── index.tsx        # Edge function for signup
├── supabase-schema.sql          # Database schema
├── DEPLOYMENT.md                # Deployment guide
├── .env.example                 # Environment template
└── vercel.json                  # Vercel config
```

## 🔑 User Roles

### Administrator
- ✅ Full access to all features
- ✅ Manage products & inventory
- ✅ View sales history & analytics
- ✅ Create cashier & admin accounts
- ✅ Process transactions (POS)

### Kasir (Cashier)
- ✅ Access Point of Sale
- ✅ Process transactions
- ✅ Scan barcodes
- ✅ View product stock
- ❌ Cannot edit inventory
- ❌ Cannot view sales history
- ❌ Cannot manage users

## 🛠️ Development

### Build for production
```bash
npm run build
```

### Preview production build
```bash
npm run preview
```

### Database migrations
Run the SQL schema in Supabase Dashboard → SQL Editor:
```bash
# Copy content from supabase-schema.sql
```

## 🔒 Security

- ✅ Row Level Security (RLS) enabled
- ✅ Service Role Key secured in backend only
- ✅ JWT token validation
- ✅ Role-based permissions
- ✅ HTTPS enforced (Vercel)
- ✅ Environment variables not committed

## 📱 Barcode Scanner

The app supports USB and Bluetooth barcode scanners:

1. Connect your scanner
2. Focus is auto-set to barcode input
3. Scan product barcode (SKU)
4. Product automatically added to cart

**Supported formats**: Any scanner that emulates keyboard input

## 🌐 Deployment

Deploy to Vercel in one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/pos-inventory)

Or follow the [complete deployment guide](./DEPLOYMENT.md).

## 📊 Database Schema

### Tables
- **products** - Product information with dual pricing
- **sales** - Transaction records
- **sale_items** - Line items for each transaction
- **auth.users** - User accounts (Supabase Auth)

### Views
- **sales_summary** - Aggregated sales data
- **low_stock_products** - Products with stock ≤ 10
- **daily_sales_report** - Daily revenue breakdown

## 🐛 Troubleshooting

See [DEPLOYMENT.md](./DEPLOYMENT.md#troubleshooting) for common issues.

## 📝 License

MIT License - feel free to use for your projects!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check [Supabase Docs](https://supabase.com/docs)
- Check [Vercel Docs](https://vercel.com/docs)

---

**Made with ❤️ for modern retail businesses**