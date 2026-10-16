from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        page.goto("http://localhost:4173/fr/outil/graphql-to-prisma")
        page.wait_for_selector("#graphql-prisma-input")
        page.click('button:has-text("Catalogue E-Commerce")')
        page.wait_for_timeout(500)
        page.screenshot(path="/home/jules/verification/graphql-to-prisma.png")
        browser.close()

if __name__ == "__main__":
    verify()
