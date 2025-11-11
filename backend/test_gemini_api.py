"""
Test script to verify Gemini API key and diagnose issues
"""
import os
import sys
import google.generativeai as genai
from dotenv import load_dotenv
import json

# Fix Windows console encoding for emoji support
if sys.platform == 'win32':
    try:
        # Try to set UTF-8 encoding
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except:
        # Fallback: ignore encoding errors
        pass

# Load environment variables
load_dotenv()

# API key to test
API_KEY = os.getenv('GEMINI_API_KEY') or 'AIzaSyAuYdnbTNk-KvUioIEd34WRcgqZcQmyqZg'

print("=" * 60)
print("GEMINI API KEY TEST")
print("=" * 60)
print(f"\nAPI Key: {API_KEY[:20]}...{API_KEY[-10:]}")
print(f"API Key Length: {len(API_KEY)}")
print(f"API Key from .env: {os.getenv('GEMINI_API_KEY')}")
print("\n" + "=" * 60)

# Configure Gemini
try:
    print("\n1. Configuring Gemini API...")
    genai.configure(api_key=API_KEY)
    print("[OK] Gemini API configured successfully")
except Exception as e:
    print(f"[ERROR] Failed to configure Gemini API: {e}")
    exit(1)

# Test different models - focusing on Gemini 2.5 and above
models_to_test = [
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.0-flash-exp',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-pro'
]

print("\n" + "=" * 60)
print("TESTING DIFFERENT MODELS")
print("=" * 60)

for model_name in models_to_test:
    print(f"\n[TEST] Testing model: {model_name}")
    try:
        # Initialize model
        model = genai.GenerativeModel(model_name)
        print(f"   [OK] Model '{model_name}' initialized")
        
        # Test with a simple prompt
        print(f"   [TEST] Sending test request...")
        response = model.generate_content("Say 'Hello, API test successful!' in one sentence.")
        
        if response and response.text:
            print(f"   [OK] Response received: {response.text[:100]}")
            print(f"   [SUCCESS] Model '{model_name}' is WORKING!")
            break  # Stop after first working model
        else:
            print(f"   [WARN] No response text from model '{model_name}'")
            
    except Exception as e:
        error_str = str(e)
        print(f"   [ERROR] Model '{model_name}' failed: {error_str[:200]}")
        
        # Check for specific error types
        if "429" in error_str or "quota" in error_str.lower():
            print(f"   [QUOTA ERROR] QUOTA ERROR detected for '{model_name}'")
            if "free_tier" in error_str.lower():
                print(f"   [INFO] This appears to be a FREE TIER quota issue")
        elif "403" in error_str or "permission" in error_str.lower():
            print(f"   [PERMISSION ERROR] PERMISSION ERROR - API key may not have access")
        elif "401" in error_str or "invalid" in error_str.lower():
            print(f"   [AUTH ERROR] AUTH ERROR - API key may be invalid")
        elif "404" in error_str:
            print(f"   [NOT FOUND] MODEL NOT FOUND - '{model_name}' may not exist")

print("\n" + "=" * 60)
print("DETAILED API KEY TEST")
print("=" * 60)

# Test Gemini 2.5 models specifically
print("\n" + "=" * 60)
print("TESTING GEMINI 2.5 MODELS")
print("=" * 60)

gemini_25_models = [
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.0-flash-exp'
]

