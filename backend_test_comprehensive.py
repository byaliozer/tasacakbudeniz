#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Taşacak Bu Deniz Quiz App
Tests all critical endpoints as specified in the review request
"""

import requests
import json
import sys
from typing import Dict, List, Any
import time

# Backend URL from frontend/.env
BACKEND_URL = "https://tdbquiz.preview.emergentagent.com/api"

class QuizAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.session.timeout = 30
        self.test_results = []
        self.failed_tests = []
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        message = f"{status} - {test_name}"
        if details:
            message += f": {details}"
        print(message)
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        
        if not success:
            self.failed_tests.append(test_name)
    
    def test_episodes_api(self):
        """Test GET /api/episodes - Should return 14 episodes"""
        print("\n=== Testing Episodes API ===")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/episodes")
            
            if response.status_code != 200:
                self.log_test("Episodes API Status", False, f"Expected 200, got {response.status_code}")
                return
            
            self.log_test("Episodes API Status", True, "200 OK")
            
            try:
                episodes = response.json()
            except json.JSONDecodeError:
                self.log_test("Episodes JSON Parse", False, "Invalid JSON response")
                return
            
            self.log_test("Episodes JSON Parse", True)
            
            # Check if it's a list
            if not isinstance(episodes, list):
                self.log_test("Episodes List Format", False, f"Expected list, got {type(episodes)}")
                return
            
            self.log_test("Episodes List Format", True)
            
            # Check episode count
            if len(episodes) != 14:
                self.log_test("Episodes Count", False, f"Expected 14 episodes, got {len(episodes)}")
            else:
                self.log_test("Episodes Count", True, "14 episodes returned")
            
            # Check episode structure
            if episodes:
                episode = episodes[0]
                required_fields = ['id', 'name', 'question_count', 'is_locked', 'description']
                missing_fields = [field for field in required_fields if field not in episode]
                
                if missing_fields:
                    self.log_test("Episode Structure", False, f"Missing fields: {missing_fields}")
                else:
                    self.log_test("Episode Structure", True, "All required fields present")
                    
                # Verify field types
                if isinstance(episode.get('id'), int) and isinstance(episode.get('name'), str):
                    self.log_test("Episode Field Types", True)
                else:
                    self.log_test("Episode Field Types", False, f"Invalid types: id={type(episode.get('id'))}, name={type(episode.get('name'))}")
            
        except requests.RequestException as e:
            self.log_test("Episodes API Connection", False, str(e))
    
    def test_episode_quiz_api(self):
        """Test GET /api/quiz/episode/{episode_id}?count=25"""
        print("\n=== Testing Episode Quiz API ===")
        
        test_episodes = [1, 2, 3]
        
        for episode_id in test_episodes:
            print(f"\n--- Testing Episode {episode_id} ---")
            
            try:
                response = self.session.get(f"{BACKEND_URL}/quiz/episode/{episode_id}?count=25")
                
                if response.status_code != 200:
                    self.log_test(f"Episode {episode_id} Quiz Status", False, f"Expected 200, got {response.status_code}")
                    continue
                
                self.log_test(f"Episode {episode_id} Quiz Status", True)
                
                try:
                    quiz_data = response.json()
                except json.JSONDecodeError:
                    self.log_test(f"Episode {episode_id} JSON Parse", False, "Invalid JSON")
                    continue
                
                self.log_test(f"Episode {episode_id} JSON Parse", True)
                
                # Check required fields
                required_fields = ['episode_id', 'episode_name', 'questions', 'total_questions', 'max_possible_score', 'mode']
                missing_fields = [field for field in required_fields if field not in quiz_data]
                
                if missing_fields:
                    self.log_test(f"Episode {episode_id} Structure", False, f"Missing: {missing_fields}")
                    continue
                
                self.log_test(f"Episode {episode_id} Structure", True)
                
                # Check questions array
                questions = quiz_data.get('questions', [])
                if not isinstance(questions, list):
                    self.log_test(f"Episode {episode_id} Questions Format", False, "Questions not a list")
                    continue
                
                if len(questions) == 0:
                    self.log_test(f"Episode {episode_id} Questions Count", False, "No questions returned")
                    continue
                
                self.log_test(f"Episode {episode_id} Questions Count", True, f"{len(questions)} questions")
                
                # Check question structure
                question = questions[0]
                required_q_fields = ['id', 'text', 'options', 'correct_option', 'difficulty', 'points']
                missing_q_fields = [field for field in required_q_fields if field not in question]
                
                if missing_q_fields:
                    self.log_test(f"Episode {episode_id} Question Structure", False, f"Missing: {missing_q_fields}")
                    continue
                
                self.log_test(f"Episode {episode_id} Question Structure", True)
                
                # Check options structure
                options = question.get('options', [])
                if not isinstance(options, list) or len(options) != 4:
                    self.log_test(f"Episode {episode_id} Options Count", False, f"Expected 4 options, got {len(options) if isinstance(options, list) else 'not a list'}")
                    continue
                
                self.log_test(f"Episode {episode_id} Options Count", True, "4 options")
                
                # Check option structure (should have id and text)
                option = options[0]
                if not isinstance(option, dict) or 'id' not in option or 'text' not in option:
                    self.log_test(f"Episode {episode_id} Option Structure", False, "Options missing id/text")
                    continue
                
                self.log_test(f"Episode {episode_id} Option Structure", True)
                
                # Check correct_option format (should be A, B, C, or D)
                correct_option = question.get('correct_option')
                if correct_option not in ['A', 'B', 'C', 'D']:
                    self.log_test(f"Episode {episode_id} Correct Option Format", False, f"Expected A/B/C/D, got '{correct_option}'")
                    continue
                
                self.log_test(f"Episode {episode_id} Correct Option Format", True, f"'{correct_option}'")
                
                # Verify correct_option matches an option ID
                option_ids = [opt.get('id') for opt in options]
                if correct_option not in option_ids:
                    self.log_test(f"Episode {episode_id} Correct Option Match", False, f"'{correct_option}' not in {option_ids}")
                    continue
                
                self.log_test(f"Episode {episode_id} Correct Option Match", True)
                
                # Check mode
                if quiz_data.get('mode') != 'episode':
                    self.log_test(f"Episode {episode_id} Mode", False, f"Expected 'episode', got '{quiz_data.get('mode')}'")
                else:
                    self.log_test(f"Episode {episode_id} Mode", True, "'episode'")
                
                # Detailed validation for answer validation bug
                self.validate_answer_logic(questions, episode_id)
                
            except requests.RequestException as e:
                self.log_test(f"Episode {episode_id} Connection", False, str(e))
    
    def validate_answer_logic(self, questions: List[Dict], episode_id: int):
        """Validate that only one answer per question would be marked correct"""
        validation_issues = []
        
        for i, question in enumerate(questions):
            correct_option = question.get('correct_option')
            options = question.get('options', [])
            
            # Count how many options would be marked correct
            correct_count = 0
            for option in options:
                option_id = option.get('id', '')
                # Simulate frontend validation with normalization
                if option_id.upper().strip() == correct_option.upper().strip():
                    correct_count += 1
            
            if correct_count == 0:
                validation_issues.append(f"Q{i+1}: No correct answer")
            elif correct_count > 1:
                validation_issues.append(f"Q{i+1}: {correct_count} correct answers")
        
        if validation_issues:
            self.log_test(f"Episode {episode_id} Answer Validation", False, f"Issues: {', '.join(validation_issues[:3])}")
        else:
            self.log_test(f"Episode {episode_id} Answer Validation", True, f"All {len(questions)} questions have exactly 1 correct answer")
    
    def test_mixed_quiz_api(self):
        """Test GET /api/quiz/mixed"""
        print("\n=== Testing Mixed Quiz API ===")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/quiz/mixed")
            
            if response.status_code != 200:
                self.log_test("Mixed Quiz Status", False, f"Expected 200, got {response.status_code}")
                return
            
            self.log_test("Mixed Quiz Status", True)
            
            try:
                quiz_data = response.json()
            except json.JSONDecodeError:
                self.log_test("Mixed Quiz JSON Parse", False, "Invalid JSON")
                return
            
            self.log_test("Mixed Quiz JSON Parse", True)
            
            # Check mode
            if quiz_data.get('mode') != 'mixed':
                self.log_test("Mixed Quiz Mode", False, f"Expected 'mixed', got '{quiz_data.get('mode')}'")
            else:
                self.log_test("Mixed Quiz Mode", True, "'mixed'")
            
            # Check questions exist
            questions = quiz_data.get('questions', [])
            if len(questions) == 0:
                self.log_test("Mixed Quiz Questions", False, "No questions returned")
            else:
                self.log_test("Mixed Quiz Questions", True, f"{len(questions)} questions")
            
            # Check episode_name
            if quiz_data.get('episode_name') == "Karışık Mod":
                self.log_test("Mixed Quiz Name", True, "Karışık Mod")
            else:
                self.log_test("Mixed Quiz Name", False, f"Expected 'Karışık Mod', got '{quiz_data.get('episode_name')}'")
                
        except requests.RequestException as e:
            self.log_test("Mixed Quiz Connection", False, str(e))
    
    def test_episode_score_submission(self):
        """Test POST /api/score/episode"""
        print("\n=== Testing Episode Score Submission ===")
        
        test_data = {
            "player_name": "TestBot",
            "episode_id": 1,
            "score": 100,
            "correct_count": 5,
            "speed_bonus": 10
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/score/episode", json=test_data)
            
            if response.status_code != 200:
                self.log_test("Episode Score Submit Status", False, f"Expected 200, got {response.status_code}")
                return
            
            self.log_test("Episode Score Submit Status", True)
            
            try:
                result = response.json()
            except json.JSONDecodeError:
                self.log_test("Episode Score JSON Parse", False, "Invalid JSON")
                return
            
            self.log_test("Episode Score JSON Parse", True)
            
            # Check required fields
            required_fields = ['success', 'is_new_record', 'best_score']
            missing_fields = [field for field in required_fields if field not in result]
            
            if missing_fields:
                self.log_test("Episode Score Response Structure", False, f"Missing: {missing_fields}")
                return
            
            self.log_test("Episode Score Response Structure", True)
            
            # Check success field
            if result.get('success') is not True:
                self.log_test("Episode Score Success", False, f"Expected True, got {result.get('success')}")
            else:
                self.log_test("Episode Score Success", True)
            
            # Test higher score submission
            higher_score_data = test_data.copy()
            higher_score_data['score'] = 150
            
            response2 = self.session.post(f"{BACKEND_URL}/score/episode", json=higher_score_data)
            if response2.status_code == 200:
                result2 = response2.json()
                if result2.get('is_new_record') is True:
                    self.log_test("Higher Score Update", True, "New record accepted")
                else:
                    self.log_test("Higher Score Update", False, "Higher score not marked as new record")
            
            # Test lower score submission (should NOT update)
            lower_score_data = test_data.copy()
            lower_score_data['score'] = 50
            
            response3 = self.session.post(f"{BACKEND_URL}/score/episode", json=lower_score_data)
            if response3.status_code == 200:
                result3 = response3.json()
                if result3.get('is_new_record') is False:
                    self.log_test("Lower Score Rejection", True, "Lower score correctly rejected")
                else:
                    self.log_test("Lower Score Rejection", False, "Lower score incorrectly accepted as new record")
                    
        except requests.RequestException as e:
            self.log_test("Episode Score Connection", False, str(e))
    
    def test_mixed_score_submission(self):
        """Test POST /api/score/mixed"""
        print("\n=== Testing Mixed Score Submission ===")
        
        test_data = {
            "player_name": "TestBot",
            "score": 150,
            "correct_count": 8,
            "speed_bonus": 15,
            "questions_answered": 10
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/score/mixed", json=test_data)
            
            if response.status_code != 200:
                self.log_test("Mixed Score Submit Status", False, f"Expected 200, got {response.status_code}")
                return
            
            self.log_test("Mixed Score Submit Status", True)
            
            try:
                result = response.json()
            except json.JSONDecodeError:
                self.log_test("Mixed Score JSON Parse", False, "Invalid JSON")
                return
            
            self.log_test("Mixed Score JSON Parse", True)
            
            # Check required fields
            required_fields = ['success', 'is_new_record', 'best_score']
            missing_fields = [field for field in required_fields if field not in result]
            
            if missing_fields:
                self.log_test("Mixed Score Response Structure", False, f"Missing: {missing_fields}")
                return
            
            self.log_test("Mixed Score Response Structure", True)
            
            # Check success field
            if result.get('success') is not True:
                self.log_test("Mixed Score Success", False, f"Expected True, got {result.get('success')}")
            else:
                self.log_test("Mixed Score Success", True)
                
        except requests.RequestException as e:
            self.log_test("Mixed Score Connection", False, str(e))
    
    def test_leaderboards(self):
        """Test all leaderboard endpoints"""
        print("\n=== Testing Leaderboards ===")
        
        # Test general leaderboard
        try:
            response = self.session.get(f"{BACKEND_URL}/leaderboard/general?player_name=TestBot")
            
            if response.status_code != 200:
                self.log_test("General Leaderboard Status", False, f"Expected 200, got {response.status_code}")
            else:
                self.log_test("General Leaderboard Status", True)
                
                try:
                    result = response.json()
                    required_fields = ['entries', 'player_rank', 'player_score', 'total_players']
                    missing_fields = [field for field in required_fields if field not in result]
                    
                    if missing_fields:
                        self.log_test("General Leaderboard Structure", False, f"Missing: {missing_fields}")
                    else:
                        self.log_test("General Leaderboard Structure", True)
                        
                        # Check entries is a list
                        if isinstance(result.get('entries'), list):
                            self.log_test("General Leaderboard Entries", True, f"{len(result['entries'])} entries")
                        else:
                            self.log_test("General Leaderboard Entries", False, "Entries not a list")
                            
                except json.JSONDecodeError:
                    self.log_test("General Leaderboard JSON", False, "Invalid JSON")
                    
        except requests.RequestException as e:
            self.log_test("General Leaderboard Connection", False, str(e))
        
        # Test episode leaderboard
        try:
            response = self.session.get(f"{BACKEND_URL}/leaderboard/episode/1?player_name=TestBot")
            
            if response.status_code != 200:
                self.log_test("Episode Leaderboard Status", False, f"Expected 200, got {response.status_code}")
            else:
                self.log_test("Episode Leaderboard Status", True)
                
                try:
                    result = response.json()
                    required_fields = ['entries', 'player_rank', 'player_score', 'total_players']
                    missing_fields = [field for field in required_fields if field not in result]
                    
                    if missing_fields:
                        self.log_test("Episode Leaderboard Structure", False, f"Missing: {missing_fields}")
                    else:
                        self.log_test("Episode Leaderboard Structure", True)
                        
                except json.JSONDecodeError:
                    self.log_test("Episode Leaderboard JSON", False, "Invalid JSON")
                    
        except requests.RequestException as e:
            self.log_test("Episode Leaderboard Connection", False, str(e))
        
        # Test mixed leaderboard
        try:
            response = self.session.get(f"{BACKEND_URL}/leaderboard/mixed?player_name=TestBot")
            
            if response.status_code != 200:
                self.log_test("Mixed Leaderboard Status", False, f"Expected 200, got {response.status_code}")
            else:
                self.log_test("Mixed Leaderboard Status", True)
                
                try:
                    result = response.json()
                    required_fields = ['entries', 'player_rank', 'player_score', 'total_players']
                    missing_fields = [field for field in required_fields if field not in result]
                    
                    if missing_fields:
                        self.log_test("Mixed Leaderboard Structure", False, f"Missing: {missing_fields}")
                    else:
                        self.log_test("Mixed Leaderboard Structure", True)
                        
                except json.JSONDecodeError:
                    self.log_test("Mixed Leaderboard JSON", False, "Invalid JSON")
                    
        except requests.RequestException as e:
            self.log_test("Mixed Leaderboard Connection", False, str(e))
    
    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting Comprehensive Backend API Testing")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        start_time = time.time()
        
        # Run all test suites
        self.test_episodes_api()
        self.test_episode_quiz_api()
        self.test_mixed_quiz_api()
        self.test_episode_score_submission()
        self.test_mixed_score_submission()
        self.test_leaderboards()
        
        end_time = time.time()
        
        # Summary
        print("\n" + "=" * 60)
        print("🏁 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t['success']])
        failed_tests = len(self.failed_tests)
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        print(f"Duration: {(end_time-start_time):.2f}s")
        
        if self.failed_tests:
            print(f"\n❌ FAILED TESTS:")
            for test in self.failed_tests:
                print(f"  - {test}")
        else:
            print(f"\n🎉 ALL TESTS PASSED!")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = QuizAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)