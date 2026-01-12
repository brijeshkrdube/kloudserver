from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, BackgroundTasks, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import RedirectResponse
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
JWT_SECRET = os.environ.get('JWT_SECRET', 'cloudnest-secure-jwt-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# SendGrid Config
SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'noreply@cloudnest.com')

# Create the main app
app = FastAPI(title="CloudNest API", version="1.0.0")

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
    addons: List[str]
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
    status: str
    plan_name: str
    renewal_date: str
    created_at: str

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
    if not SENDGRID_API_KEY:
        logging.warning("SendGrid API key not configured, skipping email")
        return False
    try:
        message = Mail(
            from_email=SENDER_EMAIL,
            to_emails=to_email,
            subject=subject,
            html_content=html_content
        )
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        sg.send(message)
        return True
    except Exception as e:
        logging.error(f"Failed to send email: {e}")
        return False

# ============ AUTH ROUTES ============

@auth_router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate, background_tasks: BackgroundTasks):
    existing = await db.users.find_one({"email": user_data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email.lower(),
        "password_hash": hash_password(user_data.password),
        "full_name": user_data.full_name,
        "company": user_data.company,
        "role": "user",
        "wallet_balance": 0.0,
        "is_verified": False,
        "is_2fa_enabled": False,
        "totp_secret": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    # Send welcome email
    background_tasks.add_task(
        send_email,
        user_data.email,
        "Welcome to CloudNest!",
        f"""
        <h2>Welcome to CloudNest, {user_data.full_name}!</h2>
        <p>Your account has been created successfully.</p>
        <p>Start exploring our VPS, Shared Hosting, and Dedicated Server solutions.</p>
        <p>Best regards,<br>CloudNest Team</p>
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
    qr_uri = totp.provisioning_uri(name=user["email"], issuer_name="CloudNest")
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"totp_secret_pending": secret}}
    )
    return Setup2FAResponse(secret=secret, qr_uri=qr_uri)

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
            "Password Reset - CloudNest",
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
    
    price_map = {
        "monthly": plan["price_monthly"],
        "quarterly": plan["price_quarterly"],
        "yearly": plan["price_yearly"]
    }
    amount = price_map[order_data.billing_cycle]
    
    order_id = str(uuid.uuid4())
    order_doc = {
        "id": order_id,
        "user_id": user["id"],
        "plan_id": plan["id"],
        "plan_name": plan["name"],
        "billing_cycle": order_data.billing_cycle,
        "os": order_data.os,
        "control_panel": order_data.control_panel,
        "addons": order_data.addons or [],
        "amount": amount,
        "payment_method": order_data.payment_method,
        "payment_status": "pending",
        "order_status": "pending",
        "notes": order_data.notes,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(order_doc)
    
    # Create invoice
    invoice_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "order_id": order_id,
        "invoice_number": generate_invoice_number(),
        "amount": amount,
        "status": "unpaid",
        "due_date": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "paid_date": None,
        "description": f"Order: {plan['name']} - {order_data.billing_cycle}",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.invoices.insert_one(invoice_doc)
    
    # Send order confirmation email
    background_tasks.add_task(
        send_email,
        user["email"],
        f"Order Confirmation - {order_id[:8]}",
        f"""
        <h2>Order Received!</h2>
        <p>Thank you for your order, {user['full_name']}!</p>
        <p><strong>Order ID:</strong> {order_id[:8]}</p>
        <p><strong>Plan:</strong> {plan['name']}</p>
        <p><strong>Amount:</strong> ${amount}</p>
        <p><strong>Payment Method:</strong> {order_data.payment_method.replace('_', ' ').title()}</p>
        <p>Please complete your payment to activate your service.</p>
        """
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

@user_router.post("/wallet/topup")
async def request_topup(data: WalletTopupRequest, user: dict = Depends(get_current_user)):
    topup_id = str(uuid.uuid4())
    await db.topup_requests.insert_one({
        "id": topup_id,
        "user_id": user["id"],
        "amount": data.amount,
        "payment_method": data.payment_method,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
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

@admin_router.get("/orders", response_model=List[OrderResponse])
async def admin_get_orders(status: Optional[str] = None, admin: dict = Depends(get_admin_user)):
    query = {}
    if status:
        query["order_status"] = status
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return orders

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
            "Your Server is Ready! - CloudNest",
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
        "Your Server Credentials - CloudNest",
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
                    "Server Credentials Updated - CloudNest",
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
    return {"message": "Plan created", "plan_id": plan_id, "plan": plan_doc}

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
            "company_name": "CloudNest",
            "company_description": "Enterprise Cloud Infrastructure Provider",
            "contact_email": "support@cloudnest.com",
            "contact_phone": "+1 (555) 123-4567",
            "contact_address": "123 Cloud Street, Tech City, TC 12345",
            "skype_id": "",
            "about_us": "CloudNest provides enterprise-grade cloud infrastructure including VPS, Shared Hosting, and Dedicated Servers.",
            "terms_of_service": "",
            "privacy_policy": "",
            "sla": "",
            "aup": "",
            "data_centers": "",
            "social_twitter": "",
            "social_linkedin": "",
            "social_github": ""
        }
    del settings["_id"]
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
        "We received your message - CloudNest",
        f"""
        <h2>Thank you for contacting us!</h2>
        <p>Hi {data.name},</p>
        <p>We have received your message and will get back to you soon.</p>
        <p><strong>Subject:</strong> {data.subject}</p>
        <p>Best regards,<br>CloudNest Team</p>
        """
    )
    
    return {"message": "Message sent successfully"}

@api_router.get("/")
async def root():
    return {"message": "CloudNest API v1.0"}

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
            "company": "CloudNest",
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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
