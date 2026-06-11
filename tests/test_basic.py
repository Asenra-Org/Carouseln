import os
from playwright.sync_api import sync_playwright

def run_tests():
    # Ensure screenshots directory exists
    screenshots_dir = os.path.join(os.path.dirname(__file__), "screenshots")
    os.makedirs(screenshots_dir, exist_ok=True)
    
    print("Starting E2E tests with Playwright...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        # 1. Landing Page Test
        print("\nTesting Landing Page...")
        page.goto("http://localhost:4321/")
        page.wait_for_load_state("networkidle")
        
        title = page.title()
        print(f"Landing page title: '{title}'")
        assert "Carouseln" in title, f"Title assertion failed, got: {title}"
        
        screenshot_path = os.path.join(screenshots_dir, "homepage.png")
        page.screenshot(path=screenshot_path, full_page=True)
        print(f"Saved landing page screenshot to {screenshot_path}")
        
        # Verify CTA button link exists
        signup_cta = page.locator("a[href='/signup']").first
        assert signup_cta.is_visible(), "Signup CTA button not found or not visible"
        print("Landing page verification PASSED.")
        
        # 2. Login Page Test
        print("\nTesting Login Page...")
        page.goto("http://localhost:4321/login")
        page.wait_for_load_state("networkidle")
        
        login_title = page.title()
        print(f"Login page title: '{login_title}'")
        assert "Sign In" in login_title, f"Login title assertion failed, got: {login_title}"
        
        screenshot_path = os.path.join(screenshots_dir, "login.png")
        page.screenshot(path=screenshot_path)
        print(f"Saved login page screenshot to {screenshot_path}")
        
        # Verify LoginForm fields
        email_input = page.locator("input[type='email']")
        password_input = page.locator("input[type='password']")
        submit_btn = page.locator("button[type='submit']")
        
        assert email_input.is_visible(), "Email input field not visible"
        assert password_input.is_visible(), "Password input field not visible"
        assert submit_btn.is_visible(), "Submit button not visible"
        print("Login page verification PASSED.")
        
        # 3. Signup Page Test
        print("\nTesting Signup Page...")
        page.goto("http://localhost:4321/signup")
        page.wait_for_load_state("networkidle")
        
        signup_title = page.title()
        print(f"Signup page title: '{signup_title}'")
        assert "Sign Up" in signup_title or "Create your account" in page.content(), "Signup verification failed"
        
        screenshot_path = os.path.join(screenshots_dir, "signup.png")
        page.screenshot(path=screenshot_path)
        print(f"Saved signup page screenshot to {screenshot_path}")
        
        # Verify SignupForm fields
        name_input = page.locator("input[type='text']")
        email_input = page.locator("input[type='email']")
        password_input = page.locator("input[type='password']").first
        confirm_password_input = page.locator("input[type='password']").nth(1)
        agree_checkbox = page.locator("input[type='checkbox']").first
        
        assert name_input.is_visible(), "Name input field not visible"
        assert email_input.is_visible(), "Email input field not visible"
        assert password_input.is_visible(), "Password input field not visible"
        assert confirm_password_input.is_visible(), "Confirm password input field not visible"
        assert agree_checkbox.is_visible(), "Terms agreement checkbox not visible"
        print("Signup page verification PASSED.")
        
        # 4. Forgot Password Page Test
        print("\nTesting Forgot Password Page...")
        page.goto("http://localhost:4321/forgot-password")
        page.wait_for_load_state("networkidle")
        
        forgot_title = page.title()
        print(f"Forgot password page title: '{forgot_title}'")
        
        screenshot_path = os.path.join(screenshots_dir, "forgot_password.png")
        page.screenshot(path=screenshot_path)
        print(f"Saved forgot password page screenshot to {screenshot_path}")
        
        # Verify ForgotPasswordForm fields
        email_input = page.locator("input[type='email']")
        submit_btn = page.locator("button[type='submit']")
        
        assert email_input.is_visible(), "Email input field not visible"
        assert submit_btn.is_visible(), "Submit button not visible"
        print("Forgot password page verification PASSED.")
        
        browser.close()
        
    print("\nAll E2E tests PASSED successfully!")

if __name__ == "__main__":
    run_tests()
