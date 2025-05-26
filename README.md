# SaaS Starter Kit

A production-ready SaaS starter template built with Astro, React, Supabase, and Stripe. Get your SaaS up and running in minutes, not months.

## 🚀 Features

### Core Features
- **🔐 Authentication** - Complete auth system with Supabase (login, register, password reset)
- **💳 Billing & Subscriptions** - Stripe integration with subscription management
- **👥 User Management** - User profiles, roles, and permissions
- **📧 Email System** - Transactional emails with Resend and React Email
- **🎨 UI Components** - Beautiful UI with Tailwind CSS and shadcn/ui
- **📊 Admin Dashboard** - Full admin panel with user management and analytics
- **🔍 API Layer** - RESTful API with authentication and rate limiting
- **📝 Audit Logging** - Track all important user and system actions
- **🛡️ Security** - Security headers, CORS, environment validation
- **📈 Performance** - Optimized for Core Web Vitals with caching and monitoring
- **🐛 Error Handling** - Sentry integration for error tracking

### Developer Experience
- **📚 TypeScript** - Full type safety across the entire codebase
- **🧪 Testing** - Unit tests with Vitest, E2E tests with Playwright
- **🔧 Developer Tools** - ESLint, Prettier, Git hooks
- **📖 Documentation** - Comprehensive docs and API reference
- **🚀 Deployment Ready** - Works with Vercel, Netlify, and Cloudflare

## 📋 Prerequisites

- Node.js 18+ 
- npm or pnpm
- Supabase account (free tier works)
- Stripe account (test mode for development)
- Resend account for emails (optional)

## 🛠️ Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/saas-starter.git
   cd saas-starter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in your environment variables (see [Environment Setup](#environment-setup))

4. **Set up the database**
   ```bash
   # Run migrations
   npx supabase db push
   
   # Seed the database (optional)
   npx supabase db seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:4321](http://localhost:4321)

## 🔧 Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Public URLs
PUBLIC_SITE_URL=http://localhost:4321

# Supabase
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Email (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com

# Optional: Error Monitoring
SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token

# Optional: Feature Flags
ENABLE_ANALYTICS=true
ENABLE_EMAIL_NOTIFICATIONS=true
MAINTENANCE_MODE=false
```

### Getting API Keys

1. **Supabase**
   - Create a project at [supabase.com](https://supabase.com)
   - Go to Settings → API to find your keys

2. **Stripe**
   - Sign up at [stripe.com](https://stripe.com)
   - Get test keys from the Dashboard → Developers → API keys
   - Set up webhook endpoint and get the webhook secret

3. **Resend**
   - Sign up at [resend.com](https://resend.com)
   - Get your API key from the dashboard

## 📁 Project Structure

```
├── src/
│   ├── api/              # API routes
│   ├── components/       # React components
│   ├── db/              # Database utilities
│   ├── layouts/         # Astro layouts
│   ├── lib/             # Core libraries
│   │   ├── api/         # API utilities
│   │   ├── audit/       # Audit logging
│   │   ├── auth/        # Authentication
│   │   ├── email/       # Email templates
│   │   ├── env/         # Environment validation
│   │   ├── monitoring/  # Error & performance monitoring
│   │   ├── permissions/ # Role-based permissions
│   │   ├── stripe/      # Stripe integration
│   │   └── supabase/    # Supabase client
│   ├── middleware/      # Astro middleware
│   ├── pages/           # Page routes
│   │   ├── admin/       # Admin dashboard
│   │   ├── api/         # API endpoints
│   │   └── auth/        # Auth pages
│   ├── scripts/         # Utility scripts
│   └── styles/          # Global styles
├── supabase/
│   ├── migrations/      # Database migrations
│   └── seed.sql        # Seed data
├── tests/              # Test files
└── public/             # Static assets
```

## 🧞 Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |
| `npm run lint` | Lint code |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | Run TypeScript checks |
| `npm run db:push` | Push database migrations |
| `npm run db:seed` | Seed the database |
| `npm run stripe:listen` | Listen for Stripe webhooks locally |

## 🚀 Deployment

### Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/saas-starter)

### Netlify
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/saas-starter)

### Environment Variables
Remember to set all environment variables in your deployment platform.

## 📚 Documentation

- [API Documentation](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)
- [Authentication Guide](./docs/AUTH.md)
- [Billing Integration](./docs/BILLING.md)
- [Admin Dashboard](./docs/ADMIN.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run unit tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## 🔐 Security

- All API endpoints are protected with authentication
- Rate limiting is implemented on all endpoints
- CORS is configured for production
- Security headers are set via middleware
- Environment variables are validated on startup
- SQL injection is prevented via parameterized queries
- XSS protection via React's built-in escaping

## 📈 Performance

- Lighthouse score: 95+ on all metrics
- Core Web Vitals optimized
- Image lazy loading
- Code splitting and dynamic imports
- Edge caching with proper cache headers
- Database query optimization

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- [Astro](https://astro.build) - The web framework
- [Supabase](https://supabase.com) - Backend and authentication
- [Stripe](https://stripe.com) - Payment processing
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Resend](https://resend.com) - Email delivery

## 💬 Support

- [Discord Community](https://discord.gg/yourdiscord)
- [GitHub Issues](https://github.com/yourusername/saas-starter/issues)
- [Documentation](https://docs.yoursaas.com)

---

Built with ❤️ by [Your Name](https://github.com/yourusername)