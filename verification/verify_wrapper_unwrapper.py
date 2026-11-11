from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.set_viewport_size({"width": 1280, "height": 900})

    # 1. Verify List Item Wrapper
    page.goto("http://localhost:5173/en/outil/list-item-wrapper")
    page.wait_for_timeout(1000)

    # Click Price List preset
    page.get_by_role("button", name="Price List").click()
    page.wait_for_timeout(800)

    # Click Italian Numbers preset
    page.get_by_role("button", name="Italian Numbers").click()
    page.wait_for_timeout(800)

    page.screenshot(path="/home/jules/verification/screenshots/list_item_wrapper_verify.png")
    page.wait_for_timeout(500)

    # 2. Verify List Item Unwrapper
    page.goto("http://localhost:5173/en/outil/list-item-unwrapper")
    page.wait_for_timeout(1000)

    # Click Wedding Guests preset
    page.get_by_role("button", name="Wedding Guests").click()
    page.wait_for_timeout(800)

    # Click Atmosphere Layers preset
    page.get_by_role("button", name="Atmosphere Layers").click()
    page.wait_for_timeout(800)

    page.screenshot(path="/home/jules/verification/screenshots/list_item_unwrapper_verify.png")
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
