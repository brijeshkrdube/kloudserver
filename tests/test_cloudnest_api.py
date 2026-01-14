"""
CloudNest API Tests - Iteration 2
Testing: Order page bug fix, new static pages, admin settings, support page
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://cloudserver-1.preview.emergentagent.com')

class TestHealthAndPublicEndpoints:
    """Test public endpoints"""
    
    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("PASS: Health endpoint working")
    
    def test_public_settings_endpoint(self):
        """Test public settings endpoint for footer/support page"""
        response = requests.get(f"{BASE_URL}/api/settings/public")
        assert response.status_code == 200
        data = response.json()
        
        # Verify expected fields exist
        expected_fields = [
            "company_name", "company_description", "contact_email", 
            "contact_phone", "contact_address", "skype_id"
        ]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        
        print(f"PASS: Public settings endpoint working - company: {data.get('company_name')}")
    
    def test_plans_endpoint(self):
        """Test plans listing endpoint"""
        response = requests.get(f"{BASE_URL}/api/plans")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Verify plan structure
        plan = data[0]
        required_fields = ["id", "name", "type", "cpu", "ram", "storage", "price_monthly"]
        for field in required_fields:
            assert field in plan, f"Missing field in plan: {field}"
        
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
            print("INFO: User test@test.com not found, may need registration")
            return None
        else:
            print(f"WARN: Login returned {response.status_code}")
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


class TestAdminSettings:
    """Test admin settings endpoints"""
    
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
    
    def test_get_admin_settings(self, admin_token):
        """Test getting admin settings"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/settings/", headers=headers)
        assert response.status_code == 200
        print("PASS: Admin settings GET endpoint working")
    
    def test_update_admin_settings(self, admin_token):
        """Test updating admin settings"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Update settings
        update_data = {
            "company_name": "CloudNest",
            "company_description": "Enterprise Cloud Infrastructure Provider",
            "contact_email": "support@cloudnest.com",
            "skype_id": "cloudnest.support"
        }
        
        response = requests.put(f"{BASE_URL}/api/admin/settings/", 
                               headers=headers, json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Settings updated"
        print("PASS: Admin settings PUT endpoint working")
        
        # Verify update via public endpoint
        public_response = requests.get(f"{BASE_URL}/api/settings/public")
        assert public_response.status_code == 200
        public_data = public_response.json()
        assert public_data.get("skype_id") == "cloudnest.support"
        print("PASS: Settings update reflected in public endpoint")


class TestOrderFlow:
    """Test order creation flow (related to P0 bug fix)"""
    
    @pytest.fixture
    def user_token(self):
        """Get user token"""
        # Try login first
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
    
    def test_create_order_with_none_control_panel(self, user_token):
        """Test creating order with control_panel=None (P0 bug fix verification)"""
        headers = {"Authorization": f"Bearer {user_token}"}
        
        # Get a plan first
        plans_response = requests.get(f"{BASE_URL}/api/plans")
        assert plans_response.status_code == 200
        plans = plans_response.json()
        assert len(plans) > 0
        plan_id = plans[0]["id"]
        
        # Create order with control_panel=None (the bug fix)
        order_data = {
            "plan_id": plan_id,
            "billing_cycle": "monthly",
            "os": "Ubuntu 22.04",
            "control_panel": None,  # This was causing the crash before the fix
            "addons": [],
            "payment_method": "bank_transfer",
            "notes": "Test order - control panel none"
        }
        
        response = requests.post(f"{BASE_URL}/api/orders/", 
                                headers=headers, json=order_data)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["control_panel"] is None
        print(f"PASS: Order created with control_panel=None - Order ID: {data['id'][:8]}")
    
    def test_create_order_with_cpanel(self, user_token):
        """Test creating order with control_panel=cpanel"""
        headers = {"Authorization": f"Bearer {user_token}"}
        
        # Get a plan first
        plans_response = requests.get(f"{BASE_URL}/api/plans")
        plans = plans_response.json()
        plan_id = plans[0]["id"]
        
        # Create order with control_panel=cpanel
        order_data = {
            "plan_id": plan_id,
            "billing_cycle": "monthly",
            "os": "Ubuntu 22.04",
            "control_panel": "cpanel",
            "addons": [],
            "payment_method": "crypto",
            "notes": "Test order - with cPanel"
        }
        
        response = requests.post(f"{BASE_URL}/api/orders/", 
                                headers=headers, json=order_data)
        assert response.status_code == 200
        data = response.json()
        assert data["control_panel"] == "cpanel"
        print(f"PASS: Order created with control_panel=cpanel - Order ID: {data['id'][:8]}")


class TestContactForm:
    """Test contact form endpoint"""
    
    def test_contact_form_submission(self):
        """Test contact form submission"""
        contact_data = {
            "name": "Test User",
            "email": "testcontact@example.com",
            "subject": "Test Inquiry",
            "message": "This is a test message from automated testing."
        }
        
        response = requests.post(f"{BASE_URL}/api/contact", json=contact_data)
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Message sent successfully"
        print("PASS: Contact form submission working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
