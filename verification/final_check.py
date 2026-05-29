import asyncio
from playwright.async_api import async_playwright

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Start dev server if not running, but I assume I can just visit localhost if I start it
        # Or I can just verify the build artifacts exist which I already did.
        # Actually I should test the logic if possible.

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify())
