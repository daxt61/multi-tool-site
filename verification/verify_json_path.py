from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
  # Navigate to the json-path tool
  page.goto("http://localhost:5173/en/outil/json-path")
  page.wait_for_load_state("networkidle")

  # Click on User Directory preset
  user_preset_btn = page.locator('button').filter(has_text="User Directory").first
  user_preset_btn.click()
  page.wait_for_timeout(1000)

  # Let's take a screenshot of the finished visual state
  os.makedirs("/home/jules/verification", exist_ok=True)
  screenshot_path = "/home/jules/verification/json_path_tester_verification.png"
  page.screenshot(path=screenshot_path)
  print(f"Screenshot taken and saved to {screenshot_path}")

if __name__ == "__main__":
  with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    try:
      run_cuj(page)
    finally:
      browser.close()
