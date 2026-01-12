# CloudNest - Server Renting Platform PRD

## Original Problem Statement
Build a complete, production-ready web application for a server renting company similar to ChainKloud. The platform provides VPS, Shared Hosting, and VDS/Dedicated Server services with full admin and user dashboards.

## User Choices
- **Payment**: Manual bank transfer + cryptocurrency payments
- **Email**: SendGrid for transactional emails
- **Authentication**: JWT-based custom auth with 2FA support
- **Theme**: Dark theme with blue accents (blockchain/cloud inspired)
- **Admin**: brijesh.kr.dube@gmail.com / Cloud@9874

## Architecture
- **Frontend**: React + TailwindCSS + Shadcn/UI
- **Backend**: FastAPI + MongoDB
- **Authentication**: JWT with optional TOTP 2FA
- **Email**: SendGrid integration (ready, needs API key)

## User Personas
1. **End Users**: Businesses and developers purchasing hosting services
2. **Administrators**: Staff managing orders, servers, and support

## Core Requirements (Implemented)

### Public Website
- Home page with hero, features, pricing preview, CTA
- VPS Hosting page with plans
- Shared Hosting page with plans
- Dedicated Servers page with plans
- Pricing comparison page with billing cycle toggle
- Contact form with email confirmation
- User registration/login with 2FA support
- About Us page (admin-managed content)
- Terms of Service page (admin-managed)
- Privacy Policy page (admin-managed)
- SLA page (admin-managed)
- AUP page (admin-managed)
- Data Centers page (admin-managed)
- Support Center page (Skype + Ticketing)

### User Dashboard
- Dashboard overview with stats
- My Services (active servers list)
- Server details with credentials (plain text + copy buttons)
- Order new server wizard (3-step process)
- Billing & invoices management
- Wallet with transaction history
- Support ticket system with messaging
- Profile & security (2FA setup/disable)

### Admin Panel
- Dashboard with key metrics
- Order management (view, update status, mark paid)
- Server provisioning (create server, enter credentials)
- Server credential management (edit + send email)
- User management (view users, update wallet balance, verify)
- Billing/invoice management (mark as paid)
- Support ticket management with replies
- Plan management (CRUD for service plans)
- Site Settings management (company info, contact, legal pages, payment info, social links)

### Database Models
- Users (auth, 2FA, wallet)
- Plans (VPS, Shared, Dedicated with pricing tiers)
- Orders (with billing cycle, OS, control panel options)
- Servers (credentials, renewal dates)
- Invoices (auto-generated on order)
- Tickets & Messages (support system)
- Transactions (wallet history)
- SiteSettings (singleton for site configuration)

## What's Been Implemented

### January 12, 2026 - Session 1
1. Complete Backend API - 40+ endpoints for auth, plans, orders, servers, invoices, tickets, admin
2. Full User Dashboard - 9 pages for managing services, billing, tickets, profile
3. Complete Admin Panel - 7 pages for managing orders, servers, users, billing, tickets
4. Authentication System - JWT with 2FA (TOTP) support
5. Order Flow - Plan selection -> Configuration -> Payment -> Admin provisioning
6. Email Integration - SendGrid templates ready (needs API key)
7. Seed Data - 7 plans auto-seeded, admin account created

### January 12, 2026 - Session 2
1. **BUG FIX (P0)**: Fixed order page crash - Control Panel dropdown now uses value='none' instead of empty string
2. **NEW FEATURE**: Admin-managed site settings with 5 tabs (Company, Contact, Pages, Payment, Social)
3. **NEW PAGES**: About, Terms, Privacy, SLA, AUP, Data Centers, Support Center
4. **NEW FEATURE**: Settings navigation link in admin sidebar
5. **NEW FEATURE**: Footer updated with links to all static pages (watermark removed)
6. **NEW FEATURE**: Support page with Skype integration and ticket system link
7. **NEW FEATURE**: Admin can edit server credentials with email notification to user
8. **NEW FEATURE**: "Send Credentials" button for admin to resend credentials email

## Prioritized Backlog

### P0 (Critical) - COMPLETED
- Order page bug fix
- Admin site settings
- Admin credential sharing

### P1 (High Priority)
- PDF invoice generation and download
- Password reset flow completion
- Data center selection during order

### P2 (Medium Priority)
- Server control actions (reboot, reinstall OS)
- Recurring invoice automation
- Payment proof upload
- Add-ons selection (cPanel, SSL, Backup, IPs)

### P3 (Low Priority)
- Server usage statistics
- Email templates customization in admin
- Affiliate/referral system
- Multi-language support
- API documentation page
- Live chat integration

## Test Credentials
- **Admin**: brijesh.kr.dube@gmail.com / Cloud@9874
- **User**: test@test.com / Test123!

## Notes
- SendGrid email integration is **MOCKED** (will log warning if API key not configured)
- The "Made with Emergent" badge in bottom-right is a platform overlay, not part of the app
- All static page content can be managed from Admin -> Settings
