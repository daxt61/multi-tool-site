from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:5173/en/outil/json-to-mermaid")
    page.wait_for_timeout(1000)

    # Click E-Commerce Order preset
    page.get_by_role("button", name="E-Commerce Order").click()
    page.wait_for_timeout(1000)

    # Click Mindmap mode
    page.get_by_role("button", name="Mindmap").click()
    page.wait_for_timeout(1000)

    # Click Flowchart mode
    page.get_by_role("button", name="Flowchart").click()
    page.wait_for_timeout(1000)

    # Take screenshot at key moment
    page.screenshot(path="/home/jules/verification/screenshots/json_to_mermaid_verification.png")
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
