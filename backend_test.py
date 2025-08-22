import requests
import sys
import json
from datetime import datetime

class ZhilBalanceAPITester:
    def __init__(self, base_url="https://zhil-sales-panel.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)

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

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )
        return success

    def test_generate_test_data(self):
        """Test generating test data"""
        success, response = self.run_test(
            "Generate Test Data",
            "POST",
            "generate-test-data",
            200
        )
        return success

    def test_statistics_date_range(self):
        """Test statistics with date range (NEW FORMAT)"""
        # Test with specific date range
        start_date = "2025-08-16T00:00:00Z"
        end_date = "2025-08-22T23:59:59Z"
        
        success, response = self.run_test(
            "Statistics - Date Range",
            "GET",
            "statistics",
            200,
            params={"start_date": start_date, "end_date": end_date}
        )
        
        if success and response:
            # Validate NEW response structure (without 'blocked')
            required_fields = [
                'total_deals', 'consultation_scheduled', 'no_response',
                'average_interactions_per_client', 'average_dialog_cost', 
                'average_conversion_cost', 'period_start', 'period_end'
            ]
            
            # Check that 'blocked' field is NOT present
            if 'blocked' in response:
                print(f"   ❌ ERROR: 'blocked' field should be removed but is still present!")
                return False, response
            else:
                print(f"   ✅ CONFIRMED: 'blocked' field successfully removed")
            
            missing_fields = [field for field in required_fields if field not in response]
            if missing_fields:
                print(f"   ⚠️  Missing fields: {missing_fields}")
            else:
                print(f"   📊 Stats: {response['total_deals']} deals, {response['consultation_scheduled']} consultations, {response['no_response']} no response")
                print(f"   💰 Avg dialog cost: {response['average_dialog_cost']} BYN")
                print(f"   📅 Period: {response['period_start']} to {response['period_end']}")
        
        return success, response

    def test_statistics_default(self):
        """Test statistics without date parameters (should default to last 7 days)"""
        success, response = self.run_test(
            "Statistics - Default Period",
            "GET",
            "statistics",
            200
        )
        
        if success and response:
            print(f"   📊 Default stats: {response['total_deals']} deals, {response['consultation_scheduled']} consultations")
            # Verify no 'blocked' field
            if 'blocked' in response:
                print(f"   ❌ ERROR: 'blocked' field found in default response!")
            else:
                print(f"   ✅ CONFIRMED: No 'blocked' field in default response")
        
        return success, response

    def test_statistics_invalid_date(self):
        """Test statistics with invalid date format"""
        success, response = self.run_test(
            "Statistics - Invalid Date Format",
            "GET",
            "statistics",
            400,  # Should return 400 for invalid date
            params={"start_date": "invalid-date", "end_date": "2025-08-22T23:59:59Z"}
        )
        
        return success

    def test_chats_list(self):
        """Test getting chats list"""
        success, response = self.run_test(
            "Chats List",
            "GET",
            "chats",
            200
        )
        
        if success and response:
            chats = response.get('chats', [])
            total = response.get('total', 0)
            print(f"   💬 Found {len(chats)} chats out of {total} total")
            
            if chats:
                first_chat = chats[0]
                required_chat_fields = ['id', 'client_name', 'client_phone', 'status', 'started_at', 'last_message_at']
                missing_fields = [field for field in required_chat_fields if field not in first_chat]
                if missing_fields:
                    print(f"   ⚠️  Missing chat fields: {missing_fields}")
                else:
                    print(f"   👤 First chat: {first_chat['client_name']} ({first_chat['status']})")
                
                return success, response, chats[0]['id'] if chats else None
        
        return success, response, None

    def test_chats_search(self):
        """Test searching chats"""
        success, response = self.run_test(
            "Chats Search",
            "GET",
            "chats",
            200,
            params={"search": "Клиент"}
        )
        
        if success and response:
            chats = response.get('chats', [])
            print(f"   🔍 Search results: {len(chats)} chats found")
        
        return success

    def test_chat_details(self, chat_id):
        """Test getting specific chat details"""
        if not chat_id:
            print("❌ No chat ID available for testing chat details")
            return False
            
        success, response = self.run_test(
            "Chat Details",
            "GET",
            f"chats/{chat_id}",
            200
        )
        
        if success and response:
            messages = response.get('messages', [])
            print(f"   💬 Chat details: {len(messages)} messages")
            if messages:
                print(f"   📝 First message: {messages[0].get('sender', 'unknown')} - {messages[0].get('message', '')[:50]}...")
        
        return success

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