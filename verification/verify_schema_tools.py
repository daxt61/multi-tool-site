from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:5173/en/outil/xml-to-json-schema")
    page.wait_for_timeout(1000)

    # Click preset "Product Catalog XML"
    page.get_by_role("button", name="Product Catalog XML").click()
    page.wait_for_timeout(1000)

    # Take screenshot of XML to JSON Schema
    page.screenshot(path="/home/jules/verification/screenshots/xml_to_json_schema.png")
    page.wait_for_timeout(1000)

    # Navigate to JSON to Protobuf
    page.goto("http://localhost:5173/en/outil/json-to-protobuf")
    page.wait_for_timeout(1000)

    # Click preset "E-Commerce Order"
    page.get_by_role("button", name="E-Commerce Order").click()
    page.wait_for_timeout(1000)

    # Take screenshot of JSON to Protobuf
    page.screenshot(path="/home/jules/verification/screenshots/verification.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
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
