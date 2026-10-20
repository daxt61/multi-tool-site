from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    page.goto("http://localhost:5173/fr/outil/graphql-to-cpp")
    page.wait_for_timeout(1000)

    # Click E-Commerce Catalog preset
    page.get_by_role("button", name="Catalogue E-Commerce").click()
    page.wait_for_timeout(1000)

    # Select class C++ construct
    page.locator("#gql-cpp-construct-kind").select_option("class")
    page.wait_for_timeout(500)

    # Enable nlohmann::json
    page.locator("#gql-cpp-use-nlohmann").check()
    page.wait_for_timeout(500)

    # Fill namespace
    page.locator("#gql-cpp-namespace").fill("ecommerce::gql")
    page.wait_for_timeout(1000)

    # Take screenshot at key moment
    page.screenshot(path="/home/jules/verification/screenshots/verification_graphql_to_cpp.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
