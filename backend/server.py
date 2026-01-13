from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, BackgroundTasks, Request, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import RedirectResponse, FileResponse, StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import pyotp
import qrcode
from io import BytesIO
import secrets
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Middleware to fix HTTPS redirects
class HTTPSRedirectMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if response.status_code == 307 and 'location' in response.headers:
            location = response.headers['location']
            if location.startswith('http://'):
                # Check if original request was HTTPS (via X-Forwarded-Proto header)
                forwarded_proto = request.headers.get('x-forwarded-proto', 'http')
                if forwarded_proto == 'https':
                    new_location = location.replace('http://', 'https://', 1)
                    return RedirectResponse(url=new_location, status_code=307)
        return response

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config - Use stable secret
JWT_SECRET = os.environ.get('JWT_SECRET', 'kloudnests-secure-jwt-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# SendGrid Config
SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'noreply@kloudnests.com')

# Create the main app
app = FastAPI(title="KloudNests API", version="1.0.0")

# Create routers
api_router = APIRouter(prefix="/api")
auth_router = APIRouter(prefix="/auth", tags=["Authentication"])
plans_router = APIRouter(prefix="/plans", tags=["Plans"])
orders_router = APIRouter(prefix="/orders", tags=["Orders"])
servers_router = APIRouter(prefix="/servers", tags=["Servers"])
invoices_router = APIRouter(prefix="/invoices", tags=["Invoices"])
tickets_router = APIRouter(prefix="/tickets", tags=["Tickets"])
admin_router = APIRouter(prefix="/admin", tags=["Admin"])
user_router = APIRouter(prefix="/user", tags=["User"])
datacenters_router = APIRouter(prefix="/datacenters", tags=["Data Centers"])
addons_router = APIRouter(prefix="/addons", tags=["Add-ons"])

security = HTTPBearer()

# ============ MODELS ============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    company: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    totp_code: Optional[str] = None

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    full_name: str
    company: Optional[str] = None
    role: str
    wallet_balance: float
    is_verified: bool
    is_2fa_enabled: bool
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class PlanResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    type: str
    cpu: str
    ram: str
    storage: str
    bandwidth: str
    price_monthly: float
    price_quarterly: float
    price_yearly: float
    features: List[str]
    is_active: bool

class OrderCreate(BaseModel):
    plan_id: str
    billing_cycle: Literal["monthly", "quarterly", "yearly"]
    os: str
    control_panel: Optional[str] = None
    data_center_id: Optional[str] = None
    addons: Optional[List[str]] = []
    payment_method: Literal["bank_transfer", "crypto"]
    notes: Optional[str] = None

class OrderResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    plan_id: str
    plan_name: str
    billing_cycle: str
    os: str
    control_panel: Optional[str]
    data_center_id: Optional[str] = None
    data_center_name: Optional[str] = None
    addons: List[str]
    addon_details: Optional[List[dict]] = []
    amount: float
    payment_method: str
    payment_status: str
    order_status: str
    notes: Optional[str]
    created_at: str
    updated_at: str

class ServerResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    order_id: str
    user_id: str
    ip_address: str
    hostname: str
    username: str
    password: str
    ssh_port: int
    os: str
    control_panel: Optional[str]
    panel_url: Optional[str]
    data_center_id: Optional[str] = None
    data_center_name: Optional[str] = None
    status: str
    plan_name: str
    renewal_date: str
    created_at: str
    specs: Optional[dict] = None

class InvoiceResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    order_id: Optional[str]
    invoice_number: str
    amount: float
    status: str
    due_date: str
    paid_date: Optional[str]
    description: str
    created_at: str

class TicketCreate(BaseModel):
    subject: str
    message: str
    priority: Literal["low", "medium", "high", "urgent"]
    order_id: Optional[str] = None

class TicketResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    subject: str
    priority: str
    status: str
    order_id: Optional[str]
    created_at: str
    updated_at: str

class TicketMessageCreate(BaseModel):
    message: str

class TransactionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    type: str
    amount: float
    description: str
    reference: Optional[str]
    created_at: str

# Data Center Models
class DataCenterCreate(BaseModel):
    name: str
    location: str
    country: str
    description: Optional[str] = None

class DataCenterResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    location: str
    country: str
    description: Optional[str]
    is_active: bool
    created_at: str

# Add-on Models
class AddOnCreate(BaseModel):
    name: str
    type: Literal["control_panel", "ssl", "backup", "ip", "support", "other"]
    price: float
    billing_cycle: Literal["monthly", "yearly", "one_time"]
    description: Optional[str] = None

class AddOnResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    type: str
    price: float
    billing_cycle: str
    description: Optional[str]
    is_active: bool
    created_at: str

class WalletTopupRequest(BaseModel):
    amount: float
    payment_method: Literal["bank_transfer", "crypto"]

class AdminServerCreate(BaseModel):
    order_id: str
    ip_address: str
    hostname: str
    username: str
    password: str
    ssh_port: int = 22
    panel_url: Optional[str] = None

class AdminOrderUpdate(BaseModel):
    order_status: Optional[str] = None
    payment_status: Optional[str] = None

class AdminPlanCreate(BaseModel):
    name: str
    type: Literal["vps", "shared", "dedicated"]
    cpu: str
    ram: str
    storage: str
    bandwidth: str
    price_monthly: float
    price_quarterly: float
    price_yearly: float
    features: List[str]

class AdminPlanUpdate(BaseModel):
    name: Optional[str] = None
    cpu: Optional[str] = None
    ram: Optional[str] = None
    storage: Optional[str] = None
    bandwidth: Optional[str] = None
    price_monthly: Optional[float] = None
    price_quarterly: Optional[float] = None
    price_yearly: Optional[float] = None
    features: Optional[List[str]] = None
    is_active: Optional[bool] = None

class SiteSettingsUpdate(BaseModel):
    company_name: Optional[str] = None
    company_description: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_address: Optional[str] = None
    skype_id: Optional[str] = None
    about_us: Optional[str] = None
    terms_of_service: Optional[str] = None
    privacy_policy: Optional[str] = None
    sla: Optional[str] = None
    aup: Optional[str] = None
    data_centers: Optional[str] = None
    bank_transfer_details: Optional[str] = None
    crypto_addresses: Optional[str] = None
    social_twitter: Optional[str] = None
    social_linkedin: Optional[str] = None
    social_github: Optional[str] = None
    # Email settings
    sendgrid_api_key: Optional[str] = None
    sender_email: Optional[str] = None

class Setup2FAResponse(BaseModel):
    secret: str
    qr_uri: str

class Verify2FARequest(BaseModel):
    code: str

class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

class ServerControlAction(BaseModel):
    action: Literal["reboot", "reinstall"]
    confirm: bool = False

class PaymentProofUpload(BaseModel):
    order_id: str
    proof_url: str
    payment_reference: Optional[str] = None

# ============ UTILITY FUNCTIONS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_token(credentials.credentials)
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def get_admin_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials)
    if user["role"] not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

def generate_invoice_number():
    return f"INV-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{secrets.token_hex(4).upper()}"

async def send_email(to_email: str, subject: str, html_content: str):
    # First try environment variable, then database settings
    api_key = SENDGRID_API_KEY
    sender = SENDER_EMAIL
    
    # If not in env, try to get from database
    if not api_key:
        settings = await db.site_settings.find_one({"_id": "site_settings"})
        if settings:
            api_key = settings.get("sendgrid_api_key", "")
            sender = settings.get("sender_email", SENDER_EMAIL) or SENDER_EMAIL
    
    if not api_key:
        logging.warning("SendGrid API key not configured, skipping email")
        return False
    
    try:
        message = Mail(
            from_email=sender,
            to_emails=to_email,
            subject=subject,
            html_content=html_content
        )
        sg = SendGridAPIClient(api_key)
        response = sg.send(message)
        logging.info(f"Email sent to {to_email}: {subject} (status: {response.status_code})")
        return True
    except Exception as e:
        error_msg = str(e)
        if "401" in error_msg or "Unauthorized" in error_msg:
            logging.error(f"SendGrid authentication failed - invalid API key")
        elif "403" in error_msg or "Forbidden" in error_msg:
            logging.error(f"SendGrid sender email not verified: {sender}")
        else:
            logging.error(f"Failed to send email: {e}")
        return False

async def send_invoice_email(user: dict, invoice: dict, order: dict = None):
    """Send invoice email with PDF attachment"""
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from io import BytesIO
    import base64
    
    # Get company settings
    settings = await db.site_settings.find_one({"_id": "site_settings"})
    company_name = settings.get("company_name", "KloudNests") if settings else "KloudNests"
    company_address = settings.get("contact_address", "") if settings else ""
    company_email = settings.get("contact_email", "support@kloudnests.com") if settings else "support@kloudnests.com"
    company_phone = settings.get("contact_phone", "") if settings else ""
    
    # Generate PDF
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=50, bottomMargin=50)
    elements = []
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=24, spaceAfter=30)
    header_style = ParagraphStyle('Header', parent=styles['Normal'], fontSize=12, spaceAfter=5)
    
    # Company header
    elements.append(Paragraph(f"<b>{company_name}</b>", title_style))
    if company_address:
        elements.append(Paragraph(company_address, header_style))
    if company_email:
        elements.append(Paragraph(company_email, header_style))
    if company_phone:
        elements.append(Paragraph(company_phone, header_style))
    elements.append(Spacer(1, 20))
    
    elements.append(Paragraph(f"<b>INVOICE</b>", ParagraphStyle('Invoice', fontSize=20, spaceAfter=20)))
    elements.append(Paragraph(f"<b>Invoice Number:</b> {invoice['invoice_number']}", header_style))
    elements.append(Paragraph(f"<b>Date:</b> {invoice['created_at'][:10]}", header_style))
    elements.append(Paragraph(f"<b>Due Date:</b> {invoice['due_date'][:10]}", header_style))
    elements.append(Spacer(1, 20))
    elements.append(Paragraph("<b>Bill To:</b>", header_style))
    elements.append(Paragraph(user.get("full_name", "Customer"), header_style))
    elements.append(Paragraph(user.get("email", ""), header_style))
    elements.append(Spacer(1, 30))
    
    data = [
        ['Description', 'Amount'],
        [invoice['description'], f"${invoice['amount']:.2f}"],
        ['', ''],
        ['<b>Total</b>', f"<b>${invoice['amount']:.2f}</b>"]
    ]
    
    table = Table(data, colWidths=[400, 100])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a1f2e')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb')),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 30))
    
    # Payment instructions
    elements.append(Paragraph("<b>Payment Instructions:</b>", header_style))
    elements.append(Paragraph("Please include the invoice number in your payment reference.", styles['Normal']))
    if company_email:
        elements.append(Paragraph(f"Contact {company_email} for any billing questions.", styles['Normal']))
    
    doc.build(elements)
    pdf_data = buffer.getvalue()
    buffer.close()
    
    # Send email with HTML content
    html_content = f"""
    <h2>Invoice #{invoice['invoice_number']}</h2>
    <p>Hi {user.get('full_name', 'Customer')},</p>
    <p>A new invoice has been generated for your account.</p>
    <hr>
    <p><strong>Invoice Number:</strong> {invoice['invoice_number']}</p>
    <p><strong>Amount:</strong> ${invoice['amount']:.2f}</p>
    <p><strong>Due Date:</strong> {invoice['due_date'][:10]}</p>
    <p><strong>Description:</strong> {invoice['description']}</p>
    <hr>
    <p>Please complete your payment before the due date to avoid service interruption.</p>
    <p>You can view and download your invoice from your dashboard.</p>
    <p>Best regards,<br>{company_name} Team</p>
    """
    
    await send_email(user["email"], f"Invoice #{invoice['invoice_number']} - {company_name}", html_content)

