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

## What's Been Implemented

### January 12, 2026 - All Sessions Complete

#### Core Features
- Complete user authentication (register, login, 2FA, password reset)
- Admin and user dashboards with full functionality
- Service plan management (VPS, Shared, Dedicated)
- Order flow with plan selection, configuration, add-ons, review
- Invoice generation with PDF download
- Support ticket system
- Wallet and transaction history

#### Data Center Management
- Admin CRUD at `/admin/datacenters`
- 4 seeded locations: US East (NY), US West (LA), EU Central (Frankfurt), Asia (Singapore)
- User selects data center during order

#### Add-ons System  
- Admin CRUD at `/admin/addons`
- 7 seeded add-ons: cPanel/WHM, Plesk, SSL Standard/Wildcard, Daily Backup, IPv4, Priority Support
- Dynamic pricing based on billing cycle

#### Automation System
- **Admin Automation Page** at `/admin/automation` with:
  - Generate Renewal Invoices - creates invoices 7 days before server renewal
  - Suspend Overdue Services - suspends servers with unpaid invoices
  - Task history tracking
- Manual trigger buttons for immediate execution
- Background tasks run on daily schedule

#### Additional Features
- Auto-email PDF invoices on order creation
- Server credential management (admin can edit and email to users)
- Server control actions (reboot/reinstall requests via tickets)
- Payment proof upload for orders
- Comprehensive user details view for admin

## Navigation Structure

### User Dashboard
- Dashboard, My Services, Order Server, Billing, Wallet, Support Tickets, Profile

### Admin Dashboard  
- Dashboard, Orders, Servers, Users, Billing, Plans, Data Centers, Add-ons, Tickets, **Automation**, Settings

## API Endpoints

### Automation Endpoints
- POST `/api/admin/run-renewal-check` - Trigger renewal invoice creation
- POST `/api/admin/run-suspend-check` - Trigger overdue service suspension
- POST `/api/admin/servers/{id}/unsuspend` - Restore suspended server

### Data Center Endpoints
- GET `/api/datacenters/` - List active data centers
- CRUD `/api/admin/datacenters` - Admin management

### Add-on Endpoints
- GET `/api/addons/` - List active add-ons
- CRUD `/api/admin/addons` - Admin management

## Test Credentials
- **Admin**: brijesh.kr.dube@gmail.com / Cloud@9874
- **User**: test@test.com / Test123!

## Bug Fixes Applied
1. Order page Select.Item empty value fix (control panel dropdown)
2. Ticket creation Select.Item empty value fix (related order dropdown)

## MOCKED Integrations
- **SendGrid**: Configure via Admin → Settings → Email tab
- **Server Control**: Creates support tickets (manual processing)
- **Background Tasks**: Daily schedule + manual trigger via Admin → Automation

## Prioritized Backlog

### Completed ✅
- All P0 critical features
- Data center selection
- Add-ons selection
- Auto-email invoices
- Recurring invoice automation
- Auto-suspend unpaid services
- Admin automation panel

### P1 (High Priority)
- Server usage statistics dashboard
- Stripe/crypto payment gateway

### P2 (Medium Priority)  
- Email template customization
- Affiliate/referral system

### P3 (Low Priority)
- Multi-language support
- Live chat integration
- Mobile app