for model_name in gemini_25_models:
    print(f"\n[TEST] Testing Gemini 2.5 model: {model_name}")
    try:
        model = genai.GenerativeModel(model_name)
        print("   [OK] Model initialized")
        
        # Test with a simple prompt (same as app would use)
        test_prompt = "Hello, this is a test message. Please respond briefly."
        print(f"   [TEST] Sending test message: '{test_prompt}'")
        
        response = model.generate_content(test_prompt)
        
        if response and response.text:
            print(f"   [SUCCESS] Response received!")
            print(f"   [RESPONSE] {response.text}")
            print(f"   [SUCCESS] Model '{model_name}' is WORKING!")
            print(f"\n   *** RECOMMENDATION: Use '{model_name}' in your app! ***")
            break  # Stop after first working model
        else:
            print(f"   [ERROR] No response received from '{model_name}'")
            
    except Exception as e:
        error_str = str(e)
        print(f"   [ERROR] Model '{model_name}' failed: {error_str[:300]}")
        
        # Parse error details
        if hasattr(e, 'response'):
            try:
                print(f"   Response status: {e.response.status_code if hasattr(e.response, 'status_code') else 'N/A'}")
            except:
                pass
        
        # Check error type
        if "429" in error_str:
            print("\n   [QUOTA ERROR DETAILS]")
            print("   - You've exceeded your API quota")
            print("   - Possible causes:")
            print("     1. Free tier quota exhausted")
            print("     2. Rate limit exceeded (too many requests)")
            print("     3. Daily/monthly quota reached")
            if "free_tier" in error_str.lower():
                print("   - NOTE: This is a FREE TIER quota issue")
                print("   - Free tier may not support Gemini 2.5 models")
            print("   - Solutions:")
            print("     1. Wait 15-30 minutes for quota reset")
            print("     2. Check your quota in Google AI Studio")
            print("     3. Upgrade to a paid plan for Gemini 2.5 access")
            print("     4. Try gemini-1.5-flash (may work on free tier)")
            
        elif "403" in error_str or "PERMISSION_DENIED" in error_str:
            print("\n   [PERMISSION ERROR]")
            print("   - API key may not have permission to use this model")
            print("   - Gemini 2.5 may require a paid plan")
            print("   - Check API key permissions in Google Cloud Console")
            
        elif "401" in error_str or "UNAUTHENTICATED" in error_str:
            print("\n   [AUTHENTICATION ERROR]")
            print("   - API key may be invalid or expired")
            print("   - Verify API key in Google AI Studio")
            
        elif "404" in error_str or "NOT_FOUND" in error_str or "not found" in error_str.lower():
            print("\n   [MODEL NOT FOUND]")
            print(f"   - Model '{model_name}' may not be available")
            print("   - Model name may be incorrect")
            print("   - Model may not be available in your region")
            print("   - Try: gemini-1.5-flash or gemini-1.5-pro")

print("\n" + "=" * 60)
print("API KEY VALIDATION")
print("=" * 60)

# Check if API key format is correct
if API_KEY.startswith('AIzaSy') and len(API_KEY) == 39:
    print("[OK] API key format looks correct (39 characters, starts with AIzaSy)")
else:
    print(f"[WARN] API key format may be incorrect (length: {len(API_KEY)})")

# Test API key with list_models
print("\n[TEST] Testing API key by listing available models...")
try:
    models = genai.list_models()
    model_list = list(models)
    print(f"   [OK] API key is valid! Found {len(model_list)} models")
    print("   Available models:")
    for m in model_list:
        if 'generateContent' in m.supported_generation_methods:
            print(f"      - {m.name}")
except Exception as e:
    print(f"   [ERROR] Failed to list models: {e}")
    print(f"   This suggests the API key may be invalid")

print("\n" + "=" * 60)
print("RECOMMENDATIONS")
print("=" * 60)

print("""
Based on the test results:

1. If you see QUOTA errors:
   - Wait 15-30 minutes
   - Check quota in Google AI Studio: https://aistudio.google.com/app/apikey
   - Consider upgrading to paid plan
   - Try using 'gemini-1.5-flash' instead of 'gemini-2.0-flash-exp'

2. If you see PERMISSION errors:
   - Check API key has Gemini API enabled
   - Verify API key in Google Cloud Console

3. If you see AUTH errors:
   - Verify API key is correct
   - Check if API key is expired or revoked

4. If model not found:
   - Use 'gemini-1.5-flash' or 'gemini-1.5-pro' instead
   - Check model availability in your region
""")

print("=" * 60)
print("Test completed!")
print("=" * 60)