async def check_and_create_renewal_invoices():
    """Background task: Auto-renew from wallet or create renewal invoices for servers nearing renewal date"""
    # Find servers with renewal date within next 7 days
    seven_days_ahead = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    today = datetime.now(timezone.utc).isoformat()
    
    servers = await db.servers.find({
        "status": "active",
        "renewal_date": {"$lte": seven_days_ahead, "$gte": today}
    }, {"_id": 0}).to_list(500)
    
    for server in servers:
        # Check if there's already a pending renewal invoice
        existing_invoice = await db.invoices.find_one({
            "server_id": server["id"],
            "status": {"$in": ["unpaid", "pending"]},
            "description": {"$regex": "Renewal"}
        }, {"_id": 0})
        
        if existing_invoice:
            continue
        
        # Get the order to determine pricing
        order = await db.orders.find_one({"id": server["order_id"]}, {"_id": 0})
        if not order:
            continue
        
        # Get user and check wallet balance
        user = await db.users.find_one({"id": server["user_id"]}, {"_id": 0})
        if not user:
            continue
        
        renewal_amount = order["amount"]
        wallet_balance = user.get("wallet_balance", 0)
        
        # Try auto-renewal from wallet if sufficient balance
        if wallet_balance >= renewal_amount:
            # Deduct from wallet
            new_balance = wallet_balance - renewal_amount
            await db.users.update_one(
                {"id": user["id"]},
                {"$set": {"wallet_balance": new_balance}}
            )
            
            # Create transaction record
            await db.transactions.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": user["id"],
                "type": "debit",
                "amount": renewal_amount,
                "description": f"Auto-renewal: {server['plan_name']} - {server['hostname']}",
                "reference": f"SERVER-{server['id'][:8]}",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            
            # Extend renewal date
            cycle_days = {"monthly": 30, "quarterly": 90, "yearly": 365}
            new_renewal = datetime.now(timezone.utc) + timedelta(days=cycle_days.get(order["billing_cycle"], 30))
            await db.servers.update_one(
                {"id": server["id"]},
                {"$set": {"renewal_date": new_renewal.isoformat()}}
            )
            
            # Create paid invoice record
            invoice_id = str(uuid.uuid4())
            invoice_number = generate_invoice_number()
            invoice_doc = {
                "id": invoice_id,
                "user_id": server["user_id"],
                "order_id": server["order_id"],
                "server_id": server["id"],
                "invoice_number": invoice_number,
                "amount": renewal_amount,
                "status": "paid",
                "due_date": server["renewal_date"],
                "paid_date": datetime.now(timezone.utc).isoformat(),
                "description": f"Auto-Renewal (Wallet): {server['plan_name']} - {order['billing_cycle']}",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.invoices.insert_one(invoice_doc)
            
            # Send confirmation email
            await send_email(
                user["email"],
                f"Service Renewed - {server['hostname']}",
                f"""
                <h2>Service Auto-Renewed Successfully!</h2>
                <p>Hi {user.get('full_name', 'Customer')},</p>
                <p>Your server <strong>{server['hostname']}</strong> has been automatically renewed using your wallet balance.</p>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Amount Charged:</strong> ${renewal_amount:.2f}</p>
                    <p><strong>New Renewal Date:</strong> {new_renewal.strftime('%B %d, %Y')}</p>
                    <p><strong>Remaining Wallet Balance:</strong> ${new_balance:.2f}</p>
                </div>
                <p>Thank you for choosing KloudNests!</p>
                """
            )
            
            logging.info(f"Auto-renewed server {server['hostname']} from wallet. New balance: ${new_balance:.2f}")
        else:
            # Insufficient wallet balance - create renewal invoice
            invoice_id = str(uuid.uuid4())
            invoice_number = generate_invoice_number()
            invoice_doc = {
                "id": invoice_id,
                "user_id": server["user_id"],
                "order_id": server["order_id"],
                "server_id": server["id"],
                "invoice_number": invoice_number,
                "amount": renewal_amount,
                "status": "unpaid",
                "due_date": server["renewal_date"],
                "paid_date": None,
                "description": f"Renewal: {server['plan_name']} - {order['billing_cycle']}",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.invoices.insert_one(invoice_doc)
            
            # Send renewal invoice email with wallet top-up reminder
            await send_email(
                user["email"],
                f"Renewal Invoice - {server['hostname']}",
                f"""
                <h2>Service Renewal Required</h2>
                <p>Hi {user.get('full_name', 'Customer')},</p>
                <p>Your server <strong>{server['hostname']}</strong> is due for renewal.</p>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Invoice #:</strong> {invoice_number}</p>
                    <p><strong>Amount Due:</strong> ${renewal_amount:.2f}</p>
                    <p><strong>Due Date:</strong> {server['renewal_date'][:10]}</p>
                    <p><strong>Your Wallet Balance:</strong> ${wallet_balance:.2f}</p>
                </div>
                <p><strong>Tip:</strong> Add funds to your wallet for automatic renewals!</p>
                <p>Please pay before the due date to avoid service suspension.</p>
                <p>If payment is not received within 7 days after the due date, the service will be automatically cancelled.</p>
                """
            )
            
            logging.info(f"Created renewal invoice {invoice_number} for server {server['hostname']}")

async def check_and_suspend_overdue_services():
    """Background task: Suspend servers with overdue invoices and cancel after grace period"""
    today = datetime.now(timezone.utc)
    today_str = today.isoformat()
    
    # Grace period: 7 days after due date for suspension, 14 days for cancellation
    seven_days_ago = (today - timedelta(days=7)).isoformat()
    fourteen_days_ago = (today - timedelta(days=14)).isoformat()
    
    # Find unpaid invoices past due date (for suspension)
    overdue_invoices = await db.invoices.find({
        "status": "unpaid",
        "due_date": {"$lt": today_str, "$gte": seven_days_ago}
    }, {"_id": 0}).to_list(500)
    
    for invoice in overdue_invoices:
        # If invoice has a server_id (renewal invoice), suspend that server
        if invoice.get("server_id"):
            server = await db.servers.find_one({"id": invoice["server_id"], "status": "active"}, {"_id": 0})
            if server:
                await db.servers.update_one(
                    {"id": server["id"]},
                    {"$set": {"status": "suspended", "suspended_at": datetime.now(timezone.utc).isoformat()}}
                )
                
                # Notify user
                user = await db.users.find_one({"id": server["user_id"]}, {"_id": 0})
                if user:
                    await send_email(
                        user["email"],
                        f"Service Suspended - {server['hostname']}",
                        f"""
                        <h2>Service Suspended</h2>
                        <p>Hi {user.get('full_name', 'Customer')},</p>
                        <p>Your server <strong>{server['hostname']}</strong> has been suspended due to non-payment.</p>
                        <p><strong>Invoice:</strong> {invoice['invoice_number']}</p>
                        <p><strong>Amount Due:</strong> ${invoice['amount']:.2f}</p>
                        <p><strong>Warning:</strong> If payment is not received within 7 days, your service will be permanently cancelled and all data will be deleted.</p>
                        <p>Please pay your outstanding invoice to restore your service.</p>
                        """
                    )
                
                logging.info(f"Suspended server {server['hostname']} due to overdue invoice {invoice['invoice_number']}")
        
        # For order invoices, check if there's a server associated with the order
        elif invoice.get("order_id"):
            server = await db.servers.find_one({"order_id": invoice["order_id"], "status": "active"}, {"_id": 0})
            if server:
                await db.servers.update_one(
                    {"id": server["id"]},
                    {"$set": {"status": "suspended", "suspended_at": datetime.now(timezone.utc).isoformat()}}
                )
                
                user = await db.users.find_one({"id": server["user_id"]}, {"_id": 0})
                if user:
                    await send_email(
                        user["email"],
                        f"Service Suspended - {server['hostname']}",
                        f"""
                        <h2>Service Suspended</h2>
                        <p>Hi {user.get('full_name', 'Customer')},</p>
                        <p>Your server <strong>{server['hostname']}</strong> has been suspended due to non-payment.</p>
                        <p><strong>Invoice:</strong> {invoice['invoice_number']}</p>
                        <p><strong>Amount Due:</strong> ${invoice['amount']:.2f}</p>
                        <p>Please pay your outstanding invoice to restore your service.</p>
                        """
                    )
                
                logging.info(f"Suspended server {server['hostname']} due to overdue invoice {invoice['invoice_number']}")
    
    # Find invoices overdue by more than 14 days (for cancellation)
    severely_overdue = await db.invoices.find({
        "status": "unpaid",
        "due_date": {"$lt": fourteen_days_ago}
    }, {"_id": 0}).to_list(500)
    
    for invoice in severely_overdue:
        server = None
        if invoice.get("server_id"):
            server = await db.servers.find_one({"id": invoice["server_id"], "status": "suspended"}, {"_id": 0})
        elif invoice.get("order_id"):
            server = await db.servers.find_one({"order_id": invoice["order_id"], "status": "suspended"}, {"_id": 0})
        
        if server:
            # Cancel the server
            await db.servers.update_one(
                {"id": server["id"]},
                {"$set": {
                    "status": "cancelled",
                    "cancelled_at": datetime.now(timezone.utc).isoformat(),
                    "cancellation_reason": "Non-payment - automatic cancellation"
                }}
            )
            
            # Update order status
            if server.get("order_id"):
                await db.orders.update_one(
                    {"id": server["order_id"]},
                    {"$set": {"order_status": "cancelled", "updated_at": datetime.now(timezone.utc).isoformat()}}
                )
            
            # Mark invoice as cancelled
            await db.invoices.update_one(
                {"id": invoice["id"]},
                {"$set": {"status": "cancelled", "cancelled_at": datetime.now(timezone.utc).isoformat()}}
            )
            
            # Notify user
            user = await db.users.find_one({"id": server["user_id"]}, {"_id": 0})
            if user:
                await send_email(
                    user["email"],
                    f"Service Cancelled - {server['hostname']}",
                    f"""
                    <h2>Service Cancelled</h2>
                    <p>Hi {user.get('full_name', 'Customer')},</p>
                    <p>Your server <strong>{server['hostname']}</strong> has been permanently cancelled due to non-payment.</p>
                    <div style="background: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #ffcdd2;">
                        <p><strong>⚠️ Important:</strong> All data on this server has been scheduled for deletion.</p>
                    </div>
                    <p><strong>Invoice #:</strong> {invoice['invoice_number']}</p>
                    <p><strong>Outstanding Amount:</strong> ${invoice['amount']:.2f}</p>
                    <p>If you wish to continue using our services, please create a new order.</p>
                    <p>If you have any questions, please contact our support team.</p>
                    """
                )
            
            logging.info(f"Cancelled server {server['hostname']} due to non-payment (14+ days overdue)")

# ============ AUTH ROUTES ============

@auth_router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate, background_tasks: BackgroundTasks):
    existing = await db.users.find_one({"email": user_data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    verification_token = secrets.token_urlsafe(32)
    user_doc = {
        "id": user_id,
        "email": user_data.email.lower(),
        "password_hash": hash_password(user_data.password),
        "full_name": user_data.full_name,
        "company": user_data.company,
        "role": "user",
        "wallet_balance": 0.0,
        "is_verified": False,
        "verification_token": verification_token,
        "is_2fa_enabled": False,
        "totp_secret": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    # Get settings for site URL
    settings = await db.site_settings.find_one({"_id": "site_settings"})
    site_url = settings.get("site_url", "https://kloudnests.com") if settings else "https://kloudnests.com"
    verify_link = f"{site_url}/verify-email?token={verification_token}"
    
    # Send verification email
    background_tasks.add_task(
        send_email,
        user_data.email,
        "Verify Your Email - KloudNests",
        f"""
        <h2>Welcome to KloudNests, {user_data.full_name}!</h2>
        <p>Thank you for registering! Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{verify_link}" style="background-color: #3B82F6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Verify Email</a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="color: #666; word-break: break-all;">{verify_link}</p>
        <p>If you didn't create an account, please ignore this email.</p>
        <p>Best regards,<br>KloudNests Team</p>
        """
    )
    
    token = create_token(user_id, "user")
    user_response = UserResponse(
        id=user_id,
        email=user_doc["email"],
        full_name=user_doc["full_name"],
        company=user_doc["company"],
        role=user_doc["role"],
        wallet_balance=user_doc["wallet_balance"],
        is_verified=user_doc["is_verified"],
        is_2fa_enabled=user_doc["is_2fa_enabled"],
        created_at=user_doc["created_at"]
    )
    return TokenResponse(access_token=token, user=user_response)

@auth_router.get("/verify-email")
async def verify_email(token: str):
    """Verify user email with token"""
    user = await db.users.find_one({"verification_token": token}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
    
    if user.get("is_verified"):
        return {"message": "Email already verified"}
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"is_verified": True, "verification_token": None}}
    )
    
    return {"message": "Email verified successfully"}

@auth_router.post("/resend-verification")
async def resend_verification(background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)):
    """Resend verification email"""
    if user.get("is_verified"):
        raise HTTPException(status_code=400, detail="Email already verified")
    
    verification_token = secrets.token_urlsafe(32)
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"verification_token": verification_token}}
    )
    
    settings = await db.site_settings.find_one({"_id": "site_settings"})
    site_url = settings.get("site_url", "https://kloudnests.com") if settings else "https://kloudnests.com"
    verify_link = f"{site_url}/verify-email?token={verification_token}"
    
    background_tasks.add_task(
        send_email,
        user["email"],
        "Verify Your Email - KloudNests",
        f"""
        <h2>Email Verification</h2>
        <p>Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{verify_link}" style="background-color: #3B82F6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Verify Email</a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="color: #666; word-break: break-all;">{verify_link}</p>
        <p>Best regards,<br>KloudNests Team</p>
        """
    )
    
    return {"message": "Verification email sent"}

