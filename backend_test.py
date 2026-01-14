#!/usr/bin/env python3
"""
CloudNest Backend API Testing Suite
Tests all major API endpoints for the server renting platform
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class CloudNestAPITester:
    def __init__(self, base_url: str = "https://cloudserver-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.user_id = None
        self.admin_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.session = requests.Session()
        
    def log(self, message: str, level: str = "INFO"):
        """Log test messages"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Optional[Dict] = None, headers: Optional[Dict] = None, 
                 use_admin: bool = False) -> tuple[bool, Dict]:
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        # Add auth token if available
        token = self.admin_token if use_admin else self.token
        if token:
            test_headers['Authorization'] = f'Bearer {token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        self.log(f"Testing {name}...")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=test_headers)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}")
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}", "ERROR")
                self.failed_tests.append({
                    'test': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:200] if response.text else 'No response'
                })

            try:
                return success, response.json() if response.text else {}
            except json.JSONDecodeError:
                return success, {'raw_response': response.text}

        except Exception as e:
            self.log(f"❌ {name} - Error: {str(e)}", "ERROR")
            self.failed_tests.append({
                'test': name,
                'error': str(e)
            })
            return False, {}

    def test_health_check(self):
        """Test basic health endpoints"""
        self.log("=== Testing Health Endpoints ===")
        self.run_test("API Root", "GET", "", 200)
        self.run_test("Health Check", "GET", "health", 200)

    def test_plans_endpoints(self):
        """Test plans endpoints"""
        self.log("=== Testing Plans Endpoints ===")
        success, plans = self.run_test("Get All Plans", "GET", "plans", 200)
        if success and plans:
            self.log(f"Found {len(plans)} plans")
            if plans:
                plan_id = plans[0]['id']
                self.run_test("Get Single Plan", "GET", f"plans/{plan_id}", 200)
        
        # Test filtering by type
        self.run_test("Get VPS Plans", "GET", "plans?type=vps", 200)
        self.run_test("Get Shared Plans", "GET", "plans?type=shared", 200)
        self.run_test("Get Dedicated Plans", "GET", "plans?type=dedicated", 200)

    def test_user_registration(self):
        """Test user registration"""
        self.log("=== Testing User Registration ===")
        test_user_data = {
            "email": f"testuser_{datetime.now().strftime('%H%M%S')}@example.com",
            "password": "TestPass123!",
            "full_name": "Test User",
            "company": "Test Company"
        }
        
        success, response = self.run_test("User Registration", "POST", "auth/register", 200, test_user_data)
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            self.log(f"✅ User registered successfully: {response['user']['email']}")
            return True
        return False

    def test_admin_login(self):
        """Test admin login"""
        self.log("=== Testing Admin Login ===")
        admin_credentials = {
            "email": "admin@cloudnest.com",
            "password": "Admin@123"
        }
        
        success, response = self.run_test("Admin Login", "POST", "auth/login", 200, admin_credentials)
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            self.admin_id = response['user']['id']
            self.log(f"✅ Admin logged in successfully: {response['user']['role']}")
            return True
        return False

    def test_user_auth_endpoints(self):
        """Test user authentication endpoints"""
        if not self.token:
            self.log("❌ Skipping user auth tests - no token available", "WARNING")
            return
            
        self.log("=== Testing User Auth Endpoints ===")
        self.run_test("Get Current User", "GET", "auth/me", 200)
        
        # Test 2FA setup (will fail without TOTP but should return proper error)
        self.run_test("Setup 2FA", "POST", "auth/setup-2fa", 200)

    def test_user_orders(self):
        """Test user order endpoints"""
        if not self.token:
            self.log("❌ Skipping order tests - no token available", "WARNING")
            return
            
        self.log("=== Testing User Order Endpoints ===")
        
        # Get plans first to create an order
        success, plans = self.run_test("Get Plans for Order", "GET", "plans", 200)
        if success and plans:
            plan_id = plans[0]['id']
            order_data = {
                "plan_id": plan_id,
                "billing_cycle": "monthly",
                "os": "Ubuntu 22.04",
                "control_panel": "cPanel",
                "addons": [],
                "payment_method": "bank_transfer",
                "notes": "Test order"
            }
            
            success, order = self.run_test("Create Order", "POST", "orders", 200, order_data)
            if success and 'id' in order:
                order_id = order['id']
                self.run_test("Get Single Order", "GET", f"orders/{order_id}", 200)
        
        self.run_test("Get User Orders", "GET", "orders", 200)

    def test_user_services(self):
        """Test user service endpoints"""
        if not self.token:
            self.log("❌ Skipping service tests - no token available", "WARNING")
            return
            
        self.log("=== Testing User Service Endpoints ===")
        self.run_test("Get User Servers", "GET", "servers", 200)
        self.run_test("Get User Invoices", "GET", "invoices", 200)
        self.run_test("Get User Tickets", "GET", "tickets", 200)

    def test_user_wallet(self):
        """Test user wallet endpoints"""
        if not self.token:
            self.log("❌ Skipping wallet tests - no token available", "WARNING")
            return
            
        self.log("=== Testing User Wallet Endpoints ===")
        self.run_test("Get Wallet Transactions", "GET", "user/wallet/transactions", 200)
        
        topup_data = {
            "amount": 50.0,
            "payment_method": "bank_transfer"
        }
        self.run_test("Request Wallet Topup", "POST", "user/wallet/topup", 200, topup_data)

    def test_tickets(self):
        """Test ticket system"""
        if not self.token:
            self.log("❌ Skipping ticket tests - no token available", "WARNING")
            return
            
        self.log("=== Testing Ticket System ===")
        
        ticket_data = {
            "subject": "Test Support Ticket",
            "message": "This is a test ticket message",
            "priority": "medium"
        }
        
        success, ticket = self.run_test("Create Ticket", "POST", "tickets", 200, ticket_data)
        if success and 'id' in ticket:
            ticket_id = ticket['id']
            self.run_test("Get Single Ticket", "GET", f"tickets/{ticket_id}", 200)
            
            # Add message to ticket
            message_data = {"message": "Additional message"}
            self.run_test("Add Ticket Message", "POST", f"tickets/{ticket_id}/messages", 200, message_data)

    def test_admin_dashboard(self):
        """Test admin dashboard"""
        if not self.admin_token:
            self.log("❌ Skipping admin tests - no admin token available", "WARNING")
            return
            
        self.log("=== Testing Admin Dashboard ===")
        self.run_test("Admin Dashboard Stats", "GET", "admin/dashboard", 200, use_admin=True)

    def test_admin_management(self):
        """Test admin management endpoints"""
        if not self.admin_token:
            self.log("❌ Skipping admin management tests - no admin token available", "WARNING")
            return
            
        self.log("=== Testing Admin Management ===")
        self.run_test("Admin Get Orders", "GET", "admin/orders", 200, use_admin=True)
        self.run_test("Admin Get Servers", "GET", "admin/servers", 200, use_admin=True)
        self.run_test("Admin Get Users", "GET", "admin/users", 200, use_admin=True)
        self.run_test("Admin Get Invoices", "GET", "admin/invoices", 200, use_admin=True)
        self.run_test("Admin Get Tickets", "GET", "admin/tickets", 200, use_admin=True)
        self.run_test("Admin Get Plans", "GET", "admin/plans", 200, use_admin=True)

    def test_contact_form(self):
        """Test contact form"""
        self.log("=== Testing Contact Form ===")
        contact_data = {
            "name": "Test Contact",
            "email": "test@example.com",
            "subject": "Test Subject",
            "message": "This is a test contact message"
        }
        self.run_test("Contact Form Submission", "POST", "contact", 200, contact_data)

    def run_all_tests(self):
        """Run all tests in sequence"""
        self.log("🚀 Starting CloudNest API Tests")
        self.log(f"Testing against: {self.base_url}")
        
        # Basic health checks
        self.test_health_check()
        
        # Public endpoints
        self.test_plans_endpoints()
        self.test_contact_form()
        
        # User registration and auth
        if self.test_user_registration():
            self.test_user_auth_endpoints()
            self.test_user_orders()
            self.test_user_services()
            self.test_user_wallet()
            self.test_tickets()
        
        # Admin tests
        if self.test_admin_login():
            self.test_admin_dashboard()
            self.test_admin_management()
        
        # Print results
        self.print_results()

    def print_results(self):
        """Print test results summary"""
        self.log("=" * 50)
        self.log("🏁 TEST RESULTS SUMMARY")
        self.log("=" * 50)
        self.log(f"Tests Run: {self.tests_run}")
        self.log(f"Tests Passed: {self.tests_passed}")
        self.log(f"Tests Failed: {len(self.failed_tests)}")
        self.log(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        if self.failed_tests:
            self.log("\n❌ FAILED TESTS:")
            for failure in self.failed_tests:
                self.log(f"  - {failure.get('test', 'Unknown')}: {failure}")
        
        return len(self.failed_tests) == 0

def main():
    """Main test runner"""
    tester = CloudNestAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())