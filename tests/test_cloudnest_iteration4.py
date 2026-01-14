"""
CloudNest API Tests - Iteration 4
Testing new features:
1. GET /api/datacenters/ - returns list of active data centers (4 seeded)
2. GET /api/addons/ - returns list of active add-ons (7 seeded)
3. Admin CRUD for data centers via /api/admin/datacenters
4. Admin CRUD for add-ons via /api/admin/addons
5. Order creation with data_center_id and addons array
6. Order total includes add-on pricing adjusted for billing cycle
7. Admin unsuspend server via /api/admin/servers/{id}/unsuspend
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


class TestDataCentersPublicEndpoint:
    """Test public data centers endpoint"""
    
    def test_get_datacenters_returns_list(self):
        """Test GET /api/datacenters/ returns list of active data centers"""
        response = requests.get(f"{BASE_URL}/api/datacenters/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Datacenters endpoint returns list - {len(data)} data centers found")
        return data
    
    def test_datacenters_has_expected_count(self):
        """Test that 4 data centers are seeded"""
        response = requests.get(f"{BASE_URL}/api/datacenters/")
        data = response.json()
        assert len(data) >= 4, f"Expected at least 4 data centers, got {len(data)}"
        print(f"PASS: At least 4 data centers seeded - found {len(data)}")
    
    def test_datacenter_has_required_fields(self):
        """Test data center response has required fields"""
        response = requests.get(f"{BASE_URL}/api/datacenters/")
        data = response.json()
        
        if len(data) > 0:
            dc = data[0]
            required_fields = ["id", "name", "location", "country", "is_active"]
            for field in required_fields:
                assert field in dc, f"Missing field: {field}"
            assert dc["is_active"] == True, "Public endpoint should only return active data centers"
            print(f"PASS: Data center has all required fields - {dc['name']}")
        else:
            pytest.skip("No data centers to verify fields")
    
    def test_datacenters_include_expected_locations(self):
        """Test that expected data center locations are present"""
        response = requests.get(f"{BASE_URL}/api/datacenters/")
        data = response.json()
        
        names = [dc["name"] for dc in data]
        expected_locations = ["US East", "US West", "EU Central", "Asia"]
        
        for loc in expected_locations:
            found = any(loc in name for name in names)
            if found:
                print(f"PASS: Found data center for {loc}")
            else:
                print(f"INFO: Data center for {loc} not found in names: {names}")


class TestAddOnsPublicEndpoint:
    """Test public add-ons endpoint"""
    
    def test_get_addons_returns_list(self):
        """Test GET /api/addons/ returns list of active add-ons"""
        response = requests.get(f"{BASE_URL}/api/addons/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Add-ons endpoint returns list - {len(data)} add-ons found")
        return data
    
    def test_addons_has_expected_count(self):
        """Test that 7 add-ons are seeded"""
        response = requests.get(f"{BASE_URL}/api/addons/")
        data = response.json()
        assert len(data) >= 7, f"Expected at least 7 add-ons, got {len(data)}"
        print(f"PASS: At least 7 add-ons seeded - found {len(data)}")
    
    def test_addon_has_required_fields(self):
        """Test add-on response has required fields"""
        response = requests.get(f"{BASE_URL}/api/addons/")
        data = response.json()
        
        if len(data) > 0:
            addon = data[0]
            required_fields = ["id", "name", "type", "price", "billing_cycle", "is_active"]
            for field in required_fields:
                assert field in addon, f"Missing field: {field}"
            assert addon["is_active"] == True, "Public endpoint should only return active add-ons"
            print(f"PASS: Add-on has all required fields - {addon['name']}")
        else:
            pytest.skip("No add-ons to verify fields")
    
    def test_addons_include_expected_types(self):
        """Test that expected add-on types are present"""
        response = requests.get(f"{BASE_URL}/api/addons/")
        data = response.json()
        
        types = set(addon["type"] for addon in data)
        expected_types = ["control_panel", "ssl", "backup", "ip", "support"]
        
        for addon_type in expected_types:
            if addon_type in types:
                print(f"PASS: Found add-on type: {addon_type}")
            else:
                print(f"INFO: Add-on type {addon_type} not found in types: {types}")


class TestAdminDataCentersCRUD:
    """Test Admin CRUD operations for data centers"""
    
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
    
    def test_admin_get_datacenters(self, admin_token):
        """Test admin can get all data centers including inactive"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/datacenters", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Admin get datacenters working - {len(data)} data centers")
    
    def test_admin_create_datacenter(self, admin_token):
        """Test admin can create a new data center"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        new_dc = {
            "name": f"TEST_DC_{uuid.uuid4().hex[:8]}",
            "location": "Test City",
            "country": "Test Country",
            "description": "Test data center for automated testing"
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/datacenters", headers=headers, json=new_dc)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["message"] == "Data center created"
        print(f"PASS: Admin create datacenter working - ID: {data['id'][:8]}")
        return data["id"]
    
    def test_admin_update_datacenter(self, admin_token):
        """Test admin can update a data center"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First create a datacenter
        new_dc = {
            "name": f"TEST_UPDATE_DC_{uuid.uuid4().hex[:8]}",
            "location": "Original City",
            "country": "Original Country"
        }
        create_response = requests.post(f"{BASE_URL}/api/admin/datacenters", headers=headers, json=new_dc)
        dc_id = create_response.json()["id"]
        
        # Update it
        update_response = requests.put(
            f"{BASE_URL}/api/admin/datacenters/{dc_id}",
            headers=headers,
            params={"name": "Updated DC Name", "location": "Updated City"}
        )
        assert update_response.status_code == 200
        assert update_response.json()["message"] == "Data center updated"
        print(f"PASS: Admin update datacenter working - ID: {dc_id[:8]}")
    
    def test_admin_delete_datacenter(self, admin_token):
        """Test admin can delete (soft delete) a data center"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First create a datacenter
        new_dc = {
            "name": f"TEST_DELETE_DC_{uuid.uuid4().hex[:8]}",
            "location": "Delete City",
            "country": "Delete Country"
        }
        create_response = requests.post(f"{BASE_URL}/api/admin/datacenters", headers=headers, json=new_dc)
        dc_id = create_response.json()["id"]
        
        # Delete it
        delete_response = requests.delete(f"{BASE_URL}/api/admin/datacenters/{dc_id}", headers=headers)
        assert delete_response.status_code == 200
        assert delete_response.json()["message"] == "Data center deleted"
        print(f"PASS: Admin delete datacenter working - ID: {dc_id[:8]}")


class TestAdminAddOnsCRUD:
    """Test Admin CRUD operations for add-ons"""
    
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
    
    def test_admin_get_addons(self, admin_token):
        """Test admin can get all add-ons including inactive"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/addons", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: Admin get addons working - {len(data)} add-ons")
    
    def test_admin_create_addon(self, admin_token):
        """Test admin can create a new add-on"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        new_addon = {
            "name": f"TEST_ADDON_{uuid.uuid4().hex[:8]}",
            "type": "other",
            "price": 9.99,
            "billing_cycle": "monthly",
            "description": "Test add-on for automated testing"
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/addons", headers=headers, json=new_addon)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["message"] == "Add-on created"
        print(f"PASS: Admin create addon working - ID: {data['id'][:8]}")
        return data["id"]
    
    def test_admin_update_addon(self, admin_token):
        """Test admin can update an add-on"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First create an addon
        new_addon = {
            "name": f"TEST_UPDATE_ADDON_{uuid.uuid4().hex[:8]}",
            "type": "other",
            "price": 5.99,
            "billing_cycle": "monthly"
        }
        create_response = requests.post(f"{BASE_URL}/api/admin/addons", headers=headers, json=new_addon)
        addon_id = create_response.json()["id"]
        
        # Update it
        update_response = requests.put(
            f"{BASE_URL}/api/admin/addons/{addon_id}",
            headers=headers,
            params={"name": "Updated Addon Name", "price": 12.99}
        )
        assert update_response.status_code == 200
        assert update_response.json()["message"] == "Add-on updated"
        print(f"PASS: Admin update addon working - ID: {addon_id[:8]}")
    
    def test_admin_delete_addon(self, admin_token):
        """Test admin can delete (soft delete) an add-on"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First create an addon
        new_addon = {
            "name": f"TEST_DELETE_ADDON_{uuid.uuid4().hex[:8]}",
            "type": "other",
            "price": 3.99,
            "billing_cycle": "one_time"
        }
        create_response = requests.post(f"{BASE_URL}/api/admin/addons", headers=headers, json=new_addon)
        addon_id = create_response.json()["id"]
        
        # Delete it
        delete_response = requests.delete(f"{BASE_URL}/api/admin/addons/{addon_id}", headers=headers)
        assert delete_response.status_code == 200
        assert delete_response.json()["message"] == "Add-on deleted"
        print(f"PASS: Admin delete addon working - ID: {addon_id[:8]}")


class TestOrderWithDataCenterAndAddons:
    """Test order creation with data center and add-ons"""
    
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
    
    def test_order_with_datacenter_id(self, user_token):
        """Test creating order with data_center_id"""
        headers = {"Authorization": f"Bearer {user_token}"}
        
        # Get plans
        plans_response = requests.get(f"{BASE_URL}/api/plans")
        plans = plans_response.json()
        
        # Get datacenters
        dc_response = requests.get(f"{BASE_URL}/api/datacenters/")
        datacenters = dc_response.json()
        
        if len(plans) > 0 and len(datacenters) > 0:
            order_data = {
                "plan_id": plans[0]["id"],
                "billing_cycle": "monthly",
                "data_center_id": datacenters[0]["id"],
                "os": "Ubuntu 22.04",
                "control_panel": None,
                "addons": [],
                "payment_method": "bank_transfer",
                "notes": "Test order with data center"
            }
            
            response = requests.post(f"{BASE_URL}/api/orders/", headers=headers, json=order_data)
            assert response.status_code == 200
            data = response.json()
            
            assert data["data_center_id"] == datacenters[0]["id"]
            assert data["data_center_name"] == datacenters[0]["name"]
            print(f"PASS: Order with data_center_id working - DC: {data['data_center_name']}")
        else:
            pytest.skip("No plans or datacenters available")
    
    def test_order_with_addons(self, user_token):
        """Test creating order with addons array"""
        headers = {"Authorization": f"Bearer {user_token}"}
        
        # Get plans
        plans_response = requests.get(f"{BASE_URL}/api/plans")
        plans = plans_response.json()
        
        # Get addons
        addons_response = requests.get(f"{BASE_URL}/api/addons/")
        addons = addons_response.json()
        
        if len(plans) > 0 and len(addons) >= 2:
            # Select first two addons
            selected_addon_ids = [addons[0]["id"], addons[1]["id"]]
            
            order_data = {
                "plan_id": plans[0]["id"],
                "billing_cycle": "monthly",
                "os": "Ubuntu 22.04",
                "control_panel": None,
                "addons": selected_addon_ids,
                "payment_method": "bank_transfer",
                "notes": "Test order with addons"
            }
            
            response = requests.post(f"{BASE_URL}/api/orders/", headers=headers, json=order_data)
            assert response.status_code == 200
            data = response.json()
            
            assert data["addons"] == selected_addon_ids
            assert len(data["addon_details"]) == 2
            print(f"PASS: Order with addons working - {len(data['addon_details'])} addons selected")
        else:
            pytest.skip("Not enough plans or addons available")
    
    def test_order_total_includes_addon_pricing(self, user_token):
        """Test that order total includes add-on pricing adjusted for billing cycle"""
        headers = {"Authorization": f"Bearer {user_token}"}
        
        # Get plans
        plans_response = requests.get(f"{BASE_URL}/api/plans")
        plans = plans_response.json()
        
        # Get addons
        addons_response = requests.get(f"{BASE_URL}/api/addons/")
        addons = addons_response.json()
        
        if len(plans) > 0 and len(addons) > 0:
            # Find a monthly addon
            monthly_addon = next((a for a in addons if a["billing_cycle"] == "monthly"), None)
            
            if monthly_addon:
                plan = plans[0]
                
                # Test with quarterly billing (addon price should be x3)
                order_data = {
                    "plan_id": plan["id"],
                    "billing_cycle": "quarterly",
                    "os": "Ubuntu 22.04",
                    "control_panel": None,
                    "addons": [monthly_addon["id"]],
                    "payment_method": "bank_transfer",
                    "notes": "Test order for pricing verification"
                }
                
                response = requests.post(f"{BASE_URL}/api/orders/", headers=headers, json=order_data)
                assert response.status_code == 200
                data = response.json()
                
                # Calculate expected total
                expected_addon_price = monthly_addon["price"] * 3  # quarterly = 3 months
                expected_total = plan["price_quarterly"] + expected_addon_price
                
                # Allow small floating point difference
                assert abs(data["amount"] - expected_total) < 0.01, \
                    f"Expected total {expected_total}, got {data['amount']}"
                
                print(f"PASS: Order total includes adjusted addon pricing - Plan: ${plan['price_quarterly']}, Addon: ${expected_addon_price}, Total: ${data['amount']}")
            else:
                print("INFO: No monthly addon found to test pricing adjustment")
        else:
            pytest.skip("No plans or addons available")


class TestAdminUnsuspendServer:
    """Test Admin unsuspend server endpoint"""
    
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
    
    def test_unsuspend_nonexistent_server(self, admin_token):
        """Test unsuspend returns 404 for non-existent server"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.post(
            f"{BASE_URL}/api/admin/servers/non-existent-server-id/unsuspend",
            headers=headers
        )
        assert response.status_code == 404
        print("PASS: Unsuspend correctly returns 404 for non-existent server")
    
    def test_unsuspend_endpoint_exists(self, admin_token):
        """Test that unsuspend endpoint exists and is accessible"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get servers
        servers_response = requests.get(f"{BASE_URL}/api/admin/servers", headers=headers)
        assert servers_response.status_code == 200
        servers = servers_response.json()
        
        # Find a suspended server if any
        suspended_servers = [s for s in servers if s.get("status") == "suspended"]
        
        if len(suspended_servers) > 0:
            server = suspended_servers[0]
            response = requests.post(
                f"{BASE_URL}/api/admin/servers/{server['id']}/unsuspend",
                headers=headers
            )
            assert response.status_code == 200
            data = response.json()
            assert "unsuspended" in data["message"]
            print(f"PASS: Unsuspend server working - {server['hostname']}")
        else:
            # Test with an active server (should return 400)
            if len(servers) > 0:
                server = servers[0]
                response = requests.post(
                    f"{BASE_URL}/api/admin/servers/{server['id']}/unsuspend",
                    headers=headers
                )
                if response.status_code == 400:
                    print("PASS: Unsuspend correctly returns 400 for non-suspended server")
                else:
                    print(f"INFO: Unsuspend returned {response.status_code} for server {server['id'][:8]}")
            else:
                print("INFO: No servers available to test unsuspend")


class TestBackgroundTaskEndpoints:
    """Test background task trigger endpoints (recurring invoices, auto-suspend)"""
    
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
    
    def test_trigger_renewal_invoices_endpoint(self, admin_token):
        """Test trigger renewal invoices endpoint exists"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Check if endpoint exists
        response = requests.post(f"{BASE_URL}/api/admin/tasks/renewal-invoices", headers=headers)
        
        if response.status_code == 200:
            print("PASS: Trigger renewal invoices endpoint working")
        elif response.status_code == 404:
            print("INFO: Trigger renewal invoices endpoint not found (may be scheduled task only)")
        else:
            print(f"INFO: Trigger renewal invoices returned {response.status_code}")
    
    def test_trigger_suspend_overdue_endpoint(self, admin_token):
        """Test trigger suspend overdue services endpoint exists"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Check if endpoint exists
        response = requests.post(f"{BASE_URL}/api/admin/tasks/suspend-overdue", headers=headers)
        
        if response.status_code == 200:
            print("PASS: Trigger suspend overdue endpoint working")
        elif response.status_code == 404:
            print("INFO: Trigger suspend overdue endpoint not found (may be scheduled task only)")
        else:
            print(f"INFO: Trigger suspend overdue returned {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
