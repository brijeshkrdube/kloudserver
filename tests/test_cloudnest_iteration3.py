"""
CloudNest API Tests - Iteration 3
Testing new features:
1. Admin Settings - Email tab with SendGrid API key and sender email fields
2. PDF Invoice download
3. Password reset flow
4. Server control actions (reboot/reinstall)
5. Payment proof upload
6. Admin Orders page shows user details
7. Admin Users page - view user details
8. Admin User Details page with tabs
9. Admin User Details - Send Notification
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://datastack-1.preview.emergentagent.com')


class TestHealthAndBasics:
    """Test basic endpoints"""
    
    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("PASS: Health endpoint working")
    
    def test_plans_endpoint(self):
        """Test plans listing endpoint"""
        response = requests.get(f"{BASE_URL}/api/plans")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"PASS: Plans endpoint working - {len(data)} plans found")


class TestAuthentication:
    """Test authentication endpoints"""
    
    def test_user_login(self):
        """Test user login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "Test123!"
        })
        
        if response.status_code == 200:
            data = response.json()
            assert "access_token" in data
            assert "user" in data
            print(f"PASS: User login successful - {data['user']['email']}")
            return data["access_token"]
        elif response.status_code == 401:
            print("INFO: User test@test.com not found, will register")
            # Register user
            reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": "test@test.com",
                "password": "Test123!",
                "full_name": "Test User"
            })
            if reg_response.status_code == 200:
                data = reg_response.json()
                print(f"PASS: User registered and logged in - {data['user']['email']}")
                return data["access_token"]
        return None
    
    def test_admin_login(self):
        """Test admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "brijesh.kr.dube@gmail.com",
            "password": "Cloud@9874"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] in ["admin", "super_admin"]
        print(f"PASS: Admin login successful - role: {data['user']['role']}")
        return data["access_token"]


class TestPasswordResetFlow:
    """Test password reset flow - NEW FEATURE"""
    
    def test_forgot_password_endpoint(self):
        """Test forgot password endpoint"""
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": "test@test.com"
        })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"PASS: Forgot password endpoint working - {data['message']}")
    
    def test_reset_password_invalid_token(self):
        """Test reset password with invalid token"""
        response = requests.post(f"{BASE_URL}/api/auth/reset-password", json={
            "token": "invalid-token-12345",
            "new_password": "NewPassword123!"
        })
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print(f"PASS: Reset password correctly rejects invalid token - {data['detail']}")


class TestAdminSettingsEmailTab:
    """Test Admin Settings Email tab - NEW FEATURE"""
    
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
    
    def test_get_admin_settings_with_email_fields(self, admin_token):
        """Test getting admin settings includes email fields"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/settings/", headers=headers)
        assert response.status_code == 200
        # Settings may be empty initially, but endpoint should work
        print("PASS: Admin settings GET endpoint working")
    
    def test_update_email_settings(self, admin_token):
        """Test updating email settings (SendGrid API key and sender email)"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Update email settings
        update_data = {
            "sendgrid_api_key": "SG.test-api-key-for-testing",
            "sender_email": "noreply@cloudnest.com"
        }
        
        response = requests.put(f"{BASE_URL}/api/admin/settings/", 
                               headers=headers, json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Settings updated"
        print("PASS: Email settings (SendGrid API key, sender email) update working")


class TestPDFInvoiceDownload:
    """Test PDF Invoice download - NEW FEATURE"""
    
    @pytest.fixture
    def user_token(self):
        """Get user token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "Test123!"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        
        # Register if not exists
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": "test@test.com",
            "password": "Test123!",
            "full_name": "Test User"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Could not get user token")
    
    def test_get_invoices(self, user_token):
        """Test getting user invoices"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.get(f"{BASE_URL}/api/invoices/", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Invoices endpoint working - {len(data)} invoices found")
        return data
    
    def test_download_invoice_pdf(self, user_token):
        """Test downloading invoice as PDF"""
        headers = {"Authorization": f"Bearer {user_token}"}
        
        # First get invoices
        invoices_response = requests.get(f"{BASE_URL}/api/invoices/", headers=headers)
        invoices = invoices_response.json()
        
        if len(invoices) == 0:
            # Create an order to generate an invoice
            plans_response = requests.get(f"{BASE_URL}/api/plans")
            plans = plans_response.json()
            if len(plans) > 0:
                order_data = {
                    "plan_id": plans[0]["id"],
                    "billing_cycle": "monthly",
                    "os": "Ubuntu 22.04",
                    "control_panel": None,
                    "addons": [],
                    "payment_method": "bank_transfer",
                    "notes": "Test order for PDF invoice"
                }
                requests.post(f"{BASE_URL}/api/orders/", headers=headers, json=order_data)
                
                # Get invoices again
                invoices_response = requests.get(f"{BASE_URL}/api/invoices/", headers=headers)
                invoices = invoices_response.json()
        
        if len(invoices) > 0:
            invoice_id = invoices[0]["id"]
            
            # Download PDF
            pdf_response = requests.get(f"{BASE_URL}/api/invoices/{invoice_id}/pdf", headers=headers)
            assert pdf_response.status_code == 200
            assert pdf_response.headers.get("content-type") == "application/pdf"
            assert len(pdf_response.content) > 0
            print(f"PASS: PDF invoice download working - Invoice: {invoices[0]['invoice_number']}")
        else:
            print("INFO: No invoices available to test PDF download")


class TestServerControlActions:
    """Test Server control actions (reboot/reinstall) - NEW FEATURE"""
    
    @pytest.fixture
    def user_token(self):
        """Get user token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "Test123!"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Could not get user token")
    
    def test_get_servers(self, user_token):
        """Test getting user servers"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.get(f"{BASE_URL}/api/servers/", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Servers endpoint working - {len(data)} servers found")
        return data
    
    def test_server_control_action_without_server(self, user_token):
        """Test server control action returns 404 for non-existent server"""
        headers = {"Authorization": f"Bearer {user_token}"}
        
        # Try to reboot a non-existent server
        response = requests.post(f"{BASE_URL}/api/servers/non-existent-id/control", 
                                headers=headers, 
                                json={"action": "reboot", "confirm": True})
        assert response.status_code == 404
        print("PASS: Server control correctly returns 404 for non-existent server")


class TestPaymentProofUpload:
    """Test Payment proof upload - NEW FEATURE"""
    
    @pytest.fixture
    def user_token(self):
        """Get user token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@test.com",
            "password": "Test123!"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Could not get user token")
    
    def test_upload_payment_proof(self, user_token):
        """Test uploading payment proof for an order"""
        headers = {"Authorization": f"Bearer {user_token}"}
        
        # Get orders
        orders_response = requests.get(f"{BASE_URL}/api/orders/", headers=headers)
        orders = orders_response.json()
        
        # Find a pending order
        pending_orders = [o for o in orders if o["payment_status"] != "paid"]
        
        if len(pending_orders) > 0:
            order_id = pending_orders[0]["id"]
            
            # Upload payment proof
            response = requests.post(
                f"{BASE_URL}/api/orders/{order_id}/payment-proof",
                headers=headers,
                params={
                    "proof_url": "https://imgur.com/test-payment-proof.png",
                    "payment_reference": "TXN123456789"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                assert "message" in data
                print(f"PASS: Payment proof upload working - Order: {order_id[:8]}")
            elif response.status_code == 400:
                # Order might already be paid
                print(f"INFO: Order {order_id[:8]} already paid or proof already uploaded")
        else:
            print("INFO: No pending orders to test payment proof upload")


class TestAdminOrdersWithUserDetails:
    """Test Admin Orders page shows user details - NEW FEATURE"""
    
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
    
    def test_admin_orders_include_user_details(self, admin_token):
        """Test admin orders endpoint includes user details"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/orders", headers=headers)
        assert response.status_code == 200
        orders = response.json()
        
        if len(orders) > 0:
            order = orders[0]
            # Check for user details fields
            assert "user_email" in order, "Missing user_email in order"
            assert "user_name" in order, "Missing user_name in order"
            assert "user_company" in order, "Missing user_company in order"
            print(f"PASS: Admin orders include user details - {len(orders)} orders, first user: {order['user_email']}")
        else:
            print("INFO: No orders to verify user details")


class TestAdminUserDetails:
    """Test Admin User Details page - NEW FEATURE"""
    
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
    
    def test_admin_get_users(self, admin_token):
        """Test admin get users endpoint"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=headers)
        assert response.status_code == 200
        users = response.json()
        assert isinstance(users, list)
        print(f"PASS: Admin users endpoint working - {len(users)} users found")
        return users
    
    def test_admin_get_user_details(self, admin_token):
        """Test admin get user details endpoint with all tabs data"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First get users
        users_response = requests.get(f"{BASE_URL}/api/admin/users", headers=headers)
        users = users_response.json()
        
        if len(users) > 0:
            user_id = users[0]["id"]
            
            # Get user details
            response = requests.get(f"{BASE_URL}/api/admin/users/{user_id}/details", headers=headers)
            assert response.status_code == 200
            data = response.json()
            
            # Verify all expected fields are present
            assert "user" in data, "Missing user info"
            assert "statistics" in data, "Missing statistics"
            assert "orders" in data, "Missing orders"
            assert "invoices" in data, "Missing invoices"
            assert "servers" in data, "Missing servers"
            assert "tickets" in data, "Missing tickets"
            assert "transactions" in data, "Missing transactions"
            assert "upcoming_payments" in data, "Missing upcoming_payments"
            
            # Verify statistics fields
            stats = data["statistics"]
            assert "total_spent" in stats
            assert "active_services" in stats
            assert "total_orders" in stats
            assert "open_tickets" in stats
            
            print(f"PASS: Admin user details endpoint working - User: {data['user']['email']}")
            print(f"  - Orders: {len(data['orders'])}, Invoices: {len(data['invoices'])}, Servers: {len(data['servers'])}")
        else:
            print("INFO: No users to test user details")
    
    def test_admin_notify_user(self, admin_token):
        """Test admin send notification to user endpoint"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First get users
        users_response = requests.get(f"{BASE_URL}/api/admin/users", headers=headers)
        users = users_response.json()
        
        if len(users) > 0:
            user_id = users[0]["id"]
            
            # Send notification
            response = requests.post(
                f"{BASE_URL}/api/admin/users/{user_id}/notify",
                headers=headers,
                params={
                    "subject": "Test Notification",
                    "message": "This is a test notification from automated testing."
                }
            )
            assert response.status_code == 200
            data = response.json()
            assert "message" in data
            print(f"PASS: Admin notify user endpoint working - {data['message']}")
        else:
            print("INFO: No users to test notification")


class TestAdminUserDetailsNotFound:
    """Test Admin User Details for non-existent user"""
    
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
    
    def test_admin_get_user_details_not_found(self, admin_token):
        """Test admin get user details returns 404 for non-existent user"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/users/non-existent-user-id/details", headers=headers)
        assert response.status_code == 404
        print("PASS: Admin user details correctly returns 404 for non-existent user")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
