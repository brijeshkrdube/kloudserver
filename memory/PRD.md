# KloudNests - Server Renting Platform PRD

## Original Problem Statement
Build a complete, production-ready web application for a server renting company similar to ChainKloud. The platform provides VPS, Shared Hosting, and VDS/Dedicated Server services with full admin and user dashboards.

## Brand: KloudNests
- **Application Name**: KloudNests
- **Tagline**: Enterprise Cloud Infrastructure Provider
- **Default Email**: support@kloudnests.com
- All branding configurable via Admin → Settings

## User Choices
- **Payment**: Manual bank transfer + cryptocurrency payments + Wallet
- **Email**: SendGrid for transactional emails  
- **Authentication**: JWT-based custom auth with 2FA support
- **Theme**: Dark theme with blue accents (blockchain/cloud inspired)
- **Admin**: brijesh.kr.dube@gmail.com / Cloud@9874

## Architecture
- **Frontend**: React + TailwindCSS + Shadcn/UI
- **Backend**: FastAPI + MongoDB
- **Authentication**: JWT with optional TOTP 2FA
- **Email**: SendGrid integration (configurable via admin settings)
- **PDF Generation**: ReportLab - uses admin-configured company info

## What's Been Implemented

### Core Features (Complete)
- Complete user authentication (register, login, 2FA, password reset, email verification)
- Admin and user dashboards with full functionality
- Service plan management (VPS, Shared, Dedicated)
- Order flow with plan selection, configuration, add-ons, review
- Invoice generation with PDF download
- Support ticket system
- Wallet and transaction history

### Payment & Server Provisioning Flow (Jan 2026 - Complete)
1. **Pay from Wallet on Orders**
   - Users can select "Pay from Wallet" during checkout
   - Real-time wallet balance display with instant badge
   - Automatic balance deduction and payment status update
   - Error handling for insufficient balance

2. **Enhanced Admin Orders Page**
   - Customer details shown (name, email, company)
   - Inline payment status dropdown (Pending → Paid)
   - Inline order status dropdown (Pending → Active)
   - "Provision" button appears when payment=paid AND status=pending

3. **Enhanced Server Provisioning Dialog**
   - Order summary section (ID, customer, plan, OS, amount, payment status)
   - Server details (IP address, hostname)
   - SSH credentials (username, password with generator, port)
   - Control panel section (URL, username, password) - shown when order has control panel
   - Additional notes textarea
   - Send email toggle (checked by default)
   - Cancel and Provision Server buttons

4. **Admin Server Allocation (Manual)**
   - User selection dropdown
   - Plan selection (optional)
   - Server details section
   - SSH credentials section with password generator
   - Control panel credentials (optional)
   - **Payment Options:**
     - External payment received (no wallet deduction)
     - Deduct from user's wallet (with amount input)
   - Send email toggle
   - Invoice generation on allocation

5. **Invoice Generation**
   - Invoices created for all server allocations
   - Includes server ID and payment method (wallet/external)
   - Status set to "paid" immediately

### Branding (Updated)
- Application name: "KloudNests" throughout
- Browser title: "KloudNests - Enterprise Cloud Infrastructure"
- All branding configurable via Admin Settings

### Data Center Management
- Admin CRUD at `/admin/datacenters`
- 4 seeded locations: US East (NY), US West (LA), EU Central (Frankfurt), Asia (Singapore)

### Add-ons System  
- Admin CRUD at `/admin/addons`
- 7 seeded add-ons: cPanel/WHM, Plesk, SSL Standard/Wildcard, Daily Backup, IPv4, Priority Support

### Automation System
- Admin Automation Page at `/admin/automation`
- Generate Renewal Invoices button
- Suspend Overdue Services button
- Auto-renewal from wallet if sufficient balance
- Service cancellation after 14 days overdue

### Wallet System
- 3-step topup flow: Amount/Method → Payment Details → Upload Proof
- Bank Transfer and Crypto payment methods
- Payment proof upload with transaction reference
- Admin Topup Requests management page
- Approve/Reject with email notifications
- Auto-add funds to wallet on approval

### Two-Factor Authentication (2FA)
- Complete 2FA setup for users and admins
- QR code generation for authenticator apps
- Manual secret key entry option
- Enable/Disable 2FA from Profile page
- 2FA verification during login

## Navigation Structure

### User Dashboard
- Dashboard, My Services, Order Server, Billing, Wallet, Support Tickets, Profile

### Admin Dashboard  
- Dashboard, Orders, Servers, Users, Billing, Topup Requests, Plans, Data Centers, Add-ons, Tickets, Automation, Settings

## Test Credentials
- **Admin**: brijesh.kr.dube@gmail.com / Cloud@9874
- **User**: test@test.com / Test123!

## Completed Bug Fixes
1. Order page Select.Item empty value fix
2. Ticket creation Select.Item empty value fix
3. Brand name updated from CloudNest to KloudNests
4. Plan creation 500 error - MongoDB _id serialization fix
5. Contact page now uses dynamic settings from admin panel
6. Servers not appearing in user panel - Pydantic model fix
7. Password reset flow - added link to email

## Prioritized Backlog (Remaining Tasks)

### P1 - High Priority
- **Payment Gateway Integration (Stripe/Razorpay):** Automate payment processing and recurring billing
- **Server Control Panel Integration:** Connect to Virtualizor/SolusVM API for reboot, shutdown, OS reinstall

### P2 - Medium Priority
- **Affiliate/Referral Program:** User referrals with commission tracking
- **Knowledge Base / Documentation:** Admin-managed help articles and FAQs

### P3 - Lower Priority
- **Live Chat Support:** Real-time chat widget integration
- **Service Status Page:** Public uptime display and incident reporting

## Technical Debt
- **Backend Refactoring:** The `server.py` file is over 3000 lines and should be split into modules:
  - `/app/backend/routes/` - API route files
  - `/app/backend/models/` - Pydantic models
  - `/app/backend/services/` - Business logic
  - `/app/backend/tests/` - Test files

## 3rd Party Integrations
- **SendGrid:** Transactional emails (configured via Admin → Settings)

## Test Reports
- `/app/test_reports/iteration_5.json` - Latest test results (100% pass rate)
- `/app/tests/test_cloudnest_iteration5.py` - Backend API tests
