import os
import glob
from playwright.sync_api import sync_playwright

def run_cuj(page):
    # Navigate to Retirement Calculator
    page.goto("http://localhost:5173/fr/outil/retirement-calculator")
    page.wait_for_timeout(1000)

    # Click a preset
    page.get_by_role("button", name="Carrière avancée (1965)").click()
    page.wait_for_timeout(1000)

    # Navigate to GraphQL to Elixir Ecto Converter
    page.goto("http://localhost:5173/fr/outil/graphql-to-elixir")
    page.wait_for_timeout(1000)

    # Click user auth preset
    page.get_by_role("button", name="Gestion Utilisateurs & Auth").click()
    page.wait_for_timeout(1000)

    # Take screenshot
    page.screenshot(path="/home/jules/verification/screenshots/verification_elixir_retirement.png")
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
