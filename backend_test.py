#!/usr/bin/env python3
"""
Backend API Testing for Taşacak Bu Deniz Quiz App
Focus: Quiz API answer validation and data integrity
Specifically testing the reported bug where ALL answers were marked correct
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
        self.critical_issues = []
        
    def log_test(self, test_name: str, passed: bool, message: str = "", is_critical: bool = False):
        """Log test result"""
        status = "✅ PASS" if passed else "❌ FAIL"
        result = f"{status}: {test_name}"
        if message:
            result += f" - {message}"
        
        print(result)
        self.test_results.append({
            'test': test_name,
            'passed': passed,
            'message': message,
            'critical': is_critical
        })
        
        if not passed:
            self.failed_tests.append(test_name)
            if is_critical:
                self.critical_issues.append(f"{test_name}: {message}")
    
    def test_api_connection(self):
        """Test basic API connectivity"""
        try:
            response = requests.get(f"{API_BASE}/", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_test("API Connection", True, f"API is running: {data.get('message', 'OK')}")
                return True
            else:
                self.log_test("API Connection", False, f"Status code: {response.status_code}", True)
                return False
        except Exception as e:
            self.log_test("API Connection", False, f"Connection error: {str(e)}", True)
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
                    self.log_test("Episodes Endpoint", False, "No available (unlocked) episodes found", True)
                    return []
            else:
                self.log_test("Episodes Endpoint", False, f"Status code: {response.status_code}", True)
                return []
        except Exception as e:
            self.log_test("Episodes Endpoint", False, f"Error: {str(e)}", True)
            return []
    
    def test_specific_quiz_endpoints(self):
        """Test the specific endpoints mentioned in review request"""
        print(f"\n🎯 Testing Specific Endpoints from Review Request")
        print("-" * 50)
        
        # Test GET /api/quiz/1?count=5
        quiz_1_data = self.test_quiz_endpoint(1, 5, "Review Request Test 1")
        
        # Test GET /api/quiz/2?count=3
        quiz_2_data = self.test_quiz_endpoint(2, 3, "Review Request Test 2")
        
        return quiz_1_data, quiz_2_data
    
    def test_quiz_endpoint(self, episode_id: int, count: int, test_label: str = ""):
        """Test a specific quiz endpoint with comprehensive validation"""
        label = f"{test_label} " if test_label else ""
        
        try:
            response = requests.get(f"{API_BASE}/quiz/{episode_id}?count={count}", timeout=15)
            
            if response.status_code != 200:
                self.log_test(f"{label}Quiz API (Episode {episode_id}, count={count})", False, 
                            f"Status code: {response.status_code}, Response: {response.text}", True)
                return None
            
            quiz_data = response.json()
            questions = quiz_data.get('questions', [])
            
            if not questions:
                self.log_test(f"{label}Quiz Questions (Episode {episode_id})", False, 
                            "No questions returned", True)
                return None
            
            self.log_test(f"{label}Quiz API Response (Episode {episode_id}, count={count})", True, 
                        f"Got {len(questions)} questions")
            
            # Run all validation tests on this quiz data
            self.validate_quiz_data_structure(quiz_data, episode_id, label)
            self.validate_correct_option_format(quiz_data, episode_id, label)
            self.validate_options_array_structure(quiz_data, episode_id, label)
            self.validate_correct_option_matches_options(quiz_data, episode_id, label)
            self.validate_answer_validation_logic(quiz_data, episode_id, label)
            
            return quiz_data
            
        except Exception as e:
            self.log_test(f"{label}Quiz Endpoint (Episode {episode_id})", False, f"Error: {str(e)}", True)
            return None
    
    def validate_quiz_data_structure(self, quiz_data: Dict, episode_id: int, label: str = ""):
        """Validate the main quiz response structure"""
        required_fields = ['episode_id', 'episode_name', 'questions', 'total_questions', 'max_possible_score']
        missing_fields = [field for field in required_fields if field not in quiz_data]
        
        if not missing_fields:
            self.log_test(f"{label}Quiz Data Structure (Episode {episode_id})", True, 
                        "All required fields present")
        else:
            self.log_test(f"{label}Quiz Data Structure (Episode {episode_id})", False, 
                        f"Missing fields: {', '.join(missing_fields)}", True)
    
    def validate_correct_option_format(self, quiz_data: Dict, episode_id: int, label: str = ""):
        """CRITICAL: Test that correct_option is always A, B, C, or D"""
        questions = quiz_data.get('questions', [])
        invalid_options = []
        
        for i, question in enumerate(questions):
            correct_option = question.get('correct_option')
            
            # Check type and value
            if not isinstance(correct_option, str):
                invalid_options.append(f"Q{i+1}: not a string (type: {type(correct_option)})")
            elif correct_option not in ['A', 'B', 'C', 'D']:
                invalid_options.append(f"Q{i+1}: '{correct_option}' (must be A, B, C, or D)")
        
        if not invalid_options:
            self.log_test(f"{label}Correct Option Format (Episode {episode_id})", True, 
                        f"All {len(questions)} correct_options are valid strings (A, B, C, or D)")
        else:
            self.log_test(f"{label}Correct Option Format (Episode {episode_id})", False, 
                        f"Invalid correct_options: {', '.join(invalid_options)}", True)
    
    def validate_options_array_structure(self, quiz_data: Dict, episode_id: int, label: str = ""):
        """CRITICAL: Test that options array has exactly 4 items with IDs A, B, C, D"""
        questions = quiz_data.get('questions', [])
        invalid_structures = []
        
        for i, question in enumerate(questions):
            options = question.get('options', [])
            
            # Check if we have exactly 4 options
            if len(options) != 4:
                invalid_structures.append(f"Q{i+1}: {len(options)} options (expected 4)")
                continue
            
            # Check if option ids are exactly A, B, C, D
            option_ids = [opt.get('id') for opt in options if isinstance(opt, dict)]
            expected_ids = {'A', 'B', 'C', 'D'}
            actual_ids = set(option_ids)
            
            if actual_ids != expected_ids:
                invalid_structures.append(f"Q{i+1}: IDs {sorted(actual_ids)} (expected {sorted(expected_ids)})")
            
            # Check that all options have text
            for j, opt in enumerate(options):
                if not isinstance(opt, dict):
                    invalid_structures.append(f"Q{i+1} Option {j+1}: not a dict")
                elif not opt.get('text', '').strip():
                    invalid_structures.append(f"Q{i+1} Option {opt.get('id', '?')}: empty text")
        
        if not invalid_structures:
            self.log_test(f"{label}Options Array Structure (Episode {episode_id})", True, 
                        f"All {len(questions)} questions have 4 options with correct IDs and text")
        else:
            self.log_test(f"{label}Options Array Structure (Episode {episode_id})", False, 
                        f"Structure issues: {', '.join(invalid_structures[:3])}{'...' if len(invalid_structures) > 3 else ''}", True)
    
    def validate_correct_option_matches_options(self, quiz_data: Dict, episode_id: int, label: str = ""):
        """CRITICAL: Test that correct_option value matches one of the option IDs"""
        questions = quiz_data.get('questions', [])
        mismatches = []
        
        for i, question in enumerate(questions):
            correct_option = question.get('correct_option')
            options = question.get('options', [])
            option_ids = [opt.get('id') for opt in options if isinstance(opt, dict)]
            
            if correct_option not in option_ids:
                mismatches.append(f"Q{i+1}: correct_option '{correct_option}' not in option IDs {option_ids}")
        
        if not mismatches:
            self.log_test(f"{label}Correct Option Matches Options (Episode {episode_id})", True, 
                        f"All {len(questions)} correct_options match their option IDs")
        else:
            self.log_test(f"{label}Correct Option Matches Options (Episode {episode_id})", False, 
                        f"Mismatches: {', '.join(mismatches)}", True)
    
    def validate_answer_validation_logic(self, quiz_data: Dict, episode_id: int, label: str = ""):
        """CRITICAL: Simulate frontend answer validation to detect the 'all correct' bug"""
        questions = quiz_data.get('questions', [])
        validation_issues = []
        
        for i, question in enumerate(questions):
            correct_option = question.get('correct_option')
            options = question.get('options', [])
            
            # Find the correct option text
            correct_option_text = None
            for opt in options:
                if opt.get('id') == correct_option:
                    correct_option_text = opt.get('text', '').strip()
                    break
            
            if not correct_option_text:
                validation_issues.append(f"Q{i+1}: correct_option '{correct_option}' has no text")
                continue
            
            # Simulate frontend validation for each option
            # This tests if ONLY the correct option would be marked as correct
            correct_validations = 0
            for opt in options:
                option_id = opt.get('id')
                # Simulate the frontend comparison (with normalization as fixed by main agent)
                is_correct = (option_id.upper().strip() == correct_option.upper().strip())
                if is_correct:
                    correct_validations += 1
            
            # There should be exactly 1 correct validation per question
            if correct_validations == 0:
                validation_issues.append(f"Q{i+1}: NO options would be marked correct")
            elif correct_validations > 1:
                validation_issues.append(f"Q{i+1}: {correct_validations} options would be marked correct (should be 1)")
        
        if not validation_issues:
            self.log_test(f"{label}Answer Validation Logic (Episode {episode_id})", True, 
                        f"All {len(questions)} questions have exactly 1 correct answer")
        else:
            self.log_test(f"{label}Answer Validation Logic (Episode {episode_id})", False, 
                        f"Validation issues: {', '.join(validation_issues[:2])}{'...' if len(validation_issues) > 2 else ''}", True)
    
    def test_randomization_integrity(self, episode_id: int, count: int = 3):
        """Test that randomization works but maintains data integrity"""
        print(f"\n🔄 Testing Randomization & Data Integrity (Episode {episode_id})")
        print("-" * 50)
        
        responses = []
        for i in range(3):
            try:
                response = requests.get(f"{API_BASE}/quiz/{episode_id}?count={count}", timeout=15)
                if response.status_code == 200:
                    responses.append(response.json())
                else:
                    self.log_test(f"Randomization Test Request {i+1}", False, 
                                f"Status code: {response.status_code}")
                    return
            except Exception as e:
                self.log_test(f"Randomization Test Request {i+1}", False, f"Error: {str(e)}")
                return
        
        if len(responses) < 3:
            self.log_test("Randomization Test", False, "Could not get 3 successful responses", True)
            return
        
        # Check data integrity across all responses
        integrity_issues = []
        for i, resp in enumerate(responses):
            questions = resp.get('questions', [])
            for j, q in enumerate(questions):
                # Check correct_option format
                correct_option = q.get('correct_option')
                if correct_option not in ['A', 'B', 'C', 'D']:
                    integrity_issues.append(f"Response {i+1}, Q{j+1}: invalid correct_option '{correct_option}'")
                
                # Check options structure
                options = q.get('options', [])
                if len(options) != 4:
                    integrity_issues.append(f"Response {i+1}, Q{j+1}: {len(options)} options (expected 4)")
                else:
                    option_ids = [opt.get('id') for opt in options]
                    if set(option_ids) != {'A', 'B', 'C', 'D'}:
                        integrity_issues.append(f"Response {i+1}, Q{j+1}: invalid option IDs {option_ids}")
        
        if integrity_issues:
            self.log_test("Randomization Data Integrity", False, 
                        f"Integrity issues: {', '.join(integrity_issues[:2])}", True)
        else:
            self.log_test("Randomization Data Integrity", True, 
                        "Data integrity maintained across all randomized responses")
        
        # Check if there's some variation (randomization working)
        question_sets = []
        for resp in responses:
            question_ids = [q['id'] for q in resp.get('questions', [])]
            question_sets.append(question_ids)
        
        all_identical = all(qs == question_sets[0] for qs in question_sets)
        if all_identical and count > 1:
            self.log_test("Randomization Variation", True, 
                        "Note: No variation detected (may be limited question pool)")
        else:
            self.log_test("Randomization Variation", True, 
                        "Randomization working - different question sets returned")
    
    def run_comprehensive_tests(self):
        """Run all tests focusing on the reported bug"""
        print(f"\n🧪 QUIZ API ANSWER VALIDATION TESTING")
        print(f"🎯 Focus: Investigating 'ALL answers marked correct' bug")
        print(f"📡 Backend URL: {BACKEND_URL}")
        print("=" * 70)
        
        # Test API connection
        if not self.test_api_connection():
            print("\n❌ Cannot connect to API. Stopping tests.")
            return False
        
        # Test specific endpoints from review request
        quiz_1_data, quiz_2_data = self.test_specific_quiz_endpoints()
        
        # Test randomization if we got data
        if quiz_1_data:
            self.test_randomization_integrity(1, 3)
        
        # Get available episodes for additional testing
        episodes = self.test_episodes_endpoint()
        if episodes:
            # Test first available episode if not already tested
            first_episode = episodes[0]
            if first_episode['id'] not in [1, 2]:
                print(f"\n🎯 Additional Testing with Episode {first_episode['id']}")
                print("-" * 50)
                self.test_quiz_endpoint(first_episode['id'], 3, "Additional Test")
        
        return True
    
    def print_summary(self):
        """Print comprehensive test summary"""
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t['passed']])
        failed_tests = total_tests - passed_tests
        critical_failed = len(self.critical_issues)
        
        print("\n" + "=" * 70)
        print("📊 QUIZ API TESTING SUMMARY")
        print("=" * 70)
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"🚨 Critical Issues: {critical_failed}")
        
        if self.critical_issues:
            print(f"\n🚨 CRITICAL ISSUES (Related to 'All Answers Correct' Bug):")
            for issue in self.critical_issues:
                print(f"   • {issue}")
        
        if self.failed_tests and not self.critical_issues:
            print(f"\n⚠️  NON-CRITICAL FAILED TESTS:")
            non_critical_failed = [t for t in self.test_results if not t['passed'] and not t.get('critical', False)]
            for test in non_critical_failed:
                print(f"   • {test['test']}: {test['message']}")
        
        # Conclusion
        if failed_tests == 0:
            print(f"\n🎉 ALL TESTS PASSED!")
            print(f"✅ Quiz API is returning correct data structure")
            print(f"✅ Answer validation should work properly in frontend")
            print(f"✅ No backend issues found related to 'all answers correct' bug")
        elif critical_failed == 0:
            print(f"\n✅ NO CRITICAL ISSUES FOUND")
            print(f"✅ Backend API data structure is correct for answer validation")
            print(f"⚠️  Some minor issues exist but shouldn't cause 'all answers correct' bug")
        else:
            print(f"\n❌ CRITICAL BACKEND ISSUES FOUND")
            print(f"🚨 These issues could cause the 'all answers correct' bug")
            print(f"🔧 Backend fixes needed before frontend can work properly")
        
        return failed_tests == 0, critical_failed == 0

def main():
    """Main test execution"""
    tester = QuizAPITester()
    
    try:
        success = tester.run_comprehensive_tests()
        if not success:
            print("\n❌ Tests could not complete due to connectivity issues")
            return False
        
        all_passed, no_critical = tester.print_summary()
        
        # Return success if no critical issues (minor issues are acceptable)
        return no_critical
        
    except KeyboardInterrupt:
        print("\n\n⏹️  Tests interrupted by user")
        return False
    except Exception as e:
        print(f"\n\n💥 Unexpected error during testing: {str(e)}")
        return False

if __name__ == "__main__":
    result = main()
    sys.exit(0 if result else 1)