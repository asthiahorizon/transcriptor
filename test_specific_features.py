#!/usr/bin/env python3

import requests
import sys
import json
import time
from datetime import datetime

class SpecificFeaturesTester:
    def __init__(self, base_url="https://ai-subtitles-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
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

    def setup_admin_user(self):
        """Setup admin user for testing"""
        admin_user = {
            "email": "admin@transcriptoria.com",
            "password": "admin123456"
        }
        
        url = f"{self.base_url}/auth/login"
        response = requests.post(url, json=admin_user)
        
        if response.status_code == 200:
            data = response.json()
            self.token = data['token']
            print("✅ Admin login successful")
            return True
        else:
            print(f"❌ Admin login failed: {response.status_code}")
            return False

    def test_transcription_api_parameters(self):
        """Test that transcription API uses word-level timestamps"""
        print("\n🔍 Testing Transcription API Parameters...")
        
        # This test checks the server.py code to verify timestamp_granularities=word is used
        # We can't easily test the actual API call to Infomaniak without a real video
        
        # Check the server.py code for the correct parameter
        try:
            with open('/app/backend/server.py', 'r') as f:
                content = f.read()
                
            # Look for the timestamp_granularities parameter
            if "timestamp_granularities[]': 'word'" in content:
                self.log_test("Transcription API Uses Word Timestamps", True, "Found timestamp_granularities=word in server.py")
                return True
            else:
                self.log_test("Transcription API Uses Word Timestamps", False, "timestamp_granularities=word not found in server.py")
                return False
                
        except Exception as e:
            self.log_test("Transcription API Uses Word Timestamps", False, f"Error reading server.py: {e}")
            return False

    def test_segment_duration_logic(self):
        """Test that segment duration logic aims for ~5s max"""
        print("\n🔍 Testing Segment Duration Logic...")
        
        try:
            with open('/app/backend/server.py', 'r') as f:
                content = f.read()
                
            # Look for MAX_DURATION = 5.0
            if "MAX_DURATION = 5.0" in content:
                self.log_test("Segment Duration Logic (5s max)", True, "Found MAX_DURATION = 5.0 in server.py")
                return True
            else:
                self.log_test("Segment Duration Logic (5s max)", False, "MAX_DURATION = 5.0 not found in server.py")
                return False
                
        except Exception as e:
            self.log_test("Segment Duration Logic (5s max)", False, f"Error reading server.py: {e}")
            return False

    def test_supabase_storage_integration(self):
        """Test that video export uses Supabase Storage"""
        print("\n🔍 Testing Supabase Storage Integration...")
        
        try:
            with open('/app/backend/server.py', 'r') as f:
                content = f.read()
                
            # Look for Supabase upload in export function
            supabase_checks = [
                "supabase.storage.from_(SUPABASE_BUCKET).upload(" in content,
                "output_supabase_path" in content,
                "output_storage_type" in content
            ]
            
            if all(supabase_checks):
                self.log_test("Supabase Storage Integration", True, "Found Supabase upload logic in export function")
                return True
            else:
                self.log_test("Supabase Storage Integration", False, "Supabase upload logic not complete in export function")
                return False
                
        except Exception as e:
            self.log_test("Supabase Storage Integration", False, f"Error reading server.py: {e}")
            return False

    def test_download_signed_urls(self):
        """Test that download uses Supabase signed URLs"""
        print("\n🔍 Testing Download Signed URLs...")
        
        try:
            with open('/app/backend/server.py', 'r') as f:
                content = f.read()
                
            # Look for signed URL generation in download function
            signed_url_checks = [
                "create_signed_url(" in content,
                "signedURL" in content,
                "RedirectResponse" in content
            ]
            
            if all(signed_url_checks):
                self.log_test("Download Signed URLs", True, "Found signed URL logic in download function")
                return True
            else:
                self.log_test("Download Signed URLs", False, "Signed URL logic not complete in download function")
                return False
                
        except Exception as e:
            self.log_test("Download Signed URLs", False, f"Error reading server.py: {e}")
            return False

    def test_frontend_slider_component(self):
        """Test that frontend uses Shadcn Slider component"""
        print("\n🔍 Testing Frontend Slider Component...")
        
        try:
            with open('/app/frontend/src/pages/EditorPage.js', 'r') as f:
                content = f.read()
                
            # Look for Shadcn Slider import and usage
            slider_checks = [
                "import { Slider } from '../components/ui/slider'" in content,
                "handleSliderChange" in content,
                "onValueChange={handleSliderChange}" in content
            ]
            
            if all(slider_checks):
                self.log_test("Frontend Shadcn Slider Component", True, "Found Shadcn Slider import and usage")
                return True
            else:
                self.log_test("Frontend Shadcn Slider Component", False, "Shadcn Slider not properly implemented")
                return False
                
        except Exception as e:
            self.log_test("Frontend Shadcn Slider Component", False, f"Error reading EditorPage.js: {e}")
            return False

    def test_segment_navigation_buttons(self):
        """Test that prev/next segment buttons are implemented"""
        print("\n🔍 Testing Segment Navigation Buttons...")
        
        try:
            with open('/app/frontend/src/pages/EditorPage.js', 'r') as f:
                content = f.read()
                
            # Look for prev/next button logic
            nav_checks = [
                "← Préc." in content,
                "Suiv. →" in content,
                "activeSegmentIndex - 1" in content,
                "activeSegmentIndex + 1" in content
            ]
            
            if all(nav_checks):
                self.log_test("Segment Navigation Buttons", True, "Found prev/next navigation buttons")
                return True
            else:
                self.log_test("Segment Navigation Buttons", False, "Prev/next navigation buttons not properly implemented")
                return False
                
        except Exception as e:
            self.log_test("Segment Navigation Buttons", False, f"Error reading EditorPage.js: {e}")
            return False

    def test_auto_scroll_functionality(self):
        """Test that auto-scroll functionality is implemented"""
        print("\n🔍 Testing Auto-scroll Functionality...")
        
        try:
            with open('/app/frontend/src/pages/EditorPage.js', 'r') as f:
                content = f.read()
                
            # Look for auto-scroll logic
            scroll_checks = [
                "scrollIntoView" in content,
                "segmentRefs.current" in content,
                "segments-container" in content
            ]
            
            if all(scroll_checks):
                self.log_test("Auto-scroll Functionality", True, "Found auto-scroll implementation")
                return True
            else:
                self.log_test("Auto-scroll Functionality", False, "Auto-scroll functionality not properly implemented")
                return False
                
        except Exception as e:
            self.log_test("Auto-scroll Functionality", False, f"Error reading EditorPage.js: {e}")
            return False

    def run_all_tests(self):
        """Run all specific feature tests"""
        print("🚀 Starting TranscriptorIA Specific Features Tests")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 60)
        
        if not self.setup_admin_user():
            print("❌ Cannot proceed without admin access")
            return 1
        
        # Test backend features
        self.test_transcription_api_parameters()
        self.test_segment_duration_logic()
        self.test_supabase_storage_integration()
        self.test_download_signed_urls()
        
        # Test frontend features
        self.test_frontend_slider_component()
        self.test_segment_navigation_buttons()
        self.test_auto_scroll_functionality()
        
        # Results
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All specific feature tests passed!")
            return 0
        else:
            print("❌ Some specific feature tests failed!")
            print("\nFailed tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")
            return 1

def main():
    tester = SpecificFeaturesTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())