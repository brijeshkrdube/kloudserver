"""
CloudNest API Tests - Iteration 5
Testing new features:
1. Admin Orders page - list orders with customer, plan, payment status, order status columns
2. Admin can change payment status dropdown (Pending -> Paid)
3. Provision button appears when payment_status=paid AND order_status=pending
4. Admin provision server dialog with enhanced fields (panel_url, panel_username, panel_password, additional_notes, send_email)
5. Admin Servers page shows allocated servers
6. Admin manual server allocation with payment options (wallet deduction or external payment)
7. User can place order with 'Pay from Wallet' payment option
8. Wallet balance deduction when paying from wallet
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://cloudserver-1.preview.emergentagent.com')


class TestHealthAndBasics:
    """Test basic endpoints"""
    
    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("PASS: Health endpoint working")


class TestAdminLogin:
    """Test admin authentication"""
    
    def test_admin_login(self):
        """Test admin can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "brijesh.kr.dube@gmail.com",
            "password": "Cloud@9874"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] in ["admin", "super_admin"]
        print(f"PASS: Admin login working - role: {data['user']['role']}")
        return data["access_token"]


class TestUserLogin:
    """Test user authentication"""
    
    def test_user_login(self):
        """Test user can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "Test123!"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "user"
        print(f"PASS: User login working - wallet balance: ${data['user']['wallet_balance']:.2f}")
        return data


class TestAdminOrdersPage:
    """Test Admin Orders page functionality"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "brijesh.kr.dube@gmail.com",
            "password": "Cloud@9874"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Admin login failed")
    
    def test_admin_get_orders_list(self, admin_token):
        """Test GET /api/admin/orders returns list of orders with user details"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/orders", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Admin orders endpoint returns list - {len(data)} orders found")
        return data
    
    def test_admin_orders_have_user_details(self, admin_token):
        """Test orders include user_email, user_name, user_company fields"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/orders", headers=headers)
        data = response.json()
        
        if len(data) > 0:
            order = data[0]
            assert "user_email" in order, "Missing user_email field"
            assert "user_name" in order, "Missing user_name field"
            assert "user_company" in order, "Missing user_company field"
            print(f"PASS: Orders have user details - {order['user_name']} ({order['user_email']})")
        else:
            print("INFO: No orders to verify user details")
    
    def test_admin_orders_have_required_columns(self, admin_token):
        """Test orders have required columns: plan_name, payment_status, order_status"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/orders", headers=headers)
        data = response.json()
        
        if len(data) > 0:
            order = data[0]
            required_fields = ["id", "plan_name", "payment_status", "order_status", "amount", "created_at"]
            for field in required_fields:
                assert field in order, f"Missing field: {field}"
            print(f"PASS: Orders have all required columns - plan: {order['plan_name']}, payment: {order['payment_status']}, status: {order['order_status']}")
        else:
            print("INFO: No orders to verify columns")
    
    def test_admin_orders_filter_by_status(self, admin_token):
        """Test filtering orders by status"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Test filter by pending status
        response = requests.get(f"{BASE_URL}/api/admin/orders", headers=headers, params={"status": "pending"})
        assert response.status_code == 200
        data = response.json()
        
        # All returned orders should have pending status
        for order in data:
            assert order["order_status"] == "pending", f"Expected pending status, got {order['order_status']}"
        
        print(f"PASS: Order filtering by status working - {len(data)} pending orders")


