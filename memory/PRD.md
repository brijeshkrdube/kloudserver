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

### January 12, 2026 - Session 4 (Current)
1. **Data Center Management**
   - Admin CRUD for data centers at `/admin/datacenters`
   - 4 seeded data centers: US East (NY), US West (LA), EU Central (Frankfurt), Asia (Singapore)
   - Data center selection during order process

2. **Add-ons System**
   - Admin CRUD for add-ons at `/admin/addons`
   - 7 seeded add-ons: cPanel/WHM, Plesk, SSL Standard, SSL Wildcard, Daily Backup, Additional IPv4, Priority Support
   - Add-on selection during order with dynamic pricing

3. **Enhanced Order Flow**
   - 4-step process: Plan → Configure → Add-ons → Review
   - Data center location selection in Step 2
   - Add-on checkboxes with pricing adjusted for billing cycle
   - Total calculation includes base plan + add-ons

4. **Auto-Email PDF Invoices**
   - PDF invoice generated and emailed on order creation
   - Includes order details, add-ons breakdown, total

5. **Recurring Invoice Automation**
   - Background task to create renewal invoices 7 days before server renewal
   - Email notification sent to user with invoice

6. **Auto-Suspend Unpaid Services**
   - Background task to check overdue invoices daily
   - Suspended servers can be unsuspended by admin after payment
   - Email notification sent to user on suspension

7. **Admin Controls**
   - Manual trigger endpoints: `/admin/run-renewal-check`, `/admin/run-suspend-check`
   - Unsuspend server: `/admin/servers/{id}/unsuspend`
   - Navigation updated with Data Centers and Add-ons links

## Database Models
- `users`: {email, full_name, hashed_password, role, wallet_balance, is_active, totp_secret}
- `plans`: {name, type, specs, price_monthly/quarterly/yearly, features, is_active}
- `datacenters`: {name, location, country, description, is_active} *NEW*
- `addons`: {name, type, price, billing_cycle, description, is_active} *NEW*
- `orders`: {user_id, plan_id, data_center_id, addons[], addon_details[], amount, status}
- `servers`: {user_id, order_id, credentials, status, suspended_at, renewal_date}
- `invoices`: {user_id, invoice_number, amount, status, due_date, server_id}
- `tickets` & `ticket_messages`: Support system
- `transactions`: Wallet history
- `site_settings`: Email config, contact info, legal pages

## API Endpoints Summary

### Public
- GET /api/datacenters/ - List active data centers
- GET /api/addons/ - List active add-ons
- GET /api/plans/ - List active plans

### User
- POST /api/orders/ - Create order with data_center_id and addons[]
- GET /api/invoices/{id}/pdf - Download invoice PDF
- POST /api/servers/{id}/control - Request reboot/reinstall

### Admin
- CRUD /api/admin/datacenters - Manage data centers
- CRUD /api/admin/addons - Manage add-ons
- POST /api/admin/run-renewal-check - Trigger renewal invoice creation
- POST /api/admin/run-suspend-check - Trigger overdue service suspension
- POST /api/admin/servers/{id}/unsuspend - Restore suspended server

## Seeded Data
- **4 Data Centers**: US East (New York), US West (Los Angeles), EU Central (Frankfurt), Asia (Singapore)
- **7 Add-ons**: cPanel/WHM ($15/mo), Plesk ($12/mo), SSL Standard ($9.99/yr), SSL Wildcard ($49.99/yr), Daily Backup ($5/mo), Additional IPv4 ($3/mo), Priority Support ($19.99/mo)
- **7 Plans**: VPS Starter/Basic/Pro, Shared Starter/Pro, Dedicated Entry/Pro

## Prioritized Backlog

### P0 (Critical) - COMPLETED ✅
- Order page bug fix
- Admin site settings with email config
- Admin credential sharing
- PDF invoice download
- Password reset flow
- Server control actions
- Payment proof upload
- Admin orders with user details
- Admin user details page
- Data center selection
- Add-ons selection
- Auto-email PDF invoices
- Recurring invoice automation
- Auto-suspend unpaid services

### P1 (High Priority)
- Server usage statistics dashboard
- Stripe/crypto payment gateway integration

### P2 (Medium Priority)
- Email template customization in admin
- Affiliate/referral system
- API documentation page

### P3 (Low Priority)
- Multi-language support
- Live chat integration
- Mobile app

## Test Credentials
- **Admin**: brijesh.kr.dube@gmail.com / Cloud@9874
- **User**: test@test.com / Test123!

## MOCKED Integrations
- **SendGrid**: Email functionality logs warning if API key not configured. Configure via Admin → Settings → Email tab
- **Server Control**: Reboot/Reinstall requests create support tickets
- **Background Tasks**: Run on schedule; manual trigger available via admin endpoints
