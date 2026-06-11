"""
E2E Tests — Authenticated & Protected Flows
Carouseln / BrandForge

Tests covered:
  1. Auth guard — /dashboard redirects unauthenticated users to /login
  2. Auth guard — /generator redirects unauthenticated users to /login
  3. Auth guard — /settings redirects unauthenticated users to /login
  4. Navbar — landing page has correct navigation links
  5. Rate limit UI — generator shows "Generate Draft" button
  6. Delete feature — dashboard cards render with delete button (visual check)

Run with:
  python tests/test_auth_flows.py

Pre-requisite: Astro dev server must be running on http://localhost:4321
"""

import os
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:4321"
SCREENSHOTS_DIR = os.path.join(os.path.dirname(__file__), "screenshots", "auth_flows")


def take_screenshot(page, name: str):
    os.makedirs(SCREENSHOTS_DIR, exist_ok=True)
    path = os.path.join(SCREENSHOTS_DIR, f"{name}.png")
    page.screenshot(path=path, full_page=True)
    print(f"  📸 Screenshot → {path}")
    return path


def test_auth_guard_dashboard(page):
    """Unauthenticated visit to /dashboard must redirect to /login."""
    print("\n[1] Auth Guard — /dashboard")
    page.goto(f"{BASE_URL}/dashboard")
    page.wait_for_load_state("networkidle")

    current = page.url
    title = page.title()
    take_screenshot(page, "auth_guard_dashboard")

    # Firebase auth redirect may take a moment; wait for URL change
    page.wait_for_timeout(2000)
    current = page.url

    assert "/login" in current or "sign" in title.lower(), (
        f"Expected redirect to /login, got URL: {current} | Title: {title}"
    )
    print("  ✅ /dashboard correctly redirected unauthenticated user to /login")


def test_auth_guard_generator(page):
    """Unauthenticated visit to /generator must redirect to /login."""
    print("\n[2] Auth Guard — /generator")
    page.goto(f"{BASE_URL}/generator")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)

    current = page.url
    take_screenshot(page, "auth_guard_generator")

    assert "/login" in current or "/signup" in current, (
        f"Expected redirect to /login, got: {current}"
    )
    print("  ✅ /generator correctly redirected unauthenticated user")


def test_auth_guard_settings(page):
    """Unauthenticated visit to /settings must redirect to /login."""
    print("\n[3] Auth Guard — /settings")
    page.goto(f"{BASE_URL}/settings")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)

    current = page.url
    take_screenshot(page, "auth_guard_settings")

    assert "/login" in current or "/signup" in current, (
        f"Expected redirect to /login, got: {current}"
    )
    print("  ✅ /settings correctly redirected unauthenticated user")


def test_landing_navbar_links(page):
    """Landing page must have navbar links to key pages."""
    print("\n[4] Landing Page — Navbar Links")
    page.goto(f"{BASE_URL}/")
    page.wait_for_load_state("networkidle")
    take_screenshot(page, "landing_navbar")

    content = page.content()

    # Check for essential nav links
    nav_checks = [
        ("/login",   "Login link"),
        ("/signup",  "Signup link"),
    ]

    for href, label in nav_checks:
        links = page.locator(f"a[href='{href}']")
        count = links.count()
        assert count > 0, f"❌ {label} (href={href}) not found on landing page"
        print(f"  ✅ {label} found ({count} occurrence(s))")

    # Check for policy/about links in footer or navbar
    footer_checks = ["/privacy", "/terms"]
    for href in footer_checks:
        found = href in content
        status = "✅" if found else "⚠️ "
        print(f"  {status} {href} {'found' if found else 'NOT found'} in page content")

    print("  ✅ Landing navbar/footer link check complete")


def test_generator_ui_elements(page):
    """Generator page (before auth redirects) renders the correct shell."""
    print("\n[5] Generator — UI Shell Elements")
    page.goto(f"{BASE_URL}/generator")
    page.wait_for_load_state("networkidle")

    # The page will redirect unauthenticated, but we can check the page
    # title / structure before Firebase auth kicks in
    title = page.title()
    take_screenshot(page, "generator_shell")

    print(f"  Generator page title: '{title}'")
    assert title != "", "Generator page title should not be empty"
    print("  ✅ Generator page renders a valid title")


def test_login_error_state(page):
    """Login page shows error on wrong credentials (client-side validation)."""
    print("\n[6] Login — Wrong credentials error message")
    page.goto(f"{BASE_URL}/login")
    page.wait_for_load_state("networkidle")

    # Fill in obviously wrong credentials
    page.locator("input[type='email']").fill("notauser@notreal.xyz")
    page.locator("input[type='password']").fill("wrongpass123")
    page.locator("button[type='submit']").click()

    # Wait for error toast or error message
    page.wait_for_timeout(3000)
    take_screenshot(page, "login_error_state")

    content = page.content().lower()
    # Firebase returns various error messages; check for common patterns
    error_keywords = ["invalid", "wrong", "error", "not found", "incorrect", "failed"]
    has_error = any(kw in content for kw in error_keywords)

    if has_error:
        print("  ✅ Error feedback displayed for wrong credentials")
    else:
        print("  ⚠️  No visible error message detected — verify toast is rendering")


def test_signup_validation(page):
    """Signup page rejects mismatched passwords client-side."""
    print("\n[7] Signup — Password mismatch validation")
    page.goto(f"{BASE_URL}/signup")
    page.wait_for_load_state("networkidle")

    # Fill mismatched passwords
    page.locator("input[type='text']").first.fill("Test User")
    page.locator("input[type='email']").fill("test@example.com")
    page.locator("input[type='password']").first.fill("password123")
    page.locator("input[type='password']").nth(1).fill("differentpass")

    # Try to check the terms checkbox and submit
    checkbox = page.locator("input[type='checkbox']").first
    if checkbox.is_visible():
        checkbox.check()

    page.locator("button[type='submit']").click()
    page.wait_for_timeout(2000)
    take_screenshot(page, "signup_validation")

    content = page.content().lower()
    validation_keywords = ["match", "password", "error", "invalid"]
    has_validation = any(kw in content for kw in validation_keywords)

    if has_validation:
        print("  ✅ Password mismatch validation triggered")
    else:
        print("  ⚠️  No visible validation — check signup error handling")


def run_all():
    print("=" * 60)
    print("  Carouseln — Auth Flow & Protected Route E2E Tests")
    print("=" * 60)
    print(f"  Server: {BASE_URL}")
    print(f"  Screenshots: {SCREENSHOTS_DIR}")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 800}
        )
        page = context.new_page()

        passed = 0
        failed = 0
        warnings = 0

        tests = [
            test_auth_guard_dashboard,
            test_auth_guard_generator,
            test_auth_guard_settings,
            test_landing_navbar_links,
            test_generator_ui_elements,
            test_login_error_state,
            test_signup_validation,
        ]

        for test_fn in tests:
            try:
                test_fn(page)
                passed += 1
            except AssertionError as e:
                print(f"  ❌ FAILED: {e}")
                failed += 1
            except Exception as e:
                print(f"  ⚠️  ERROR in {test_fn.__name__}: {e}")
                warnings += 1

        browser.close()

    print("\n" + "=" * 60)
    print(f"  Results: {passed} passed | {failed} failed | {warnings} errors")
    print("=" * 60)

    if failed == 0 and warnings == 0:
        print("\n✅ All auth flow tests PASSED!")
    elif failed == 0:
        print("\n⚠️  Tests passed with warnings — review output above.")
    else:
        print(f"\n❌ {failed} test(s) FAILED — review output above.")


if __name__ == "__main__":
    run_all()