class TestAdminUpdateOrderPaymentStatus:
    """Test Admin can update order payment status"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "brijesh.kr.dube@gmail.com",
            "password": "Cloud@9874"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Admin login failed")
    
    @pytest.fixture
    def user_token(self):
        """Get user token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "Test123!"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("User login failed")
    
    def test_admin_update_payment_status_to_paid(self, admin_token, user_token):
        """Test admin can change payment status from pending to paid"""
        headers_admin = {"Authorization": f"Bearer {admin_token}"}
        headers_user = {"Authorization": f"Bearer {user_token}"}
        
        # First create an order with bank_transfer payment method
        plans_response = requests.get(f"{BASE_URL}/api/plans")
        plans = plans_response.json()
        
        if len(plans) == 0:
            pytest.skip("No plans available")
        
        order_data = {
            "plan_id": plans[0]["id"],
            "billing_cycle": "monthly",
            "os": "Ubuntu 22.04",
            "control_panel": None,
            "addons": [],
            "payment_method": "bank_transfer",
            "notes": "TEST_ORDER_PAYMENT_STATUS"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/orders/", headers=headers_user, json=order_data)
        assert create_response.status_code == 200
        order = create_response.json()
        order_id = order["id"]
        
        # Verify initial payment status is pending
        assert order["payment_status"] == "pending", f"Expected pending, got {order['payment_status']}"
        
        # Admin updates payment status to paid
        update_response = requests.put(
            f"{BASE_URL}/api/admin/orders/{order_id}",
            headers=headers_admin,
            json={"payment_status": "paid"}
        )
        assert update_response.status_code == 200
        
        # Verify the order was updated
        orders_response = requests.get(f"{BASE_URL}/api/admin/orders", headers=headers_admin)
        orders = orders_response.json()
        updated_order = next((o for o in orders if o["id"] == order_id), None)
        
        assert updated_order is not None
        assert updated_order["payment_status"] == "paid"
        print(f"PASS: Admin can update payment status to paid - Order: {order_id[:8]}")
        
        return order_id


class TestAdminProvisionServer:
    """Test Admin server provisioning from orders"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "brijesh.kr.dube@gmail.com",
            "password": "Cloud@9874"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Admin login failed")
    
    @pytest.fixture
    def user_token(self):
        """Get user token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "Test123!"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("User login failed")
    
    def test_provision_server_with_enhanced_fields(self, admin_token, user_token):
        """Test provisioning server with panel_url, panel_username, panel_password, additional_notes, send_email"""
        headers_admin = {"Authorization": f"Bearer {admin_token}"}
        headers_user = {"Authorization": f"Bearer {user_token}"}
        
        # Create an order
        plans_response = requests.get(f"{BASE_URL}/api/plans")
        plans = plans_response.json()
        
        if len(plans) == 0:
            pytest.skip("No plans available")
        
        order_data = {
            "plan_id": plans[0]["id"],
            "billing_cycle": "monthly",
            "os": "Ubuntu 22.04",
            "control_panel": "cpanel",
            "addons": [],
            "payment_method": "bank_transfer",
            "notes": "TEST_ORDER_PROVISION"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/orders/", headers=headers_user, json=order_data)
        assert create_response.status_code == 200
        order = create_response.json()
        order_id = order["id"]
        
        # Admin marks payment as paid
        requests.put(
            f"{BASE_URL}/api/admin/orders/{order_id}",
            headers=headers_admin,
            json={"payment_status": "paid"}
        )
        
        # Admin provisions server with enhanced fields
        provision_data = {
            "order_id": order_id,
            "ip_address": f"192.168.1.{uuid.uuid4().int % 255}",
            "hostname": f"test-server-{uuid.uuid4().hex[:8]}.kloudnests.com",
            "username": "root",
            "password": f"SecurePass{uuid.uuid4().hex[:8]}!",
            "ssh_port": 22,
            "panel_url": "https://server.kloudnests.com:2087",
            "panel_username": "admin",
            "panel_password": "PanelPass123!",
            "additional_notes": "Test server provisioned via automated testing",
            "send_email": False  # Don't send email during testing
        }
        
        provision_response = requests.post(
            f"{BASE_URL}/api/admin/servers",
            headers=headers_admin,
            json=provision_data
        )
        assert provision_response.status_code == 200
        data = provision_response.json()
        assert "server_id" in data
        print(f"PASS: Server provisioned with enhanced fields - Server ID: {data['server_id'][:8]}")
        
        return data["server_id"]
    
    def test_provision_server_updates_order_status(self, admin_token, user_token):
        """Test that provisioning server updates order status to active"""
        headers_admin = {"Authorization": f"Bearer {admin_token}"}
        headers_user = {"Authorization": f"Bearer {user_token}"}
        
        # Create an order
        plans_response = requests.get(f"{BASE_URL}/api/plans")
        plans = plans_response.json()
        
        if len(plans) == 0:
            pytest.skip("No plans available")
        
        order_data = {
            "plan_id": plans[0]["id"],
            "billing_cycle": "monthly",
            "os": "Ubuntu 22.04",
            "control_panel": None,
            "addons": [],
            "payment_method": "bank_transfer",
            "notes": "TEST_ORDER_STATUS_UPDATE"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/orders/", headers=headers_user, json=order_data)
        order = create_response.json()
        order_id = order["id"]
        
        # Admin marks payment as paid
        requests.put(
            f"{BASE_URL}/api/admin/orders/{order_id}",
            headers=headers_admin,
            json={"payment_status": "paid"}
        )
        
        # Admin provisions server
        provision_data = {
            "order_id": order_id,
            "ip_address": f"192.168.2.{uuid.uuid4().int % 255}",
            "hostname": f"test-status-{uuid.uuid4().hex[:8]}.kloudnests.com",
            "username": "root",
            "password": f"Pass{uuid.uuid4().hex[:8]}!",
            "ssh_port": 22,
            "send_email": False
        }
        
        requests.post(f"{BASE_URL}/api/admin/servers", headers=headers_admin, json=provision_data)
        
        # Verify order status is now active
        orders_response = requests.get(f"{BASE_URL}/api/admin/orders", headers=headers_admin)
        orders = orders_response.json()
        updated_order = next((o for o in orders if o["id"] == order_id), None)
        
        assert updated_order is not None
        assert updated_order["order_status"] == "active"
        print(f"PASS: Provisioning server updates order status to active - Order: {order_id[:8]}")


class TestAdminServersPage:
    """Test Admin Servers page functionality"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "brijesh.kr.dube@gmail.com",
            "password": "Cloud@9874"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Admin login failed")
    
    def test_admin_get_servers_list(self, admin_token):
        """Test GET /api/admin/servers returns list of servers"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/servers", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Admin servers endpoint returns list - {len(data)} servers found")
        return data
    
    def test_admin_servers_have_user_email(self, admin_token):
        """Test servers include user_email field"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/servers", headers=headers)
        data = response.json()
        
        if len(data) > 0:
            server = data[0]
            assert "user_email" in server, "Missing user_email field"
            print(f"PASS: Servers have user_email - {server['hostname']} ({server['user_email']})")
        else:
            print("INFO: No servers to verify user_email")
    
    def test_admin_servers_have_required_fields(self, admin_token):
        """Test servers have required fields"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/servers", headers=headers)
        data = response.json()
        
        if len(data) > 0:
            server = data[0]
            required_fields = ["id", "hostname", "ip_address", "username", "status", "created_at"]
            for field in required_fields:
                assert field in server, f"Missing field: {field}"
            print(f"PASS: Servers have all required fields - {server['hostname']}")
        else:
            print("INFO: No servers to verify fields")


class TestAdminAllocateServer:
    """Test Admin manual server allocation"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "brijesh.kr.dube@gmail.com",
            "password": "Cloud@9874"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Admin login failed")
    
    def test_allocate_server_with_external_payment(self, admin_token):
        """Test allocating server with external payment (no wallet deduction)"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get users
        users_response = requests.get(f"{BASE_URL}/api/admin/users", headers=headers)
        users = users_response.json()
        
        # Find test user
        test_user = next((u for u in users if u["email"] == "test@test.com"), None)
        if not test_user:
            pytest.skip("Test user not found")
        
        allocate_data = {
            "user_id": test_user["id"],
            "plan_id": "custom",
            "hostname": f"test-alloc-ext-{uuid.uuid4().hex[:8]}.kloudnests.com",
            "ip_address": f"10.0.0.{uuid.uuid4().int % 255}",
            "username": "root",
            "password": f"AllocPass{uuid.uuid4().hex[:8]}!",
            "port": "22",
            "control_panel_url": "https://panel.example.com:2087",
            "control_panel_username": "admin",
            "control_panel_password": "PanelPass!",
            "additional_notes": "Allocated via automated testing - external payment",
            "send_email": False,
            "payment_received": True,  # External payment
            "amount": 0
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/servers/allocate", headers=headers, json=allocate_data)
        assert response.status_code == 200
        data = response.json()
        assert "server_id" in data
        print(f"PASS: Server allocated with external payment - Server ID: {data['server_id'][:8]}")
        
        return data["server_id"]
    
    def test_allocate_server_with_wallet_deduction(self, admin_token):
        """Test allocating server with wallet deduction"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get users
        users_response = requests.get(f"{BASE_URL}/api/admin/users", headers=headers)
        users = users_response.json()
        
        # Find test user
        test_user = next((u for u in users if u["email"] == "test@test.com"), None)
        if not test_user:
            pytest.skip("Test user not found")
        
        initial_balance = test_user.get("wallet_balance", 0)
        
        # If user has no balance, add some first
        if initial_balance < 10:
            # Admin adds wallet balance
            requests.put(
                f"{BASE_URL}/api/admin/users/{test_user['id']}",
                headers=headers,
                params={"wallet_balance": 100.0}
            )
            initial_balance = 100.0
        
        deduct_amount = 25.0
        
        allocate_data = {
            "user_id": test_user["id"],
            "plan_id": "custom",
            "hostname": f"test-alloc-wallet-{uuid.uuid4().hex[:8]}.kloudnests.com",
            "ip_address": f"10.0.1.{uuid.uuid4().int % 255}",
            "username": "root",
            "password": f"WalletPass{uuid.uuid4().hex[:8]}!",
            "port": "22",
            "send_email": False,
            "payment_received": False,  # Deduct from wallet
            "amount": deduct_amount
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/servers/allocate", headers=headers, json=allocate_data)
        assert response.status_code == 200
        data = response.json()
        assert "server_id" in data
        
        # Verify wallet was deducted
        users_response = requests.get(f"{BASE_URL}/api/admin/users", headers=headers)
        users = users_response.json()
        updated_user = next((u for u in users if u["email"] == "test@test.com"), None)
        
        expected_balance = initial_balance - deduct_amount
        actual_balance = updated_user.get("wallet_balance", 0)
        
        # Allow small floating point difference
        assert abs(actual_balance - expected_balance) < 0.01, \
            f"Expected balance {expected_balance}, got {actual_balance}"
        
        print(f"PASS: Server allocated with wallet deduction - ${deduct_amount} deducted, new balance: ${actual_balance:.2f}")
        
        return data["server_id"]
    
    def test_allocate_server_insufficient_balance(self, admin_token):
        """Test allocating server fails with insufficient wallet balance"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get users
        users_response = requests.get(f"{BASE_URL}/api/admin/users", headers=headers)
        users = users_response.json()
        
        # Find test user
        test_user = next((u for u in users if u["email"] == "test@test.com"), None)
        if not test_user:
            pytest.skip("Test user not found")
        
        current_balance = test_user.get("wallet_balance", 0)
        
        # Try to allocate with amount greater than balance
        allocate_data = {
            "user_id": test_user["id"],
            "hostname": f"test-fail-{uuid.uuid4().hex[:8]}.kloudnests.com",
            "ip_address": f"10.0.2.{uuid.uuid4().int % 255}",
            "username": "root",
            "password": "TestPass123!",
            "port": "22",
            "send_email": False,
            "payment_received": False,
            "amount": current_balance + 1000  # More than available
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/servers/allocate", headers=headers, json=allocate_data)
        assert response.status_code == 400
        assert "Insufficient wallet balance" in response.json()["detail"]
        print(f"PASS: Server allocation correctly fails with insufficient balance")


class TestUserWalletPayment:
    """Test user placing order with wallet payment"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "brijesh.kr.dube@gmail.com",
            "password": "Cloud@9874"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Admin login failed")
    
    @pytest.fixture
    def user_token_and_data(self, admin_token):
        """Get user token and ensure sufficient wallet balance"""
        headers_admin = {"Authorization": f"Bearer {admin_token}"}
        
        # Login as user
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "Test123!"
        })
        if response.status_code != 200:
            pytest.skip("User login failed")
        
        user_data = response.json()
        user_token = user_data["access_token"]
        user_id = user_data["user"]["id"]
        
        # Ensure user has sufficient wallet balance
        if user_data["user"]["wallet_balance"] < 200:
            requests.put(
                f"{BASE_URL}/api/admin/users/{user_id}",
                headers=headers_admin,
                params={"wallet_balance": 500.0}
            )
        
        # Re-fetch user data
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "Test123!"
        })
        user_data = response.json()
        
        return {
            "token": user_data["access_token"],
            "user": user_data["user"]
        }
    
    def test_order_with_wallet_payment(self, user_token_and_data):
        """Test placing order with wallet payment method"""
        headers = {"Authorization": f"Bearer {user_token_and_data['token']}"}
        initial_balance = user_token_and_data["user"]["wallet_balance"]
        
        # Get plans
        plans_response = requests.get(f"{BASE_URL}/api/plans")
        plans = plans_response.json()
        
        if len(plans) == 0:
            pytest.skip("No plans available")
        
        plan = plans[0]
        expected_amount = plan["price_monthly"]
        
        order_data = {
            "plan_id": plan["id"],
            "billing_cycle": "monthly",
            "os": "Ubuntu 22.04",
            "control_panel": None,
            "addons": [],
            "payment_method": "wallet",
            "notes": "TEST_WALLET_PAYMENT"
        }
        
        response = requests.post(f"{BASE_URL}/api/orders/", headers=headers, json=order_data)
        assert response.status_code == 200
        order = response.json()
        
        # Verify payment status is paid immediately
        assert order["payment_status"] == "paid", f"Expected paid, got {order['payment_status']}"
        
        # Verify order status is pending (waiting for provisioning)
        assert order["order_status"] == "pending", f"Expected pending, got {order['order_status']}"
        
        # Verify wallet was deducted
        me_response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        updated_user = me_response.json()
        
        expected_balance = initial_balance - expected_amount
        actual_balance = updated_user["wallet_balance"]
        
        assert abs(actual_balance - expected_balance) < 0.01, \
            f"Expected balance {expected_balance}, got {actual_balance}"
        
        print(f"PASS: Order placed with wallet payment - Amount: ${expected_amount}, New balance: ${actual_balance:.2f}")
        
        return order["id"]
    
    def test_order_with_wallet_insufficient_balance(self, admin_token):
        """Test order fails with insufficient wallet balance"""
        headers_admin = {"Authorization": f"Bearer {admin_token}"}
        
        # Login as user
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "Test123!"
        })
        user_data = response.json()
        user_token = user_data["access_token"]
        user_id = user_data["user"]["id"]
        
        # Set wallet balance to very low
        requests.put(
            f"{BASE_URL}/api/admin/users/{user_id}",
            headers=headers_admin,
            params={"wallet_balance": 0.50}
        )
        
        headers_user = {"Authorization": f"Bearer {user_token}"}
        
        # Get plans
        plans_response = requests.get(f"{BASE_URL}/api/plans")
        plans = plans_response.json()
        
        if len(plans) == 0:
            pytest.skip("No plans available")
        
        order_data = {
            "plan_id": plans[0]["id"],
            "billing_cycle": "monthly",
            "os": "Ubuntu 22.04",
            "control_panel": None,
            "addons": [],
            "payment_method": "wallet",
            "notes": "TEST_INSUFFICIENT_BALANCE"
        }
        
        response = requests.post(f"{BASE_URL}/api/orders/", headers=headers_user, json=order_data)
        assert response.status_code == 400
        assert "Insufficient wallet balance" in response.json()["detail"]
        
        print("PASS: Order correctly fails with insufficient wallet balance")
        
        # Restore wallet balance for other tests
        requests.put(
            f"{BASE_URL}/api/admin/users/{user_id}",
            headers=headers_admin,
            params={"wallet_balance": 500.0}
        )


class TestInvoiceGeneration:
    """Test invoice generation on server allocation"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "brijesh.kr.dube@gmail.com",
            "password": "Cloud@9874"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Admin login failed")
    
    def test_invoice_created_on_allocation(self, admin_token):
        """Test that invoice is created when server is allocated"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get users
        users_response = requests.get(f"{BASE_URL}/api/admin/users", headers=headers)
        users = users_response.json()
        
        # Find test user
        test_user = next((u for u in users if u["email"] == "test@test.com"), None)
        if not test_user:
            pytest.skip("Test user not found")
        
        # Get initial invoice count
        invoices_response = requests.get(f"{BASE_URL}/api/admin/invoices", headers=headers)
        initial_invoices = invoices_response.json()
        initial_count = len([i for i in initial_invoices if i["user_id"] == test_user["id"]])
        
        # Allocate server with amount
        allocate_data = {
            "user_id": test_user["id"],
            "hostname": f"test-invoice-{uuid.uuid4().hex[:8]}.kloudnests.com",
            "ip_address": f"10.0.3.{uuid.uuid4().int % 255}",
            "username": "root",
            "password": "InvoicePass123!",
            "port": "22",
            "send_email": False,
            "payment_received": True,  # External payment
            "amount": 50.0
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/servers/allocate", headers=headers, json=allocate_data)
        assert response.status_code == 200
        
        # Verify invoice was created
        invoices_response = requests.get(f"{BASE_URL}/api/admin/invoices", headers=headers)
        new_invoices = invoices_response.json()
        new_count = len([i for i in new_invoices if i["user_id"] == test_user["id"]])
        
        assert new_count > initial_count, "Invoice was not created"
        
        # Find the new invoice
        new_invoice = next(
            (i for i in new_invoices if i["user_id"] == test_user["id"] and "Server Allocation" in i.get("description", "")),
            None
        )
        
        if new_invoice:
            assert new_invoice["status"] == "paid"
            print(f"PASS: Invoice created on server allocation - Invoice: {new_invoice['invoice_number']}")
        else:
            print("PASS: Invoice count increased after allocation")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
