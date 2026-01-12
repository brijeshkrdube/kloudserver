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
- **Email**: SendGrid integration (configurable via admin settings)
- **PDF Generation**: ReportLab for invoice PDFs

## Core Requirements (Implemented)

### Public Website
- Home, VPS, Shared Hosting, Dedicated Servers, Pricing pages
- Contact form with email confirmation
- User registration/login with 2FA support
- About Us, Terms, Privacy, SLA, AUP, Data Centers pages (admin-managed)
- Support Center page (Skype + Ticketing)
- Password reset flow (forgot password + reset password pages)

### User Dashboard
- Dashboard overview with stats
- My Services (active servers list)
- Server details with credentials (plain text + copy buttons)
- **Server control actions** (Request Reboot, Request OS Reinstall - creates support tickets)
- Order new server wizard (3-step process)
- **Order details with payment proof upload**
- Billing & invoices with **PDF download**
- Wallet with transaction history
- Support ticket system with messaging
- Profile & security (2FA setup/disable)

### Admin Panel
- Dashboard with key metrics
- **Order management with user details** (name, email, company displayed)
- Server provisioning and credential management (edit + send email)
- **User management with detailed view** (orders, invoices, servers, tickets, transactions)
- **Send notification to users via email**
- Billing/invoice management
- Support ticket management
- Plan management (CRUD)
- **Site Settings with Email configuration** (SendGrid API key, sender email)

## What's Been Implemented

### January 12, 2026 - Session 2
1. **BUG FIX (P0)**: Fixed order page crash
2. Admin-managed site settings with 6 tabs (Company, Contact, Email, Pages, Payment, Social)
3. New static pages (About, Terms, Privacy, SLA, AUP, Data Centers, Support)
4. Footer updated with links, watermark reference removed
5. Admin credential sharing with email notifications

### January 12, 2026 - Session 3 (Current)
1. **Email API Configuration**: Admin can configure SendGrid API key and sender email
2. **PDF Invoice Generation**: Users can download invoices as PDF from billing page
3. **Password Reset Flow**: Complete forgot password and reset password pages
4. **Server Control Actions**: Request Reboot and OS Reinstall buttons (creates support tickets)
5. **Payment Proof Upload**: Users can upload payment proof URL for orders
6. **Admin Orders with User Details**: Shows customer name, email, company for each order
7. **Admin User Details Page**: Full user activity view with tabs for Orders, Servers, Invoices, Tickets, Transactions
8. **Admin Send Notification**: Send custom email notifications to users
9. **Admin User Statistics**: Total spent, active services, total orders, open tickets

## Database Models
- `users`: {email, full_name, hashed_password, role, wallet_balance, is_active, totp_secret}
- `plans`: {name, type, specs, price, features, is_active}
- `orders`: {user_id, plan_id, billing_cycle, total_price, order_status, payment_proof_url}
- `servers`: {user_id, order_id, name, ip_address, specs, credentials, status}
- `invoices`: {user_id, invoice_number, amount, status, due_date}
- `tickets` & `ticket_messages`: Support system
- `transactions`: Wallet history
- `site_settings`: Singleton with email config, contact info, legal pages
- `payment_proofs`: Payment proof submissions

## Prioritized Backlog

### P0 (Critical) - COMPLETED ✅
- Order page bug fix
- Admin site settings
- Admin credential sharing
- Email API configuration
- PDF invoice download
- Password reset flow
- Server control actions
- Payment proof upload
- Admin orders with user details
- Admin user details page with full activity

### P1 (High Priority)
- Data center selection during order
- Auto invoice PDF email on creation

### P2 (Medium Priority)
- Recurring invoice automation
- Add-ons selection (cPanel, SSL, Backup, IPs)
- Server usage statistics dashboard

### P3 (Low Priority)
- Email templates customization in admin
- Affiliate/referral system
- Multi-language support
- Live chat integration

## Test Credentials
- **Admin**: brijesh.kr.dube@gmail.com / Cloud@9874
- **User**: test@test.com / Test123!

## MOCKED Integrations
- **SendGrid**: Email functionality logs warning if API key not configured. Configure via Admin → Settings → Email tab
- **Server Control**: Reboot/Reinstall requests create support tickets (don't actually control servers)

## API Endpoints Summary
### Authentication
- POST /api/auth/register, /api/auth/login
- POST /api/auth/forgot-password, /api/auth/reset-password

### User
- GET /api/plans, /api/orders, /api/servers, /api/invoices, /api/tickets
- GET /api/invoices/{id}/pdf - PDF download
- POST /api/orders, /api/servers/{id}/control, /api/orders/{id}/payment-proof

### Admin
- GET /api/admin/stats, /api/admin/orders (includes user details)
- GET /api/admin/users/{id}/details - Full user activity
- POST /api/admin/users/{id}/notify - Send notification email
- GET/PUT /api/admin/settings - Site configuration including email
