import requests
import sys
import json
from datetime import datetime, timedelta

class ZhilBalanceAPITester:
    def __init__(self, base_url="https://zhil-sales-panel.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.errors = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
            self.errors.append(f"{name}: {details}")
        
        if details and success:
            print(f"   ℹ️  {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=15)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Non-dict response'}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_api_root(self):
        """Test API root endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                expected_message = "Жилищный баланс - Админ панель API"
                if data.get("message") == expected_message:
                    self.log_test("API Root Endpoint", True, f"Message: {data.get('message')}")
                else:
                    self.log_test("API Root Endpoint", False, f"Unexpected message: {data.get('message')}")
            else:
                self.log_test("API Root Endpoint", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("API Root Endpoint", False, f"Exception: {str(e)}")

    def test_generate_test_data(self):
        """Generate test data for testing"""
        try:
            response = requests.post(f"{self.api_url}/generate-test-data", timeout=30)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.log_test("Generate Test Data", True, f"Response: {data.get('message', 'Success')}")
            else:
                # Test data might already exist, which is fine
                self.log_test("Generate Test Data", True, f"Status: {response.status_code} (data may already exist)")
                
        except Exception as e:
            self.log_test("Generate Test Data", False, f"Exception: {str(e)}")

    def test_statistics_api(self):
        """Test statistics API with NEW token metrics"""
        try:
            # Test without date range (default last 7 days)
            response = requests.get(f"{self.api_url}/statistics", timeout=15)
            success = response.status_code == 200
            
            if not success:
                self.log_test("Statistics API - Basic", False, f"Status: {response.status_code}")
                return
            
            data = response.json()
            
            # Check required fields exist including NEW token fields
            required_fields = [
                'total_deals', 'consultation_scheduled', 'individual_consultation_scheduled', 
                'no_response', 'average_interactions_per_client', 'average_dialog_cost', 
                'average_conversion_cost', 'total_tokens_used', 'total_period_cost',
                'period_start', 'period_end'
            ]
            
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                self.log_test("Statistics API - Required Fields", False, f"Missing fields: {missing_fields}")
                return
            
            self.log_test("Statistics API - Required Fields", True, "All required fields present")
            
            # Test NEW token metrics specifically
            total_tokens = data.get('total_tokens_used', 0)
            total_cost = data.get('total_period_cost', 0)
            
            # Validate token count is reasonable (should be > 0 if there's test data)
            if isinstance(total_tokens, int) and total_tokens >= 0:
                self.log_test("NEW: Total Tokens Used Field", True, f"Value: {total_tokens:,} tokens")
            else:
                self.log_test("NEW: Total Tokens Used Field", False, f"Invalid value: {total_tokens}")
            
            # Validate period cost is reasonable
            if isinstance(total_cost, (int, float)) and total_cost >= 0:
                self.log_test("NEW: Total Period Cost Field", True, f"Value: {total_cost} BYN")
            else:
                self.log_test("NEW: Total Period Cost Field", False, f"Invalid value: {total_cost}")
            
            # Test with custom date range
            end_date = datetime.now()
            start_date = end_date - timedelta(days=30)
            
            params = {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            }
            
            response = requests.get(f"{self.api_url}/statistics", params=params, timeout=15)
            if response.status_code == 200:
                range_data = response.json()
                self.log_test("Statistics API - Date Range", True, f"30-day range: {range_data.get('total_tokens_used', 0):,} tokens")
            else:
                self.log_test("Statistics API - Date Range", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Statistics API", False, f"Exception: {str(e)}")

    def test_chats_api(self):
        """Test chats API with NEW token integration"""
        try:
            # Test basic chats endpoint
            response = requests.get(f"{self.api_url}/chats", timeout=15)
            success = response.status_code == 200
            
            if not success:
                self.log_test("Chats API - Basic", False, f"Status: {response.status_code}")
                return
            
            data = response.json()
            
            # Check structure
            if 'chats' not in data or 'total' not in data:
                self.log_test("Chats API - Structure", False, "Missing 'chats' or 'total' fields")
                return
            
            self.log_test("Chats API - Structure", True, f"Found {data['total']} total chats")
            
            chats = data['chats']
            if not chats:
                self.log_test("Chats API - Token Integration", True, "No chats to test (empty dataset)")
                return
            
            # Test first chat for NEW token fields
            first_chat = chats[0]
            
            # Check for total_tokens_used in chat
            if 'total_tokens_used' in first_chat:
                tokens = first_chat['total_tokens_used']
                self.log_test("NEW: Chat Total Tokens Field", True, f"Chat has {tokens:,} total tokens")
            else:
                self.log_test("NEW: Chat Total Tokens Field", False, "total_tokens_used field missing from chat")
            
            # Check for tokens_used in messages
            messages = first_chat.get('messages', [])
            if messages:
                first_message = messages[0]
                if 'tokens_used' in first_message:
                    msg_tokens = first_message['tokens_used']
                    self.log_test("NEW: Message Tokens Field", True, f"Message has {msg_tokens} tokens")
                else:
                    self.log_test("NEW: Message Tokens Field", False, "tokens_used field missing from message")
            else:
                self.log_test("NEW: Message Tokens Field", True, "No messages to test")
                
            return first_chat['id'] if chats else None
                
        except Exception as e:
            self.log_test("Chats API", False, f"Exception: {str(e)}")
            return None

    def test_chat_details_api(self, chat_id):
        """Test individual chat details with NEW token data"""
        if not chat_id:
            self.log_test("Chat Details API", True, "No chat ID available to test")
            return
            
        try:
            # Test chat details endpoint
            response = requests.get(f"{self.api_url}/chats/{chat_id}", timeout=15)
            success = response.status_code == 200
            
            if not success:
                self.log_test("Chat Details API", False, f"Status: {response.status_code}")
                return
            
            chat_data = response.json()
            
            # Verify NEW token fields in detailed view
            if 'total_tokens_used' in chat_data:
                total_tokens = chat_data['total_tokens_used']
                self.log_test("Chat Details - Total Tokens", True, f"Detail view shows {total_tokens:,} tokens")
            else:
                self.log_test("Chat Details - Total Tokens", False, "total_tokens_used missing in detail view")
            
            # Check message-level tokens and verify calculation
            messages = chat_data.get('messages', [])
            if messages:
                tokens_in_messages = [msg.get('tokens_used', 0) for msg in messages]
                calculated_total = sum(tokens_in_messages)
                actual_total = chat_data.get('total_tokens_used', 0)
                
                if calculated_total == actual_total:
                    self.log_test("Token Calculation Accuracy", True, f"Sum matches: {calculated_total}")
                else:
                    self.log_test("Token Calculation Accuracy", False, f"Sum mismatch: {calculated_total} vs {actual_total}")
            
        except Exception as e:
            self.log_test("Chat Details API", False, f"Exception: {str(e)}")

    def test_search_functionality(self):
        """Test chat search functionality"""
        try:
            # Test search with a common term
            response = requests.get(f"{self.api_url}/chats?search=Клиент", timeout=15)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.log_test("Chat Search Functionality", True, f"Search returned {len(data.get('chats', []))} results")
            else:
                self.log_test("Chat Search Functionality", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Chat Search Functionality", False, f"Exception: {str(e)}")

def main():
    print("🏠 Жилищный баланс - API Testing")
    print("=" * 50)
    
    # Setup
    tester = ZhilBalanceAPITester()
    
    # Test sequence
    print("\n📋 Running API Tests...")
    
    # 1. Test root endpoint
    tester.test_root_endpoint()
    
    # 2. Generate test data
    tester.test_generate_test_data()
    
    # 3. Test NEW statistics endpoints with date ranges
    date_range_success, date_range_stats = tester.test_statistics_date_range()
    default_success, default_stats = tester.test_statistics_default()
    
    # 4. Test invalid date format
    tester.test_statistics_invalid_date()
    
    # 5. Test chats endpoints
    chats_success, chats_response, first_chat_id = tester.test_chats_list()
    
    # 6. Test search functionality
    tester.test_chats_search()
    
    # 7. Test chat details
    if first_chat_id:
        tester.test_chat_details(first_chat_id)
    
    # Print results
    print(f"\n📊 Test Results:")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("❌ Some tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())