@auth_router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email.lower()}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user.get("is_2fa_enabled") and user.get("totp_secret"):
        if not credentials.totp_code:
            raise HTTPException(status_code=400, detail="2FA code required")
        totp = pyotp.TOTP(user["totp_secret"])
        if not totp.verify(credentials.totp_code):
            raise HTTPException(status_code=401, detail="Invalid 2FA code")
    
    token = create_token(user["id"], user["role"])
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        full_name=user["full_name"],
        company=user.get("company"),
        role=user["role"],
        wallet_balance=user["wallet_balance"],
        is_verified=user["is_verified"],
        is_2fa_enabled=user.get("is_2fa_enabled", False),
        created_at=user["created_at"]
    )
    return TokenResponse(access_token=token, user=user_response)

@auth_router.get("/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=user["id"],
        email=user["email"],
        full_name=user["full_name"],
        company=user.get("company"),
        role=user["role"],
        wallet_balance=user["wallet_balance"],
        is_verified=user["is_verified"],
        is_2fa_enabled=user.get("is_2fa_enabled", False),
        created_at=user["created_at"]
    )

@auth_router.post("/setup-2fa", response_model=Setup2FAResponse)
async def setup_2fa(user: dict = Depends(get_current_user)):
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    qr_uri = totp.provisioning_uri(name=user["email"], issuer_name="KloudNests")
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"totp_secret_pending": secret}}
    )
    return Setup2FAResponse(secret=secret, qr_uri=qr_uri)

@auth_router.get("/2fa-qr/{secret}")
async def get_2fa_qr(secret: str, user: dict = Depends(get_current_user)):
    """Generate QR code image for 2FA setup"""
    totp = pyotp.TOTP(secret)
    qr_uri = totp.provisioning_uri(name=user["email"], issuer_name="KloudNests")
    
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Save to bytes
    img_bytes = BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    
    return StreamingResponse(img_bytes, media_type="image/png")

@auth_router.post("/verify-2fa")
async def verify_2fa(data: Verify2FARequest, user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    pending_secret = user_doc.get("totp_secret_pending")
    if not pending_secret:
        raise HTTPException(status_code=400, detail="No 2FA setup in progress")
    
    totp = pyotp.TOTP(pending_secret)
    if not totp.verify(data.code):
        raise HTTPException(status_code=400, detail="Invalid code")
    
    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {"totp_secret": pending_secret, "is_2fa_enabled": True},
            "$unset": {"totp_secret_pending": ""}
        }
    )
    return {"message": "2FA enabled successfully"}

@auth_router.post("/disable-2fa")
async def disable_2fa(data: Verify2FARequest, user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    if not user_doc.get("is_2fa_enabled"):
        raise HTTPException(status_code=400, detail="2FA is not enabled")
    
    totp = pyotp.TOTP(user_doc["totp_secret"])
    if not totp.verify(data.code):
        raise HTTPException(status_code=400, detail="Invalid code")
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"is_2fa_enabled": False, "totp_secret": None}}
    )
    return {"message": "2FA disabled successfully"}

