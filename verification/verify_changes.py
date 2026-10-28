import re
from playwright.sync_api import sync_playwright

def run_verification(page):
    # 1. Test BMI Calculator
    page.goto("http://localhost:5173/en/outil/bmi-calculator")
    page.wait_for_selector("#weight")
    page.wait_for_timeout(500)

    # Click preset
    page.get_by_role("button", name=re.compile("Standard Male|Homme Standard", re.I)).click()
    page.wait_for_timeout(800)

    # Screenshot BMI Calculator
    page.screenshot(path="/home/jules/verification/screenshots/bmi_calculator.png")
    page.wait_for_timeout(500)

    # 2. Test GraphQL to MikroORM
    page.goto("http://localhost:5173/en/outil/graphql-to-mikroorm")
    page.wait_for_selector("#graphql-mikroorm-input")
    page.wait_for_timeout(500)

    # Click preset
    page.get_by_role("button", name=re.compile("User Management|Gestion Utilisateurs", re.I)).click()
    page.wait_for_timeout(800)

    # Screenshot GraphQL to MikroORM
    page.screenshot(path="/home/jules/verification/screenshots/graphql_to_mikroorm.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_verification(page)
        finally:
            context.close()
            browser.close()
