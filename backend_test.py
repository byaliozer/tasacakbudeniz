#!/usr/bin/env python3
"""
Backend API Testing for Quiz App
Tests the Quiz API to verify correct_option functionality and answer validation
"""

import requests
import json
import sys
from typing import Dict, List, Any

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading frontend .env: {e}")
    return "http://localhost:8001"

BACKEND_URL = get_backend_url()
API_BASE = f"{BACKEND_URL}/api"

class QuizAPITester:
    def __init__(self):
        self.test_results = []
        self.failed_tests = []
        
    def log_test(self, test_name: str, passed: bool, message: str = ""):
        """Log test result"""
        status = "✅ PASS" if passed else "❌ FAIL"
        result = f"{status}: {test_name}"
        if message:
            result += f" - {message}"
        
        print(result)
        self.test_results.append({
            'test': test_name,
            'passed': passed,
            'message': message
        })
        
        if not passed:
            self.failed_tests.append(test_name)
    
    def test_api_connection(self):
        """Test basic API connectivity"""
        try:
            response = requests.get(f"{API_BASE}/", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_test("API Connection", True, f"API is running: {data.get('message', 'OK')}")
                return True
            else:
                self.log_test("API Connection", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("API Connection", False, f"Connection error: {str(e)}")
            return False
    
    def test_episodes_endpoint(self):
        """Test episodes endpoint to find available episodes"""
        try:
            response = requests.get(f"{API_BASE}/episodes", timeout=10)
            if response.status_code == 200:
                episodes = response.json()
                available_episodes = [ep for ep in episodes if not ep.get('is_locked', True)]
                
                if available_episodes:
                    self.log_test("Episodes Endpoint", True, f"Found {len(available_episodes)} available episodes")
                    return available_episodes
                else:
                    self.log_test("Episodes Endpoint", False, "No available (unlocked) episodes found")
                    return []
            else:
                self.log_test("Episodes Endpoint", False, f"Status code: {response.status_code}")
                return []
        except Exception as e:
            self.log_test("Episodes Endpoint", False, f"Error: {str(e)}")
            return []
    
    def test_quiz_correct_option_format(self, episode_id: int, count: int = 3):
        """Test that correct_option is properly formatted (A, B, C, or D)"""
        try:
            response = requests.get(f"{API_BASE}/quiz/{episode_id}?count={count}", timeout=15)
            
            if response.status_code != 200:
                self.log_test(f"Quiz API Response (Episode {episode_id})", False, 
                            f"Status code: {response.status_code}, Response: {response.text}")
                return None
            
            quiz_data = response.json()
            questions = quiz_data.get('questions', [])
            
            if not questions:
                self.log_test(f"Quiz Questions (Episode {episode_id})", False, "No questions returned")
                return None
            
            self.log_test(f"Quiz API Response (Episode {episode_id})", True, 
                        f"Got {len(questions)} questions")
            
            # Test each question's correct_option format
            all_valid = True
            invalid_options = []
            
            for i, question in enumerate(questions):
                correct_option = question.get('correct_option')
                
                # Check if correct_option is A, B, C, or D
                if correct_option not in ['A', 'B', 'C', 'D']:
                    all_valid = False
                    invalid_options.append(f"Q{i+1}: '{correct_option}'")
            
            if all_valid:
                self.log_test(f"Correct Option Format (Episode {episode_id})", True, 
                            "All correct_options are valid (A, B, C, or D)")
            else:
                self.log_test(f"Correct Option Format (Episode {episode_id})", False, 
                            f"Invalid correct_options found: {', '.join(invalid_options)}")
            
            return quiz_data
            
        except Exception as e:
            self.log_test(f"Quiz Correct Option Format (Episode {episode_id})", False, f"Error: {str(e)}")
            return None
    
    def test_options_array_structure(self, quiz_data: Dict, episode_id: int):
        """Test that options array has 4 items with ids A, B, C, D"""
        if not quiz_data:
            return
        
        questions = quiz_data.get('questions', [])
        all_valid = True
        invalid_structures = []
        
        for i, question in enumerate(questions):
            options = question.get('options', [])
            
            # Check if we have exactly 4 options
            if len(options) != 4:
                all_valid = False
                invalid_structures.append(f"Q{i+1}: {len(options)} options instead of 4")
                continue
            
            # Check if option ids are A, B, C, D
            option_ids = [opt.get('id') for opt in options]
            expected_ids = ['A', 'B', 'C', 'D']
            
            if set(option_ids) != set(expected_ids):
                all_valid = False
                invalid_structures.append(f"Q{i+1}: ids {option_ids} instead of {expected_ids}")
        
        if all_valid:
            self.log_test(f"Options Array Structure (Episode {episode_id})", True, 
                        "All questions have 4 options with ids A, B, C, D")
        else:
            self.log_test(f"Options Array Structure (Episode {episode_id})", False, 
                        f"Invalid structures: {', '.join(invalid_structures)}")
    
    def test_correct_option_matches_options(self, quiz_data: Dict, episode_id: int):
        """Test that correct_option matches an option id in the options array"""
        if not quiz_data:
            return
        
        questions = quiz_data.get('questions', [])
        all_valid = True
        mismatches = []
        
        for i, question in enumerate(questions):
            correct_option = question.get('correct_option')
            options = question.get('options', [])
            option_ids = [opt.get('id') for opt in options]
            
            if correct_option not in option_ids:
                all_valid = False
                mismatches.append(f"Q{i+1}: correct_option '{correct_option}' not in option ids {option_ids}")
        
        if all_valid:
            self.log_test(f"Correct Option Matches Options (Episode {episode_id})", True, 
                        "All correct_options match option ids in their respective options arrays")
        else:
            self.log_test(f"Correct Option Matches Options (Episode {episode_id})", False, 
                        f"Mismatches found: {', '.join(mismatches)}")
    
    def test_answer_validation_logic(self, quiz_data: Dict, episode_id: int):
        """Test the answer validation logic by checking if correct option has valid text"""
        if not quiz_data:
            return
        
        questions = quiz_data.get('questions', [])
        all_valid = True
        invalid_answers = []
        
        for i, question in enumerate(questions):
            correct_option = question.get('correct_option')
            options = question.get('options', [])
            
            # Find the correct option text
            correct_text = None
            for opt in options:
                if opt.get('id') == correct_option:
                    correct_text = opt.get('text', '').strip()
                    break
            
            # Check if correct answer text is not empty
            if not correct_text:
                all_valid = False
                invalid_answers.append(f"Q{i+1}: correct option '{correct_option}' has empty text")
            elif len(correct_text) < 2:
                all_valid = False
                invalid_answers.append(f"Q{i+1}: correct option text too short: '{correct_text}'")
        
        if all_valid:
            self.log_test(f"Answer Validation Logic (Episode {episode_id})", True, 
                        "All correct options have valid answer text")
        else:
            self.log_test(f"Answer Validation Logic (Episode {episode_id})", False, 
                        f"Invalid answers: {', '.join(invalid_answers)}")
    
    def test_quiz_data_completeness(self, quiz_data: Dict, episode_id: int):
        """Test that quiz response has all required fields"""
        if not quiz_data:
            return
        
        required_fields = ['episode_id', 'episode_name', 'questions', 'total_questions', 'max_possible_score']
        missing_fields = []
        
        for field in required_fields:
            if field not in quiz_data:
                missing_fields.append(field)
        
        if not missing_fields:
            self.log_test(f"Quiz Data Completeness (Episode {episode_id})", True, 
                        "All required fields present in quiz response")
        else:
            self.log_test(f"Quiz Data Completeness (Episode {episode_id})", False, 
                        f"Missing fields: {', '.join(missing_fields)}")
        
        # Test question completeness
        questions = quiz_data.get('questions', [])
        question_required_fields = ['id', 'text', 'options', 'correct_option', 'difficulty', 'points']
        
        for i, question in enumerate(questions):
            missing_q_fields = []
            for field in question_required_fields:
                if field not in question:
                    missing_q_fields.append(field)
            
            if missing_q_fields:
                self.log_test(f"Question {i+1} Completeness (Episode {episode_id})", False, 
                            f"Missing fields: {', '.join(missing_q_fields)}")
            else:
                self.log_test(f"Question {i+1} Completeness (Episode {episode_id})", True, 
                            "All required fields present")
    
    def run_comprehensive_quiz_tests(self):
        """Run all quiz-related tests"""
        print(f"\n🧪 Starting Quiz API Tests")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        # Test API connection
        if not self.test_api_connection():
            print("\n❌ Cannot connect to API. Stopping tests.")
            return
        
        # Get available episodes
        episodes = self.test_episodes_endpoint()
        if not episodes:
            print("\n❌ No available episodes found. Cannot test quiz functionality.")
            return
        
        # Test with the first available episode
        test_episode = episodes[0]
        episode_id = test_episode['id']
        
        print(f"\n🎯 Testing with Episode {episode_id}: {test_episode.get('name', 'Unknown')}")
        print("-" * 40)
        
        # Test quiz with count=3 as requested
        quiz_data = self.test_quiz_correct_option_format(episode_id, count=3)
        
        if quiz_data:
            # Run all validation tests
            self.test_options_array_structure(quiz_data, episode_id)
            self.test_correct_option_matches_options(quiz_data, episode_id)
            self.test_answer_validation_logic(quiz_data, episode_id)
            self.test_quiz_data_completeness(quiz_data, episode_id)
            
            # Test with different count to ensure consistency
            print(f"\n🔄 Testing with different question count...")
            quiz_data_5 = self.test_quiz_correct_option_format(episode_id, count=5)
            if quiz_data_5:
                self.test_correct_option_matches_options(quiz_data_5, episode_id)
        
        # Test with another episode if available
        if len(episodes) > 1:
            test_episode_2 = episodes[1]
            episode_id_2 = test_episode_2['id']
            print(f"\n🎯 Testing with Episode {episode_id_2}: {test_episode_2.get('name', 'Unknown')}")
            print("-" * 40)
            
            quiz_data_2 = self.test_quiz_correct_option_format(episode_id_2, count=2)
            if quiz_data_2:
                self.test_correct_option_matches_options(quiz_data_2, episode_id_2)
    
    def print_summary(self):
        """Print test summary"""
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t['passed']])
        failed_tests = total_tests - passed_tests
        
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        
        if self.failed_tests:
            print(f"\n🚨 FAILED TESTS:")
            for test in self.failed_tests:
                print(f"   - {test}")
        
        if failed_tests == 0:
            print(f"\n🎉 All tests passed! Quiz API correct_option functionality is working properly.")
        else:
            print(f"\n⚠️  {failed_tests} test(s) failed. Please review the issues above.")
        
        return failed_tests == 0

def main():
    """Main test execution"""
    tester = QuizAPITester()
    
    try:
        tester.run_comprehensive_quiz_tests()
        success = tester.print_summary()
        
        # Exit with appropriate code
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\n\n⏹️  Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n💥 Unexpected error during testing: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()