@auth_router.post("/forgot-password")
async def forgot_password(data: PasswordResetRequest, background_tasks: BackgroundTasks):
    user = await db.users.find_one({"email": data.email.lower()}, {"_id": 0})
    if user:
        reset_token = secrets.token_urlsafe(32)
        await db.password_resets.insert_one({
            "user_id": user["id"],
            "token": reset_token,
            "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        background_tasks.add_task(
            send_email,
            data.email,
            "Password Reset - KloudNests",
            f"""
            <h2>Password Reset Request</h2>
            <p>Use this token to reset your password: <strong>{reset_token}</strong></p>
            <p>This token expires in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
            """
        )
    return {"message": "If email exists, reset instructions have been sent"}

@auth_router.post("/reset-password")
async def reset_password(data: PasswordResetConfirm):
    reset = await db.password_resets.find_one({"token": data.token}, {"_id": 0})
    if not reset:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    if datetime.fromisoformat(reset["expires_at"]) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Token expired")
    
    await db.users.update_one(
        {"id": reset["user_id"]},
        {"$set": {"password_hash": hash_password(data.new_password)}}
    )
    await db.password_resets.delete_one({"token": data.token})
    return {"message": "Password reset successfully"}

# ============ PLANS ROUTES ============

@plans_router.get("/", response_model=List[PlanResponse])
async def get_plans(type: Optional[str] = None):
    query = {"is_active": True}
    if type:
        query["type"] = type
    plans = await db.plans.find(query, {"_id": 0}).to_list(100)
    return plans

@plans_router.get("/{plan_id}", response_model=PlanResponse)
async def get_plan(plan_id: str):
    plan = await db.plans.find_one({"id": plan_id, "is_active": True}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan

# ============ ORDERS ROUTES ============

@orders_router.post("/", response_model=OrderResponse)
async def create_order(order_data: OrderCreate, background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)):
    plan = await db.plans.find_one({"id": order_data.plan_id, "is_active": True}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Calculate base price
    price_map = {
        "monthly": plan["price_monthly"],
        "quarterly": plan["price_quarterly"],
        "yearly": plan["price_yearly"]
    }
    amount = price_map[order_data.billing_cycle]
    
    # Get data center info
    data_center_name = None
    if order_data.data_center_id:
        datacenter = await db.datacenters.find_one({"id": order_data.data_center_id, "is_active": True}, {"_id": 0})
        if datacenter:
            data_center_name = datacenter["name"]
    
    # Calculate add-on pricing
    addon_details = []
    addon_total = 0
    if order_data.addons:
        addons = await db.addons.find({"id": {"$in": order_data.addons}, "is_active": True}, {"_id": 0}).to_list(50)
        for addon in addons:
            addon_price = addon["price"]
            # Adjust add-on price based on billing cycle
            if addon["billing_cycle"] == "monthly" and order_data.billing_cycle == "quarterly":
                addon_price = addon["price"] * 3
            elif addon["billing_cycle"] == "monthly" and order_data.billing_cycle == "yearly":
                addon_price = addon["price"] * 12
            addon_details.append({
                "id": addon["id"],
                "name": addon["name"],
                "price": addon_price
            })
            addon_total += addon_price
    
    total_amount = amount + addon_total
    
    order_id = str(uuid.uuid4())
    order_doc = {
        "id": order_id,
        "user_id": user["id"],
        "plan_id": plan["id"],
        "plan_name": plan["name"],
        "billing_cycle": order_data.billing_cycle,
        "os": order_data.os,
        "control_panel": order_data.control_panel,
        "data_center_id": order_data.data_center_id,
        "data_center_name": data_center_name,
        "addons": order_data.addons or [],
        "addon_details": addon_details,
        "amount": total_amount,
        "payment_method": order_data.payment_method,
        "payment_status": "pending",
        "order_status": "pending",
        "notes": order_data.notes,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(order_doc)
    
    # Create invoice
    invoice_id = str(uuid.uuid4())
    invoice_number = generate_invoice_number()
    invoice_doc = {
        "id": invoice_id,
        "user_id": user["id"],
        "order_id": order_id,
        "invoice_number": invoice_number,
        "amount": total_amount,
        "status": "unpaid",
        "due_date": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "paid_date": None,
        "description": f"Order: {plan['name']} - {order_data.billing_cycle}" + (f" + {len(addon_details)} add-ons" if addon_details else ""),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.invoices.insert_one(invoice_doc)
    
    # Send order confirmation email with PDF invoice attached
    background_tasks.add_task(
        send_invoice_email,
        user,
        invoice_doc,
        order_doc
    )
    
    return OrderResponse(**{k: v for k, v in order_doc.items() if k != "_id"})

@orders_router.get("/", response_model=List[OrderResponse])
async def get_orders(user: dict = Depends(get_current_user)):
    orders = await db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders

@orders_router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id, "user_id": user["id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@orders_router.post("/{order_id}/payment-proof")
async def upload_payment_proof(order_id: str, proof_url: str, payment_reference: Optional[str] = None, 
                               background_tasks: BackgroundTasks = None, user: dict = Depends(get_current_user)):
    """Upload payment proof for an order"""
    order = await db.orders.find_one({"id": order_id, "user_id": user["id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["payment_status"] == "paid":
        raise HTTPException(status_code=400, detail="Order is already paid")
    
    # Store payment proof
    await db.payment_proofs.insert_one({
        "id": str(uuid.uuid4()),
        "order_id": order_id,
        "user_id": user["id"],
        "proof_url": proof_url,
        "payment_reference": payment_reference,
        "status": "pending_review",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Update order with payment proof reference
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {
            "payment_proof_url": proof_url,
            "payment_reference": payment_reference,
            "payment_status": "pending_verification",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Payment proof uploaded successfully. Our team will verify and update your order."}

# ============ SERVERS ROUTES ============

@servers_router.get("/", response_model=List[ServerResponse])
async def get_servers(user: dict = Depends(get_current_user)):
    servers = await db.servers.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    return servers

@servers_router.get("/{server_id}", response_model=ServerResponse)
async def get_server(server_id: str, user: dict = Depends(get_current_user)):
    server = await db.servers.find_one({"id": server_id, "user_id": user["id"]}, {"_id": 0})
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    return server

@servers_router.post("/{server_id}/control")
async def server_control_action(server_id: str, action_data: ServerControlAction, background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)):
    """Request server control action (reboot/reinstall) - Creates a support ticket"""
    server = await db.servers.find_one({"id": server_id, "user_id": user["id"]}, {"_id": 0})
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    
    if not action_data.confirm:
        raise HTTPException(status_code=400, detail="Please confirm the action")
    
    # Create a support ticket for the action request
    ticket_id = str(uuid.uuid4())
    action_desc = "Server Reboot" if action_data.action == "reboot" else "OS Reinstall"
    ticket_doc = {
        "id": ticket_id,
        "user_id": user["id"],
        "subject": f"{action_desc} Request - {server['hostname']}",
        "priority": "high" if action_data.action == "reinstall" else "medium",
        "status": "open",
        "order_id": server.get("order_id"),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tickets.insert_one(ticket_doc)
    
    # Create ticket message
    message = f"""
Server Control Action Requested:
- Action: {action_desc}
- Server: {server['hostname']}
- IP: {server['ip_address']}
- OS: {server['os']}
"""
    if action_data.action == "reinstall":
        message += "\nPlease reinstall the operating system. I understand all data will be lost."
    
    await db.ticket_messages.insert_one({
        "id": str(uuid.uuid4()),
        "ticket_id": ticket_id,
        "user_id": user["id"],
        "message": message,
        "is_staff": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Notify admin via email
    background_tasks.add_task(
        send_email,
        SENDER_EMAIL,
        f"Server Control Request - {action_desc}",
        f"""
        <h2>Server Control Action Requested</h2>
        <p><strong>Action:</strong> {action_desc}</p>
        <p><strong>Server:</strong> {server['hostname']} ({server['ip_address']})</p>
        <p><strong>User:</strong> {user['email']}</p>
        <p><strong>Ticket ID:</strong> {ticket_id[:8]}</p>
        <p>Please process this request.</p>
        """
    )
    
    return {"message": f"{action_desc} request submitted. Ticket #{ticket_id[:8]} created.", "ticket_id": ticket_id}

# ============ INVOICES ROUTES ============

@invoices_router.get("/", response_model=List[InvoiceResponse])
async def get_invoices(user: dict = Depends(get_current_user)):
    invoices = await db.invoices.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return invoices

@invoices_router.get("/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(invoice_id: str, user: dict = Depends(get_current_user)):
    invoice = await db.invoices.find_one({"id": invoice_id, "user_id": user["id"]}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

@invoices_router.get("/{invoice_id}/pdf")
async def download_invoice_pdf(invoice_id: str, user: dict = Depends(get_current_user)):
    """Generate and return PDF invoice"""
    from fastapi.responses import StreamingResponse
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from io import BytesIO
    
    invoice = await db.invoices.find_one({"id": invoice_id, "user_id": user["id"]}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Get company settings
    settings = await db.site_settings.find_one({"_id": "site_settings"})
    company_name = settings.get("company_name", "KloudNests") if settings else "KloudNests"
    company_address = settings.get("contact_address", "") if settings else ""
    company_email = settings.get("contact_email", "billing@kloudnests.com") if settings else "billing@kloudnests.com"
    company_phone = settings.get("contact_phone", "") if settings else ""
    
    # Get user info
    user_doc = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=50, bottomMargin=50)
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=24, spaceAfter=30)
    header_style = ParagraphStyle('Header', parent=styles['Normal'], fontSize=12, spaceAfter=5)
    
    # Header
    elements.append(Paragraph(f"<b>{company_name}</b>", title_style))
    if company_address:
        elements.append(Paragraph(company_address, header_style))
    if company_email:
        elements.append(Paragraph(company_email, header_style))
    if company_phone:
        elements.append(Paragraph(company_phone, header_style))
    elements.append(Spacer(1, 30))
    
    # Invoice details
    elements.append(Paragraph(f"<b>INVOICE</b>", ParagraphStyle('Invoice', fontSize=20, spaceAfter=20)))
    elements.append(Paragraph(f"<b>Invoice Number:</b> {invoice['invoice_number']}", header_style))
    elements.append(Paragraph(f"<b>Date:</b> {invoice['created_at'][:10]}", header_style))
    elements.append(Paragraph(f"<b>Due Date:</b> {invoice['due_date'][:10]}", header_style))
    elements.append(Paragraph(f"<b>Status:</b> {invoice['status'].upper()}", header_style))
    elements.append(Spacer(1, 20))
    
    # Bill To
    elements.append(Paragraph("<b>Bill To:</b>", header_style))
    elements.append(Paragraph(user_doc.get("full_name", "Customer"), header_style))
    elements.append(Paragraph(user_doc.get("email", ""), header_style))
    if user_doc.get("company"):
        elements.append(Paragraph(user_doc["company"], header_style))
    elements.append(Spacer(1, 30))
    
    # Items table
    data = [
        ['Description', 'Amount'],
        [invoice['description'], f"${invoice['amount']:.2f}"],
        ['', ''],
        ['<b>Total</b>', f"<b>${invoice['amount']:.2f}</b>"]
    ]
    
    table = Table(data, colWidths=[400, 100])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a1f2e')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb')),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 40))
    
    # Payment instructions
    elements.append(Paragraph("<b>Payment Instructions:</b>", header_style))
    elements.append(Paragraph("Please include the invoice number in your payment reference.", styles['Normal']))
    if company_email:
        elements.append(Paragraph(f"Contact {company_email} for any billing questions.", styles['Normal']))
    
    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=invoice_{invoice['invoice_number']}.pdf"}
    )

# ============ TICKETS ROUTES ============

@tickets_router.post("/", response_model=TicketResponse)
async def create_ticket(ticket_data: TicketCreate, user: dict = Depends(get_current_user)):
    ticket_id = str(uuid.uuid4())
    ticket_doc = {
        "id": ticket_id,
        "user_id": user["id"],
        "subject": ticket_data.subject,
        "priority": ticket_data.priority,
        "status": "open",
        "order_id": ticket_data.order_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tickets.insert_one(ticket_doc)
    
    # Create initial message
    await db.ticket_messages.insert_one({
        "id": str(uuid.uuid4()),
        "ticket_id": ticket_id,
        "user_id": user["id"],
        "message": ticket_data.message,
        "is_staff": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return TicketResponse(**{k: v for k, v in ticket_doc.items() if k != "_id"})

@tickets_router.get("/", response_model=List[TicketResponse])
async def get_tickets(user: dict = Depends(get_current_user)):
    tickets = await db.tickets.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return tickets

@tickets_router.get("/{ticket_id}")
async def get_ticket(ticket_id: str, user: dict = Depends(get_current_user)):
    ticket = await db.tickets.find_one({"id": ticket_id, "user_id": user["id"]}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    messages = await db.ticket_messages.find({"ticket_id": ticket_id}, {"_id": 0}).sort("created_at", 1).to_list(100)
    return {"ticket": ticket, "messages": messages}

@tickets_router.post("/{ticket_id}/messages")
async def add_ticket_message(ticket_id: str, message_data: TicketMessageCreate, user: dict = Depends(get_current_user)):
    ticket = await db.tickets.find_one({"id": ticket_id, "user_id": user["id"]}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    message_doc = {
        "id": str(uuid.uuid4()),
        "ticket_id": ticket_id,
        "user_id": user["id"],
        "message": message_data.message,
        "is_staff": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.ticket_messages.insert_one(message_doc)
    
    await db.tickets.update_one(
        {"id": ticket_id},
        {"$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Message added successfully"}

# ============ USER ROUTES ============

@user_router.get("/wallet/transactions", response_model=List[TransactionResponse])
async def get_transactions(user: dict = Depends(get_current_user)):
    transactions = await db.transactions.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return transactions

@user_router.get("/wallet/topup-requests")
async def get_topup_requests(user: dict = Depends(get_current_user)):
    """Get user's topup requests"""
    requests = await db.topup_requests.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return requests

@user_router.post("/wallet/topup")
async def request_topup(
    amount: float = Form(...),
    payment_method: str = Form(...),
    transaction_ref: str = Form(...),
    payment_proof: Optional[UploadFile] = File(None),
    user: dict = Depends(get_current_user)
):
    """Submit a wallet topup request with payment proof"""
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")
    
    if payment_method not in ["bank_transfer", "crypto"]:
        raise HTTPException(status_code=400, detail="Invalid payment method")
    
    topup_id = str(uuid.uuid4())
    
    # Handle file upload
    proof_filename = None
    if payment_proof:
        # Validate file type
        allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
        if payment_proof.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid file type. Only images are allowed.")
        
        # Save file
        upload_dir = Path("uploads/payment_proofs")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        file_ext = payment_proof.filename.split(".")[-1] if "." in payment_proof.filename else "jpg"
        proof_filename = f"{topup_id}.{file_ext}"
        file_path = upload_dir / proof_filename
        
        with open(file_path, "wb") as f:
            content = await payment_proof.read()
            f.write(content)
    
    await db.topup_requests.insert_one({
        "id": topup_id,
        "user_id": user["id"],
        "user_email": user["email"],
        "amount": amount,
        "payment_method": payment_method,
        "transaction_ref": transaction_ref,
        "payment_proof": proof_filename,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Notify admin via email (optional)
    try:
        settings = await db.site_settings.find_one({"_id": "site_settings"})
        admin_email = settings.get("contact_email") if settings else None
        if admin_email:
            await send_email(
                admin_email,
                f"New Wallet Topup Request - {user['email']}",
                f"""
                <h2>New Wallet Topup Request</h2>
                <p><strong>User:</strong> {user['email']}</p>
                <p><strong>Amount:</strong> ${amount:.2f}</p>
                <p><strong>Payment Method:</strong> {payment_method.replace('_', ' ').title()}</p>
                <p><strong>Transaction Reference:</strong> {transaction_ref}</p>
                <p><strong>Payment Proof:</strong> {'Uploaded' if proof_filename else 'Not provided'}</p>
                <p>Please review and approve/reject this request from the admin panel.</p>
                """
            )
    except Exception as e:
        logger.error(f"Failed to send admin notification: {e}")
    
    return {"message": "Topup request submitted", "request_id": topup_id}

@user_router.put("/profile")
async def update_profile(full_name: Optional[str] = None, company: Optional[str] = None, user: dict = Depends(get_current_user)):
    updates = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if full_name:
        updates["full_name"] = full_name
    if company is not None:
        updates["company"] = company
    
    await db.users.update_one({"id": user["id"]}, {"$set": updates})
    return {"message": "Profile updated"}

# ============ ADMIN ROUTES ============

@admin_router.get("/dashboard")
async def admin_dashboard(admin: dict = Depends(get_admin_user)):
    total_users = await db.users.count_documents({"role": "user"})
    total_orders = await db.orders.count_documents({})
    pending_orders = await db.orders.count_documents({"order_status": "pending"})
    active_servers = await db.servers.count_documents({"status": "active"})
    
    # Revenue calculation
    pipeline = [
        {"$match": {"status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    revenue_result = await db.invoices.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    return {
        "total_users": total_users,
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "active_servers": active_servers,
        "total_revenue": total_revenue
    }

@admin_router.get("/orders")
async def admin_get_orders(status: Optional[str] = None, admin: dict = Depends(get_admin_user)):
    """Get all orders with user details"""
    query = {}
    if status:
        query["order_status"] = status
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    
    # Enrich orders with user details
    user_ids = list(set(order["user_id"] for order in orders))
    users = await db.users.find({"id": {"$in": user_ids}}, {"_id": 0, "password_hash": 0, "totp_secret": 0}).to_list(500)
    user_map = {u["id"]: u for u in users}
    
    enriched_orders = []
    for order in orders:
        order_data = dict(order)
        user = user_map.get(order["user_id"], {})
        order_data["user_email"] = user.get("email", "Unknown")
        order_data["user_name"] = user.get("full_name", "Unknown")
        order_data["user_company"] = user.get("company", "")
        enriched_orders.append(order_data)
    
    return enriched_orders

@admin_router.put("/orders/{order_id}")
async def admin_update_order(order_id: str, data: AdminOrderUpdate, background_tasks: BackgroundTasks, admin: dict = Depends(get_admin_user)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    updates = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if data.order_status:
        updates["order_status"] = data.order_status
    if data.payment_status:
        updates["payment_status"] = data.payment_status
        if data.payment_status == "paid":
            await db.invoices.update_one(
                {"order_id": order_id},
                {"$set": {"status": "paid", "paid_date": datetime.now(timezone.utc).isoformat()}}
            )
    
    await db.orders.update_one({"id": order_id}, {"$set": updates})
    
    # Notify user
    user = await db.users.find_one({"id": order["user_id"]}, {"_id": 0})
    if user:
        background_tasks.add_task(
            send_email,
            user["email"],
            f"Order Update - {order_id[:8]}",
            f"""
            <h2>Order Status Update</h2>
            <p>Your order {order_id[:8]} has been updated.</p>
            <p><strong>Order Status:</strong> {data.order_status or order['order_status']}</p>
            <p><strong>Payment Status:</strong> {data.payment_status or order['payment_status']}</p>
            """
        )
    
    return {"message": "Order updated"}

@admin_router.post("/servers")
async def admin_create_server(data: AdminServerCreate, background_tasks: BackgroundTasks, admin: dict = Depends(get_admin_user)):
    order = await db.orders.find_one({"id": data.order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    existing_server = await db.servers.find_one({"order_id": data.order_id}, {"_id": 0})
    if existing_server:
        raise HTTPException(status_code=400, detail="Server already exists for this order")
    
    # Calculate renewal date based on billing cycle
    cycle_days = {"monthly": 30, "quarterly": 90, "yearly": 365}
    renewal_date = datetime.now(timezone.utc) + timedelta(days=cycle_days.get(order["billing_cycle"], 30))
    
    server_id = str(uuid.uuid4())
    server_doc = {
        "id": server_id,
        "order_id": data.order_id,
        "user_id": order["user_id"],
        "ip_address": data.ip_address,
        "hostname": data.hostname,
        "username": data.username,
        "password": data.password,
        "ssh_port": data.ssh_port,
        "os": order["os"],
        "control_panel": order.get("control_panel"),
        "panel_url": data.panel_url,
        "status": "active",
        "plan_name": order["plan_name"],
        "renewal_date": renewal_date.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.servers.insert_one(server_doc)
    
    # Update order status
    await db.orders.update_one(
        {"id": data.order_id},
        {"$set": {"order_status": "active", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Send credentials email
    user = await db.users.find_one({"id": order["user_id"]}, {"_id": 0})
    if user:
        background_tasks.add_task(
            send_email,
            user["email"],
            "Your Server is Ready! - KloudNests",
            f"""
            <h2>Your Server is Ready!</h2>
            <p>Great news, {user['full_name']}! Your server has been provisioned.</p>
            <hr>
            <p><strong>Server Details:</strong></p>
            <ul>
                <li><strong>IP Address:</strong> {data.ip_address}</li>
                <li><strong>Hostname:</strong> {data.hostname}</li>
                <li><strong>Username:</strong> {data.username}</li>
                <li><strong>Password:</strong> {data.password}</li>
                <li><strong>SSH Port:</strong> {data.ssh_port}</li>
                {f'<li><strong>Panel URL:</strong> {data.panel_url}</li>' if data.panel_url else ''}
            </ul>
            <hr>
            <p>You can view your server details anytime in your dashboard.</p>
            <p><strong>Important:</strong> Please change your password after first login.</p>
            """
        )
    
    return {"message": "Server created and credentials sent", "server_id": server_id}

@admin_router.get("/servers")
async def admin_get_servers(admin: dict = Depends(get_admin_user)):
    servers = await db.servers.find({}, {"_id": 0}).to_list(500)
    return servers

@admin_router.post("/servers/{server_id}/send-credentials")
async def admin_send_credentials(server_id: str, background_tasks: BackgroundTasks, admin: dict = Depends(get_admin_user)):
    """Resend server credentials email to user"""
    server = await db.servers.find_one({"id": server_id}, {"_id": 0})
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    
    user = await db.users.find_one({"id": server["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    background_tasks.add_task(
        send_email,
        user["email"],
        "Your Server Credentials - KloudNests",
        f"""
        <h2>Your Server Credentials</h2>
        <p>Hi {user['full_name']},</p>
        <p>Here are the credentials for your server as requested.</p>
        <hr>
        <p><strong>Server Details:</strong></p>
        <ul>
            <li><strong>Hostname:</strong> {server['hostname']}</li>
            <li><strong>IP Address:</strong> {server['ip_address']}</li>
            <li><strong>Username:</strong> {server['username']}</li>
            <li><strong>Password:</strong> {server['password']}</li>
            <li><strong>SSH Port:</strong> {server['ssh_port']}</li>
            {f"<li><strong>Panel URL:</strong> {server['panel_url']}</li>" if server.get('panel_url') else ''}
        </ul>
        <hr>
        <p><strong>SSH Command:</strong></p>
        <code>ssh {server['username']}@{server['ip_address']} -p {server['ssh_port']}</code>
        <hr>
        <p>You can also view your server details anytime in your dashboard.</p>
        <p><strong>Important:</strong> Keep these credentials secure and change your password regularly.</p>
        """
    )
    
    return {"message": f"Credentials email sent to {user['email']}"}

@admin_router.put("/servers/{server_id}")
async def admin_update_server(server_id: str, background_tasks: BackgroundTasks, ip_address: Optional[str] = None, hostname: Optional[str] = None, 
                               username: Optional[str] = None, password: Optional[str] = None,
                               status: Optional[str] = None, panel_url: Optional[str] = None,
                               admin: dict = Depends(get_admin_user)):
    server = await db.servers.find_one({"id": server_id}, {"_id": 0})
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    
    updates = {}
    credentials_changed = False
    if ip_address:
        updates["ip_address"] = ip_address
        credentials_changed = True
    if hostname:
        updates["hostname"] = hostname
    if username:
        updates["username"] = username
        credentials_changed = True
    if password:
        updates["password"] = password
        credentials_changed = True
    if status:
        updates["status"] = status
    if panel_url is not None:
        updates["panel_url"] = panel_url
        credentials_changed = True
    
    if updates:
        await db.servers.update_one({"id": server_id}, {"$set": updates})
        
        # Send notification email if credentials were updated
        if credentials_changed:
            user = await db.users.find_one({"id": server["user_id"]}, {"_id": 0})
            if user:
                # Get updated server info
                updated_server = await db.servers.find_one({"id": server_id}, {"_id": 0})
                background_tasks.add_task(
                    send_email,
                    user["email"],
                    "Server Credentials Updated - KloudNests",
                    f"""
                    <h2>Your Server Credentials Have Been Updated</h2>
                    <p>Hi {user['full_name']},</p>
                    <p>The credentials for your server have been updated by our team.</p>
                    <hr>
                    <p><strong>Updated Server Details:</strong></p>
                    <ul>
                        <li><strong>Hostname:</strong> {updated_server['hostname']}</li>
                        <li><strong>IP Address:</strong> {updated_server['ip_address']}</li>
                        <li><strong>Username:</strong> {updated_server['username']}</li>
                        <li><strong>Password:</strong> {updated_server['password']}</li>
                        <li><strong>SSH Port:</strong> {updated_server['ssh_port']}</li>
                        {f"<li><strong>Panel URL:</strong> {updated_server['panel_url']}</li>" if updated_server.get('panel_url') else ''}
                    </ul>
                    <hr>
                    <p>You can view your updated server details anytime in your dashboard.</p>
                    <p><strong>Important:</strong> Please change your password after first login if this is a new credential.</p>
                    """
                )
    
    return {"message": "Server updated"}

@admin_router.get("/users")
async def admin_get_users(admin: dict = Depends(get_admin_user)):
    users = await db.users.find({"role": "user"}, {"_id": 0, "password_hash": 0, "totp_secret": 0}).to_list(500)
    return users

@admin_router.get("/users/{user_id}/details")
async def admin_get_user_details(user_id: str, admin: dict = Depends(get_admin_user)):
    """Get comprehensive user details including orders, invoices, servers, and activity"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0, "totp_secret": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's orders
    orders = await db.orders.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Get user's invoices
    invoices = await db.invoices.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Get user's servers
    servers = await db.servers.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    
    # Get user's tickets
    tickets = await db.tickets.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    
    # Get user's transactions
    transactions = await db.transactions.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Calculate upcoming payments (unpaid invoices)
    upcoming_payments = [inv for inv in invoices if inv.get("status") in ["unpaid", "pending"]]
    
    # Calculate statistics
    total_spent = sum(inv.get("amount", 0) for inv in invoices if inv.get("status") == "paid")
    active_services = len([s for s in servers if s.get("status") == "active"])
    open_tickets = len([t for t in tickets if t.get("status") == "open"])
    
    return {
        "user": user,
        "statistics": {
            "total_spent": total_spent,
            "active_services": active_services,
            "total_orders": len(orders),
            "open_tickets": open_tickets
        },
        "orders": orders,
        "invoices": invoices,
        "servers": servers,
        "tickets": tickets,
        "transactions": transactions,
        "upcoming_payments": upcoming_payments
    }

@admin_router.post("/users/{user_id}/notify")
async def admin_notify_user(user_id: str, subject: str, message: str, background_tasks: BackgroundTasks, admin: dict = Depends(get_admin_user)):
    """Send notification email to user"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    background_tasks.add_task(
        send_email,
        user["email"],
        subject,
        f"""
        <h2>{subject}</h2>
        <p>Hi {user['full_name']},</p>
        <div>{message}</div>
        <hr>
        <p>Best regards,<br>KloudNests Team</p>
        """
    )
    
    return {"message": f"Notification sent to {user['email']}"}

# ============ DATA CENTERS ROUTES ============

@datacenters_router.get("/", response_model=List[DataCenterResponse])
async def get_datacenters():
    """Get all active data centers"""
    datacenters = await db.datacenters.find({"is_active": True}, {"_id": 0}).to_list(100)
    return datacenters

@admin_router.get("/datacenters")
async def admin_get_datacenters(admin: dict = Depends(get_admin_user)):
    """Admin: Get all data centers including inactive"""
    datacenters = await db.datacenters.find({}, {"_id": 0}).to_list(100)
    return datacenters

@admin_router.post("/datacenters")
async def admin_create_datacenter(data: DataCenterCreate, admin: dict = Depends(get_admin_user)):
    """Admin: Create a new data center"""
    datacenter_id = str(uuid.uuid4())
    datacenter_doc = {
        "id": datacenter_id,
        "name": data.name,
        "location": data.location,
        "country": data.country,
        "description": data.description,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.datacenters.insert_one(datacenter_doc)
    return {"message": "Data center created", "id": datacenter_id}

@admin_router.put("/datacenters/{datacenter_id}")
async def admin_update_datacenter(datacenter_id: str, name: Optional[str] = None, location: Optional[str] = None,
                                  country: Optional[str] = None, description: Optional[str] = None,
                                  is_active: Optional[bool] = None, admin: dict = Depends(get_admin_user)):
    """Admin: Update a data center"""
    datacenter = await db.datacenters.find_one({"id": datacenter_id}, {"_id": 0})
    if not datacenter:
        raise HTTPException(status_code=404, detail="Data center not found")
    
    updates = {}
    if name is not None:
        updates["name"] = name
    if location is not None:
        updates["location"] = location
    if country is not None:
        updates["country"] = country
    if description is not None:
        updates["description"] = description
    if is_active is not None:
        updates["is_active"] = is_active
    
    if updates:
        await db.datacenters.update_one({"id": datacenter_id}, {"$set": updates})
    
    return {"message": "Data center updated"}

@admin_router.delete("/datacenters/{datacenter_id}")
async def admin_delete_datacenter(datacenter_id: str, admin: dict = Depends(get_admin_user)):
    """Admin: Delete a data center (soft delete)"""
    result = await db.datacenters.update_one({"id": datacenter_id}, {"$set": {"is_active": False}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Data center not found")
    return {"message": "Data center deleted"}

# ============ ADD-ONS ROUTES ============

@addons_router.get("/", response_model=List[AddOnResponse])
async def get_addons():
    """Get all active add-ons"""
    addons = await db.addons.find({"is_active": True}, {"_id": 0}).to_list(100)
    return addons

@admin_router.get("/addons")
async def admin_get_addons(admin: dict = Depends(get_admin_user)):
    """Admin: Get all add-ons including inactive"""
    addons = await db.addons.find({}, {"_id": 0}).to_list(100)
    return addons

@admin_router.post("/addons")
async def admin_create_addon(data: AddOnCreate, admin: dict = Depends(get_admin_user)):
    """Admin: Create a new add-on"""
    addon_id = str(uuid.uuid4())
    addon_doc = {
        "id": addon_id,
        "name": data.name,
        "type": data.type,
        "price": data.price,
        "billing_cycle": data.billing_cycle,
        "description": data.description,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.addons.insert_one(addon_doc)
    return {"message": "Add-on created", "id": addon_id}

@admin_router.put("/addons/{addon_id}")
async def admin_update_addon(addon_id: str, name: Optional[str] = None, price: Optional[float] = None,
                             description: Optional[str] = None, is_active: Optional[bool] = None,
                             admin: dict = Depends(get_admin_user)):
    """Admin: Update an add-on"""
    addon = await db.addons.find_one({"id": addon_id}, {"_id": 0})
    if not addon:
        raise HTTPException(status_code=404, detail="Add-on not found")
    
    updates = {}
    if name is not None:
        updates["name"] = name
    if price is not None:
        updates["price"] = price
    if description is not None:
        updates["description"] = description
    if is_active is not None:
        updates["is_active"] = is_active
    
    if updates:
        await db.addons.update_one({"id": addon_id}, {"$set": updates})
    
    return {"message": "Add-on updated"}

@admin_router.delete("/addons/{addon_id}")
async def admin_delete_addon(addon_id: str, admin: dict = Depends(get_admin_user)):
    """Admin: Delete an add-on (soft delete)"""
    result = await db.addons.update_one({"id": addon_id}, {"$set": {"is_active": False}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Add-on not found")
    return {"message": "Add-on deleted"}

# ============ ADMIN AUTOMATION ROUTES ============

@admin_router.post("/run-renewal-check")
async def admin_run_renewal_check(background_tasks: BackgroundTasks, admin: dict = Depends(get_admin_user)):
    """Admin: Manually trigger renewal invoice generation"""
    background_tasks.add_task(check_and_create_renewal_invoices)
    return {"message": "Renewal check started in background"}

@admin_router.post("/run-suspend-check")
async def admin_run_suspend_check(background_tasks: BackgroundTasks, admin: dict = Depends(get_admin_user)):
    """Admin: Manually trigger overdue service suspension"""
    background_tasks.add_task(check_and_suspend_overdue_services)
    return {"message": "Suspension check started in background"}

@admin_router.post("/servers/{server_id}/unsuspend")
async def admin_unsuspend_server(server_id: str, background_tasks: BackgroundTasks, admin: dict = Depends(get_admin_user)):
    """Admin: Unsuspend a server (after payment received)"""
    server = await db.servers.find_one({"id": server_id}, {"_id": 0})
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    
    if server["status"] != "suspended":
        raise HTTPException(status_code=400, detail="Server is not suspended")
    
    # Calculate new renewal date based on billing cycle
    order = await db.orders.find_one({"id": server["order_id"]}, {"_id": 0})
    cycle_days = {"monthly": 30, "quarterly": 90, "yearly": 365}
    days = cycle_days.get(order["billing_cycle"], 30)
    new_renewal_date = (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()
    
    await db.servers.update_one(
        {"id": server_id},
        {"$set": {"status": "active", "renewal_date": new_renewal_date}, "$unset": {"suspended_at": ""}}
    )
    
    # Notify user
    user = await db.users.find_one({"id": server["user_id"]}, {"_id": 0})
    if user:
        background_tasks.add_task(
            send_email,
            user["email"],
            f"Service Restored - {server['hostname']}",
            f"""
            <h2>Service Restored!</h2>
            <p>Hi {user.get('full_name', 'Customer')},</p>
            <p>Great news! Your server <strong>{server['hostname']}</strong> has been restored.</p>
            <p><strong>New Renewal Date:</strong> {new_renewal_date[:10]}</p>
            <p>Thank you for your payment. Your service is now active again.</p>
            """
        )
    
    return {"message": f"Server {server['hostname']} has been unsuspended"}

@admin_router.put("/users/{user_id}")
async def admin_update_user(user_id: str, is_verified: Optional[bool] = None, wallet_balance: Optional[float] = None,
                            admin: dict = Depends(get_admin_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    updates = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if is_verified is not None:
        updates["is_verified"] = is_verified
    if wallet_balance is not None:
        old_balance = user["wallet_balance"]
        updates["wallet_balance"] = wallet_balance
        # Log transaction
        await db.transactions.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "type": "credit" if wallet_balance > old_balance else "debit",
            "amount": abs(wallet_balance - old_balance),
            "description": "Admin adjustment",
            "reference": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    await db.users.update_one({"id": user_id}, {"$set": updates})
    return {"message": "User updated"}

@admin_router.post("/test-email")
async def admin_test_email(admin: dict = Depends(get_admin_user)):
    """Send a test email to verify SendGrid configuration"""
    # Get settings to check configuration
    settings = await db.site_settings.find_one({"_id": "site_settings"})
    api_key = settings.get("sendgrid_api_key", "") if settings else ""
    sender_email = settings.get("sender_email", "") if settings else ""
    
    if not api_key:
        raise HTTPException(status_code=400, detail="SendGrid API key not configured. Please add your API key in Settings → Email and click 'Save All Settings'.")
    
    if not sender_email:
        raise HTTPException(status_code=400, detail="Sender email not configured. Please add a verified sender email in Settings → Email.")
    
    result = await send_email(
        admin["email"],
        "Test Email - KloudNests",
        f"""
        <h2>Test Email</h2>
        <p>Hi {admin.get('full_name', 'Admin')},</p>
        <p>This is a test email to verify your SendGrid configuration is working correctly.</p>
        <p>If you received this email, your email settings are properly configured!</p>
        <hr>
        <p><strong>Configuration Details:</strong></p>
        <ul>
            <li>Sender: {sender_email}</li>
            <li>Recipient: {admin['email']}</li>
        </ul>
        <hr>
        <p>Best regards,<br>KloudNests System</p>
        """
    )
    
    if result:
        return {"message": f"Test email sent to {admin['email']}! Check your inbox."}
    else:
        raise HTTPException(status_code=500, detail="Failed to send email. Please verify: 1) Your SendGrid API key is valid (starts with 'SG.'), 2) Your sender email is verified in SendGrid.")

@admin_router.get("/tickets")
async def admin_get_tickets(status: Optional[str] = None, admin: dict = Depends(get_admin_user)):
    query = {}
    if status:
        query["status"] = status
    tickets = await db.tickets.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return tickets

@admin_router.get("/tickets/{ticket_id}")
async def admin_get_ticket(ticket_id: str, admin: dict = Depends(get_admin_user)):
    ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    messages = await db.ticket_messages.find({"ticket_id": ticket_id}, {"_id": 0}).sort("created_at", 1).to_list(100)
    user = await db.users.find_one({"id": ticket["user_id"]}, {"_id": 0, "password_hash": 0})
    return {"ticket": ticket, "messages": messages, "user": user}

@admin_router.post("/tickets/{ticket_id}/messages")
async def admin_add_ticket_message(ticket_id: str, message_data: TicketMessageCreate, admin: dict = Depends(get_admin_user)):
    ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    message_doc = {
        "id": str(uuid.uuid4()),
        "ticket_id": ticket_id,
        "user_id": admin["id"],
        "message": message_data.message,
        "is_staff": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.ticket_messages.insert_one(message_doc)
    
    await db.tickets.update_one(
        {"id": ticket_id},
        {"$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Message added successfully"}

@admin_router.put("/tickets/{ticket_id}/status")
async def admin_update_ticket_status(ticket_id: str, status: str, admin: dict = Depends(get_admin_user)):
    await db.tickets.update_one(
        {"id": ticket_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Ticket status updated"}

@admin_router.get("/invoices")
async def admin_get_invoices(status: Optional[str] = None, admin: dict = Depends(get_admin_user)):
    query = {}
    if status:
        query["status"] = status
    invoices = await db.invoices.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return invoices

@admin_router.put("/invoices/{invoice_id}")
async def admin_update_invoice(invoice_id: str, status: str, admin: dict = Depends(get_admin_user)):
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    updates = {"status": status}
    if status == "paid":
        updates["paid_date"] = datetime.now(timezone.utc).isoformat()
    
    await db.invoices.update_one({"id": invoice_id}, {"$set": updates})
    return {"message": "Invoice updated"}

# ============ TOPUP REQUESTS MANAGEMENT ============

@admin_router.get("/topup-requests")
async def admin_get_topup_requests(status: Optional[str] = None, admin: dict = Depends(get_admin_user)):
    """Get all topup requests"""
    query = {}
    if status:
        query["status"] = status
    requests = await db.topup_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return requests

@admin_router.get("/topup-requests/{request_id}")
async def admin_get_topup_request(request_id: str, admin: dict = Depends(get_admin_user)):
    """Get a specific topup request"""
    request = await db.topup_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Topup request not found")
    return request

@admin_router.put("/topup-requests/{request_id}")
async def admin_update_topup_request(
    request_id: str, 
    status: str,
    admin_notes: Optional[str] = None,
    admin: dict = Depends(get_admin_user)
):
    """Approve or reject a topup request"""
    if status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Status must be 'approved' or 'rejected'")
    
    request = await db.topup_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Topup request not found")
    
    if request["status"] != "pending":
        raise HTTPException(status_code=400, detail="This request has already been processed")
    
    updates = {
        "status": status,
        "processed_at": datetime.now(timezone.utc).isoformat(),
        "processed_by": admin["email"]
    }
    if admin_notes:
        updates["admin_notes"] = admin_notes
    
    await db.topup_requests.update_one({"id": request_id}, {"$set": updates})
    
    # If approved, add funds to user wallet
    if status == "approved":
        user = await db.users.find_one({"id": request["user_id"]}, {"_id": 0})
        if user:
            new_balance = user.get("wallet_balance", 0) + request["amount"]
            await db.users.update_one(
                {"id": request["user_id"]},
                {"$set": {"wallet_balance": new_balance}}
            )
            
            # Create transaction record
            await db.transactions.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": request["user_id"],
                "type": "credit",
                "amount": request["amount"],
                "description": f"Wallet topup via {request['payment_method'].replace('_', ' ').title()}",
                "reference": request.get("transaction_ref", ""),
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            
            # Send confirmation email to user
            try:
                await send_email(
                    user["email"],
                    "Wallet Topup Approved - KloudNests",
                    f"""
                    <h2>Wallet Topup Approved!</h2>
                    <p>Great news! Your wallet topup request has been approved.</p>
                    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Amount Added:</strong> ${request['amount']:.2f}</p>
                        <p><strong>New Balance:</strong> ${new_balance:.2f}</p>
                        <p><strong>Payment Method:</strong> {request['payment_method'].replace('_', ' ').title()}</p>
                    </div>
                    <p>Thank you for choosing KloudNests!</p>
                    """
                )
            except Exception as e:
                logger.error(f"Failed to send topup confirmation email: {e}")
    else:
        # Send rejection email
        user = await db.users.find_one({"id": request["user_id"]}, {"_id": 0})
        if user:
            try:
                await send_email(
                    user["email"],
                    "Wallet Topup Request Update - KloudNests",
                    f"""
                    <h2>Wallet Topup Request Update</h2>
                    <p>Unfortunately, your wallet topup request could not be approved.</p>
                    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Amount:</strong> ${request['amount']:.2f}</p>
                        <p><strong>Payment Method:</strong> {request['payment_method'].replace('_', ' ').title()}</p>
                        {f"<p><strong>Reason:</strong> {admin_notes}</p>" if admin_notes else ""}
                    </div>
                    <p>If you believe this is an error, please contact our support team.</p>
                    """
                )
            except Exception as e:
                logger.error(f"Failed to send topup rejection email: {e}")
    
    return {"message": f"Topup request {status}"}

@api_router.get("/uploads/payment_proofs/{filename}")
async def get_payment_proof(filename: str):
    """Serve payment proof images"""
    file_path = Path("uploads/payment_proofs") / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

@admin_router.get("/plans")
async def admin_get_plans(admin: dict = Depends(get_admin_user)):
    plans = await db.plans.find({}, {"_id": 0}).to_list(100)
    return plans

@admin_router.get("/plans/{plan_id}")
async def admin_get_plan(plan_id: str, admin: dict = Depends(get_admin_user)):
    plan = await db.plans.find_one({"id": plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan

@admin_router.post("/plans")
async def admin_create_plan(data: AdminPlanCreate, admin: dict = Depends(get_admin_user)):
    plan_id = str(uuid.uuid4())
    plan_doc = {
        "id": plan_id,
        "name": data.name,
        "type": data.type,
        "cpu": data.cpu,
        "ram": data.ram,
        "storage": data.storage,
        "bandwidth": data.bandwidth,
        "price_monthly": data.price_monthly,
        "price_quarterly": data.price_quarterly,
        "price_yearly": data.price_yearly,
        "features": data.features,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.plans.insert_one(plan_doc)
    # Fetch the plan without _id to return clean response
    created_plan = await db.plans.find_one({"id": plan_id}, {"_id": 0})
    return {"message": "Plan created", "plan_id": plan_id, "plan": created_plan}

@admin_router.put("/plans/{plan_id}")
async def admin_update_plan(plan_id: str, data: AdminPlanUpdate, admin: dict = Depends(get_admin_user)):
    plan = await db.plans.find_one({"id": plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    updates = {}
    if data.name is not None:
        updates["name"] = data.name
    if data.cpu is not None:
        updates["cpu"] = data.cpu
    if data.ram is not None:
        updates["ram"] = data.ram
    if data.storage is not None:
        updates["storage"] = data.storage
    if data.bandwidth is not None:
        updates["bandwidth"] = data.bandwidth
    if data.price_monthly is not None:
        updates["price_monthly"] = data.price_monthly
    if data.price_quarterly is not None:
        updates["price_quarterly"] = data.price_quarterly
    if data.price_yearly is not None:
        updates["price_yearly"] = data.price_yearly
    if data.features is not None:
        updates["features"] = data.features
    if data.is_active is not None:
        updates["is_active"] = data.is_active
    
    if updates:
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.plans.update_one({"id": plan_id}, {"$set": updates})
    
    updated_plan = await db.plans.find_one({"id": plan_id}, {"_id": 0})
    return {"message": "Plan updated", "plan": updated_plan}

@admin_router.delete("/plans/{plan_id}")
async def admin_delete_plan(plan_id: str, admin: dict = Depends(get_admin_user)):
    plan = await db.plans.find_one({"id": plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Check if plan has any orders
    orders_count = await db.orders.count_documents({"plan_id": plan_id})
    if orders_count > 0:
        # Don't delete, just deactivate
        await db.plans.update_one({"id": plan_id}, {"$set": {"is_active": False}})
        return {"message": "Plan deactivated (has existing orders)", "deactivated": True}
    
    await db.plans.delete_one({"id": plan_id})
    return {"message": "Plan deleted", "deleted": True}

# ============ SITE SETTINGS ROUTES ============

@admin_router.get("/settings")
async def admin_get_settings(admin: dict = Depends(get_admin_user)):
    settings = await db.site_settings.find_one({"_id": "site_settings"})
    if settings:
        del settings["_id"]
    return settings or {}

@admin_router.put("/settings")
async def admin_update_settings(data: SiteSettingsUpdate, admin: dict = Depends(get_admin_user)):
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.site_settings.update_one(
        {"_id": "site_settings"},
        {"$set": updates},
        upsert=True
    )
    return {"message": "Settings updated"}

@api_router.get("/settings/public")
async def get_public_settings():
    settings = await db.site_settings.find_one({"_id": "site_settings"})
    if not settings:
        return {
            "company_name": "KloudNests",
            "company_description": "Enterprise Cloud Infrastructure Provider",
            "contact_email": "support@kloudnests.com",
            "contact_phone": "+1 (555) 123-4567",
            "contact_address": "123 Cloud Street, Tech City, TC 12345",
            "skype_id": "",
            "about_us": "KloudNests provides enterprise-grade cloud infrastructure including VPS, Shared Hosting, and Dedicated Servers.",
            "terms_of_service": "",
            "privacy_policy": "",
            "sla": "",
            "aup": "",
            "data_centers": "",
            "social_twitter": "",
            "social_linkedin": "",
            "social_github": ""
        }
    # Remove sensitive fields before returning
    sensitive_fields = ["_id", "sendgrid_api_key", "sender_email"]
    for field in sensitive_fields:
        settings.pop(field, None)
    return settings

# ============ PUBLIC ROUTES ============

@api_router.post("/contact")
async def contact_form(data: ContactRequest, background_tasks: BackgroundTasks):
    contact_id = str(uuid.uuid4())
    await db.contacts.insert_one({
        "id": contact_id,
        "name": data.name,
        "email": data.email,
        "subject": data.subject,
        "message": data.message,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Send confirmation email
    background_tasks.add_task(
        send_email,
        data.email,
        "We received your message - KloudNests",
        f"""
        <h2>Thank you for contacting us!</h2>
        <p>Hi {data.name},</p>
        <p>We have received your message and will get back to you soon.</p>
        <p><strong>Subject:</strong> {data.subject}</p>
        <p>Best regards,<br>KloudNests Team</p>
        """
    )
    
    return {"message": "Message sent successfully"}

@api_router.get("/")
async def root():
    return {"message": "KloudNests API v1.0"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include routers
api_router.include_router(auth_router)
api_router.include_router(plans_router)
api_router.include_router(orders_router)
api_router.include_router(servers_router)
api_router.include_router(invoices_router)
api_router.include_router(tickets_router)
api_router.include_router(user_router)
api_router.include_router(admin_router)
api_router.include_router(datacenters_router)
api_router.include_router(addons_router)

app.include_router(api_router)

# Add HTTPS redirect middleware first
app.add_middleware(HTTPSRedirectMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Seed initial data
@app.on_event("startup")
async def seed_data():
    # Check if plans exist
    plans_count = await db.plans.count_documents({})
    if plans_count == 0:
        # Seed VPS plans
        vps_plans = [
            {
                "id": str(uuid.uuid4()),
                "name": "VPS Starter",
                "type": "vps",
                "cpu": "1 vCPU",
                "ram": "1 GB",
                "storage": "25 GB NVMe",
                "bandwidth": "1 TB",
                "price_monthly": 5.99,
                "price_quarterly": 15.99,
                "price_yearly": 59.99,
                "features": ["99.9% Uptime", "DDoS Protection", "24/7 Support", "Root Access"],
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "VPS Pro",
                "type": "vps",
                "cpu": "2 vCPU",
                "ram": "4 GB",
                "storage": "80 GB NVMe",
                "bandwidth": "3 TB",
                "price_monthly": 19.99,
                "price_quarterly": 54.99,
                "price_yearly": 199.99,
                "features": ["99.9% Uptime", "DDoS Protection", "24/7 Support", "Root Access", "Weekly Backups"],
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "VPS Enterprise",
                "type": "vps",
                "cpu": "4 vCPU",
                "ram": "8 GB",
                "storage": "160 GB NVMe",
                "bandwidth": "5 TB",
                "price_monthly": 39.99,
                "price_quarterly": 109.99,
                "price_yearly": 399.99,
                "features": ["99.99% Uptime", "Advanced DDoS", "Priority Support", "Root Access", "Daily Backups", "Free SSL"],
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        
        # Seed Shared Hosting plans
        shared_plans = [
            {
                "id": str(uuid.uuid4()),
                "name": "Shared Basic",
                "type": "shared",
                "cpu": "Shared",
                "ram": "512 MB",
                "storage": "10 GB SSD",
                "bandwidth": "100 GB",
                "price_monthly": 2.99,
                "price_quarterly": 7.99,
                "price_yearly": 29.99,
                "features": ["1 Website", "Free SSL", "cPanel Access", "Email Accounts"],
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Shared Pro",
                "type": "shared",
                "cpu": "Shared",
                "ram": "1 GB",
                "storage": "50 GB SSD",
                "bandwidth": "Unlimited",
                "price_monthly": 7.99,
                "price_quarterly": 21.99,
                "price_yearly": 79.99,
                "features": ["10 Websites", "Free SSL", "cPanel Access", "Unlimited Email", "Free Domain"],
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        
        # Seed Dedicated/VDS plans
        dedicated_plans = [
            {
                "id": str(uuid.uuid4()),
                "name": "Dedicated Starter",
                "type": "dedicated",
                "cpu": "Intel Xeon E3",
                "ram": "16 GB DDR4",
                "storage": "500 GB NVMe",
                "bandwidth": "10 TB",
                "price_monthly": 99.99,
                "price_quarterly": 279.99,
                "price_yearly": 999.99,
                "features": ["Full Root Access", "DDoS Protection", "IPMI Access", "24/7 Support", "Free Setup"],
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Dedicated Pro",
                "type": "dedicated",
                "cpu": "Intel Xeon E5",
                "ram": "32 GB DDR4",
                "storage": "1 TB NVMe",
                "bandwidth": "Unlimited",
                "price_monthly": 199.99,
                "price_quarterly": 549.99,
                "price_yearly": 1999.99,
                "features": ["Full Root Access", "Advanced DDoS", "IPMI Access", "Priority Support", "Free Setup", "Hardware RAID"],
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        
        await db.plans.insert_many(vps_plans + shared_plans + dedicated_plans)
        logger.info("Seeded initial plans")
    
    # Create admin user if not exists
    admin_exists = await db.users.find_one({"role": "super_admin"})
    if not admin_exists:
        admin_doc = {
            "id": str(uuid.uuid4()),
            "email": "brijesh.kr.dube@gmail.com",
            "password_hash": hash_password("Cloud@9874"),
            "full_name": "Brijesh Dube",
            "company": "KloudNests",
            "role": "super_admin",
            "wallet_balance": 0.0,
            "is_verified": True,
            "is_2fa_enabled": False,
            "totp_secret": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_doc)
        logger.info("Created admin user: brijesh.kr.dube@gmail.com / Cloud@9874")
    
    # Seed data centers if not exist
    dc_count = await db.datacenters.count_documents({})
    if dc_count == 0:
        datacenters = [
            {
                "id": str(uuid.uuid4()),
                "name": "US East (New York)",
                "location": "New York",
                "country": "United States",
                "description": "Low latency to East Coast US and Europe",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "US West (Los Angeles)",
                "location": "Los Angeles",
                "country": "United States",
                "description": "Optimal for West Coast US and Asia-Pacific",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "EU Central (Frankfurt)",
                "location": "Frankfurt",
                "country": "Germany",
                "description": "Central European hub with excellent connectivity",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Asia (Singapore)",
                "location": "Singapore",
                "country": "Singapore",
                "description": "Asia-Pacific region with low latency",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.datacenters.insert_many(datacenters)
        logger.info("Seeded initial data centers")
    
    # Seed add-ons if not exist
    addon_count = await db.addons.count_documents({})
    if addon_count == 0:
        addons = [
            {
                "id": str(uuid.uuid4()),
                "name": "cPanel/WHM",
                "type": "control_panel",
                "price": 15.00,
                "billing_cycle": "monthly",
                "description": "Full-featured web hosting control panel",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Plesk",
                "type": "control_panel",
                "price": 12.00,
                "billing_cycle": "monthly",
                "description": "Web hosting platform for WordPress",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "SSL Certificate (Standard)",
                "type": "ssl",
                "price": 9.99,
                "billing_cycle": "yearly",
                "description": "Domain validated SSL certificate",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "SSL Certificate (Wildcard)",
                "type": "ssl",
                "price": 49.99,
                "billing_cycle": "yearly",
                "description": "Wildcard SSL for unlimited subdomains",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Daily Backup",
                "type": "backup",
                "price": 5.00,
                "billing_cycle": "monthly",
                "description": "Automated daily backups with 7-day retention",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Additional IPv4",
                "type": "ip",
                "price": 3.00,
                "billing_cycle": "monthly",
                "description": "Additional dedicated IPv4 address",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Priority Support",
                "type": "support",
                "price": 19.99,
                "billing_cycle": "monthly",
                "description": "24/7 priority support with 1-hour response time",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.addons.insert_many(addons)
        logger.info("Seeded initial add-ons")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
