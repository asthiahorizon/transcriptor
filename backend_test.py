#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import tempfile
import os

class TranscriptorIAAPITester:
    def __init__(self, base_url="https://vidtranslate-20.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        if files:
            # Remove Content-Type for file uploads
            headers.pop('Content-Type', None)

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, headers=headers)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f", Expected: {expected_status}"
                try:
                    error_data = response.json()
                    details += f", Response: {error_data}"
                except:
                    details += f", Response: {response.text[:200]}"
            
            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {"status": "success"}
            return {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return {}

    def test_health_check(self):
        """Test API health endpoints"""
        self.run_test("Health Check", "GET", "", 200)
        self.run_test("Health Endpoint", "GET", "health", 200)

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_user = {
            "email": f"test_user_{timestamp}@example.com",
            "password": "TestPass123!",
            "name": f"Test User {timestamp}"
        }
        
        response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user
        )
        
        if response and 'token' in response:
            self.token = response['token']
            self.test_user = test_user
            return True
        return False

    def test_user_login(self):
        """Test user login with registered user"""
        if not hasattr(self, 'test_user'):
            self.log_test("User Login", False, "No test user available")
            return False
            
        login_data = {
            "email": self.test_user["email"],
            "password": self.test_user["password"]
        }
        
        response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if response and 'token' in response:
            self.token = response['token']
            return True
        return False

    def test_get_user_profile(self):
        """Test getting user profile"""
        response = self.run_test(
            "Get User Profile",
            "GET",
            "auth/me",
            200
        )
        return bool(response)

    def test_project_operations(self):
        """Test project CRUD operations"""
        # Create project
        project_data = {
            "name": "Test Project",
            "description": "Test project for API testing"
        }
        
        project = self.run_test(
            "Create Project",
            "POST",
            "projects",
            200,
            data=project_data
        )
        
        if not project or 'id' not in project:
            return False
        
        project_id = project['id']
        self.test_project_id = project_id
        
        # Get projects list
        projects = self.run_test(
            "Get Projects List",
            "GET",
            "projects",
            200
        )
        
        # Get specific project
        self.run_test(
            "Get Specific Project",
            "GET",
            f"projects/{project_id}",
            200
        )
        
        # Update project
        update_data = {
            "name": "Updated Test Project",
            "description": "Updated description"
        }
        
        self.run_test(
            "Update Project",
            "PUT",
            f"projects/{project_id}",
            200,
            data=update_data
        )
        
        return True

    def test_video_upload(self):
        """Test video upload functionality"""
        if not hasattr(self, 'test_project_id'):
            self.log_test("Video Upload", False, "No test project available")
            return False
        
        # Create a small test video file (just a placeholder)
        with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as temp_file:
            # Write minimal MP4 header (not a real video, but should pass basic validation)
            temp_file.write(b'\x00\x00\x00\x20ftypmp41\x00\x00\x00\x00mp41isom')
            temp_file.flush()
            
            try:
                with open(temp_file.name, 'rb') as f:
                    files = {'file': ('test_video.mp4', f, 'video/mp4')}
                    
                    video = self.run_test(
                        "Upload Video",
                        "POST",
                        f"projects/{self.test_project_id}/videos",
                        200,
                        files=files
                    )
                
                if video and 'id' in video:
                    self.test_video_id = video['id']
                    return True
                    
            finally:
                os.unlink(temp_file.name)
        
        return False

    def test_video_operations(self):
        """Test video-related operations"""
        if not hasattr(self, 'test_video_id'):
            self.log_test("Video Operations", False, "No test video available")
            return False
        
        video_id = self.test_video_id
        project_id = self.test_project_id
        
        # Get project videos
        self.run_test(
            "Get Project Videos",
            "GET",
            f"projects/{project_id}/videos",
            200
        )
        
        # Get specific video
        self.run_test(
            "Get Specific Video",
            "GET",
            f"videos/{video_id}",
            200
        )
        
        # Test transcription (will likely fail due to invalid video file, but should return proper error)
        self.run_test(
            "Start Transcription",
            "POST",
            f"videos/{video_id}/transcribe",
            200
        )
        
        return True

    def test_subtitle_operations(self):
        """Test subtitle-related operations"""
        if not hasattr(self, 'test_video_id'):
            self.log_test("Subtitle Operations", False, "No test video available")
            return False
        
        video_id = self.test_video_id
        
        # Test subtitle settings update
        settings_data = {
            "font_family": "Arial",
            "font_size": 24,
            "font_color": "#FFFFFF",
            "background_color": "#000000",
            "background_opacity": 0.7,
            "position": "bottom"
        }
        
        self.run_test(
            "Update Subtitle Settings",
            "PUT",
            f"videos/{video_id}/settings",
            200,
            data=settings_data
        )
        
        # Test subtitle update (with mock segments)
        subtitle_data = {
            "segments": [
                {
                    "id": "test-segment-1",
                    "start_time": 0.0,
                    "end_time": 5.0,
                    "original_text": "Test subtitle",
                    "translated_text": "Test subtitle translated"
                }
            ]
        }
        
        self.run_test(
            "Update Subtitles",
            "PUT",
            f"videos/{video_id}/subtitles",
            200,
            data=subtitle_data
        )
        
        return True

    def cleanup(self):
        """Clean up test data"""
        if hasattr(self, 'test_video_id'):
            self.run_test(
                "Delete Test Video",
                "DELETE",
                f"videos/{self.test_video_id}",
                200
            )
        
        if hasattr(self, 'test_project_id'):
            self.run_test(
                "Delete Test Project",
                "DELETE",
                f"projects/{self.test_project_id}",
                200
            )

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting CineScript API Tests")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 60)
        
        # Test sequence
        self.test_health_check()
        
        if self.test_user_registration():
            self.test_user_login()
            self.test_get_user_profile()
            
            if self.test_project_operations():
                if self.test_video_upload():
                    self.test_video_operations()
                    self.test_subtitle_operations()
        
        # Cleanup
        print("\n🧹 Cleaning up test data...")
        self.cleanup()
        
        # Results
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("❌ Some tests failed!")
            print("\nFailed tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")
            return 1

def main():
    tester = CineScriptAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())