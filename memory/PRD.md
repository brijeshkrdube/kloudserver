# KloudNests - Server Renting Platform PRD

## Original Problem Statement
Build a complete, production-ready web application for a server renting company similar to ChainKloud. The platform provides VPS, Shared Hosting, and VDS/Dedicated Server services with full admin and user dashboards.

## Brand: KloudNests
- **Application Name**: KloudNests
- **Tagline**: Enterprise Cloud Infrastructure Provider
- **Default Email**: support@kloudnests.com
- All branding configurable via Admin → Settings

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
- **PDF Generation**: ReportLab - uses admin-configured company info

## Invoice PDF Features
- Company name from admin settings
- Company address from admin settings
- Company email from admin settings
- Company phone from admin settings
- Professional layout with dark header
- Payment instructions with admin email

## What's Been Implemented

### All Sessions Complete

#### Core Features
- Complete user authentication (register, login, 2FA, password reset)
- Admin and user dashboards with full functionality
- Service plan management (VPS, Shared, Dedicated)
- Order flow with plan selection, configuration, add-ons, review
- Invoice generation with PDF download
- Support ticket system
- Wallet and transaction history

#### Branding (Updated)
- Application name changed to "KloudNests" throughout
- Browser title: "KloudNests - Enterprise Cloud Infrastructure"
- Navbar, Footer, Emails, PDFs all use KloudNests
- All branding configurable via Admin Settings

#### Data Center Management
- Admin CRUD at `/admin/datacenters`
- 4 seeded locations: US East (NY), US West (LA), EU Central (Frankfurt), Asia (Singapore)

#### Add-ons System  
- Admin CRUD at `/admin/addons`
- 7 seeded add-ons: cPanel/WHM, Plesk, SSL Standard/Wildcard, Daily Backup, IPv4, Priority Support

#### Automation System
- **Admin Automation Page** at `/admin/automation` with:
  - Generate Renewal Invoices button
  - Suspend Overdue Services button
  - Task history tracking

## Navigation Structure

### User Dashboard
- Dashboard, My Services, Order Server, Billing, Wallet, Support Tickets, Profile

### Admin Dashboard  
- Dashboard, Orders, Servers, Users, Billing, Plans, Data Centers, Add-ons, Tickets, Automation, Settings

## Test Credentials
- **Admin**: brijesh.kr.dube@gmail.com / Cloud@9874
- **User**: test@test.com / Test123!

## Bug Fixes Applied
1. Order page Select.Item empty value fix
2. Ticket creation Select.Item empty value fix
3. Brand name updated from CloudNest to KloudNests

## MOCKED Integrations
- **SendGrid**: Configure via Admin → Settings → Email tab
- **Server Control**: Creates support tickets
- **Background Tasks**: Manual trigger via Admin → Automation
