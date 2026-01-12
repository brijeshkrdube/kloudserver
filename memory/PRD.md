# CloudNest - Server Renting Platform PRD

## Original Problem Statement
Build a complete, production-ready web application for a server renting company similar to ChainKloud. The platform provides VPS, Shared Hosting, and VDS/Dedicated Server services with full admin and user dashboards.

## User Choices
- **Payment**: Manual bank transfer + cryptocurrency payments
- **Email**: SendGrid for transactional emails
- **Authentication**: JWT-based custom auth with 2FA support
- **Theme**: Dark theme with blue accents (blockchain/cloud inspired)

## Architecture
- **Frontend**: React + TailwindCSS + Shadcn/UI
- **Backend**: FastAPI + MongoDB
- **Authentication**: JWT with optional TOTP 2FA
- **Email**: SendGrid integration (ready, needs API key)

## User Personas
1. **End Users**: Businesses and developers purchasing hosting services
2. **Administrators**: Staff managing orders, servers, and support

## Core Requirements (Implemented ✅)

### Public Website
- ✅ Home page with hero, features, pricing preview, CTA
- ✅ VPS Hosting page with plans
- ✅ Shared Hosting page with plans
- ✅ Dedicated Servers page with plans
- ✅ Pricing comparison page with billing cycle toggle
- ✅ Contact form
- ✅ User registration/login with 2FA support

### User Dashboard
- ✅ Dashboard overview with stats
- ✅ My Services (active servers list)
- ✅ Server details with credentials (masked password, copy buttons, SSH command)
- ✅ Order new server wizard (3-step process)
- ✅ Billing & invoices management
- ✅ Wallet with transaction history
- ✅ Support ticket system with messaging
- ✅ Profile & security (2FA setup/disable)

### Admin Panel
- ✅ Dashboard with key metrics
- ✅ Order management (view, update status, mark paid)
- ✅ Server provisioning (create server, enter credentials)
- ✅ User management (view users, update wallet balance, verify)
- ✅ Billing/invoice management (mark as paid)
- ✅ Support ticket management with replies

### Database Models
- ✅ Users (auth, 2FA, wallet)
- ✅ Plans (VPS, Shared, Dedicated with pricing tiers)
- ✅ Orders (with billing cycle, OS, control panel options)
- ✅ Servers (credentials, renewal dates)
- ✅ Invoices (auto-generated on order)
- ✅ Tickets & Messages (support system)
- ✅ Transactions (wallet history)

## What's Been Implemented
**Date: January 12, 2026**

1. **Complete Backend API** - 40+ endpoints for auth, plans, orders, servers, invoices, tickets, admin
2. **Full User Dashboard** - 9 pages for managing services, billing, tickets, profile
3. **Complete Admin Panel** - 7 pages for managing orders, servers, users, billing, tickets
4. **Authentication System** - JWT with 2FA (TOTP) support
5. **Order Flow** - Plan selection → Configuration → Payment → Admin provisioning
6. **Email Integration** - SendGrid templates ready (needs API key)
7. **Seed Data** - 7 plans auto-seeded, admin account created

## Prioritized Backlog

### P0 (Critical - Next Sprint)
- Add SendGrid API key for email notifications
- PDF invoice generation and download
- Password reset flow completion

### P1 (High Priority)
- Data center selection feature
- Server control actions (reboot, reinstall OS)
- Recurring invoice automation
- Payment proof upload

### P2 (Medium Priority)
- Add-ons selection (cPanel, SSL, Backup, IPs)
- Server usage statistics
- Email templates customization in admin
- Affiliate/referral system

### P3 (Low Priority)
- Multi-language support
- API documentation page
- Live chat integration
- Mobile app considerations

## Admin Credentials
- Email: brijesh.kr.dube@gmail.com
- Password: Cloud@9874

## Notes
- SendGrid email integration is **MOCKED** (will log warning if API key not configured)
- Crypto payment addresses need to be configured in admin settings
- Bank transfer details are displayed statically, need admin configuration panel
