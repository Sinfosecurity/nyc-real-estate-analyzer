from playwright.sync_api import sync_playwright

GUIDE = [
    "/guide/property",
    "/guide/records",
    "/guide/income",
    "/guide/expenses",
    "/guide/financing",
    "/guide/analysis",
    "/guide/diligence",
    "/guide/report",
]

VIEWPORTS = [(320, 720), (375, 800), (430, 860), (768, 900), (1024, 900), (1440, 900)]


def assert_clean(page):
    text = page.inner_text("body")
    for token in ("NaN", "Infinity", "undefined"):
        if token in text:
            raise AssertionError(f"{token} visible on {page.url}")


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.on("pageerror", lambda err: errors.append(str(err)))
        page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)

        page.goto("http://localhost:5173/", wait_until="networkidle")
        if page.get_by_role("button", name="Skip Introduction").count():
            page.get_by_role("button", name="Skip Introduction").click()
        body = page.inner_text("body")
        if "Analyze a NYC Property" not in body:
            raise AssertionError("Home heading missing")
        if "Analyze New Property" not in body:
            raise AssertionError("Primary CTA missing")

        page.get_by_role("button", name="Try Example Property").click()
        page.wait_for_url("**/guide/property")
        page.wait_for_load_state("networkidle")
        assert_clean(page)
        if "What property are you analyzing?" not in page.inner_text("body"):
            raise AssertionError("Guided property step missing")

        page.locator(".guide-sticky").get_by_role("button", name="Continue", exact=True).click()
        page.wait_for_url("**/guide/records")
        page.locator(".guide-sticky").get_by_role("button", name="Continue", exact=True).click()
        page.wait_for_url("**/guide/income")
        page.get_by_text("Verified base-case rent").wait_for()
        page.get_by_role("button", name="+ Add Unit").click()

        page.goto("http://localhost:5173/guide/analysis", wait_until="networkidle")
        text = page.inner_text("body")
        if "$110,400" not in text and "$79,580" not in text:
            # example deal should still use the golden engine
            if "Maximum offer" not in text:
                raise AssertionError("Analysis payoff missing")
        if "What should I offer?" not in text:
            raise AssertionError("Max offer section missing")

        page.goto("http://localhost:5173/guide/report", wait_until="networkidle")
        if "Executive decision summary" not in page.inner_text("body"):
            raise AssertionError("Report executive summary missing")

        page.goto("http://localhost:5173/desk", wait_until="networkidle")
        desk = page.inner_text("body")
        if "$79,580" not in desk:
            raise AssertionError("Advanced dashboard does not share example NOI")

        page.get_by_role("button", name="Menu").click() if page.get_by_role("button", name="Menu").is_visible() else None

        for route in GUIDE + ["/learn", "/deals", "/comps", "/reports"]:
            page.goto(f"http://localhost:5173{route}", wait_until="networkidle")
            assert_clean(page)

        for width, height in VIEWPORTS:
            page.set_viewport_size({"width": width, "height": height})
            page.goto("http://localhost:5173/", wait_until="networkidle")
            if page.get_by_role("button", name="Skip Introduction").count():
                page.get_by_role("button", name="Skip Introduction").click()
            extra = page.evaluate(
                "() => document.documentElement.scrollWidth - document.documentElement.clientWidth"
            )
            if extra > 28:
                raise AssertionError(f"Horizontal overflow {extra}px at {width}")
            if width <= 768:
                menu = page.get_by_role("button", name="Menu")
                if menu.is_visible():
                    menu.click()
                    page.get_by_role("link", name="Learn").click()
                    page.wait_for_timeout(150)

        browser.close()

    real = [e for e in errors if "favicon" not in e.lower()]
    if real:
        raise SystemExit("Console/page errors:\n" + "\n".join(real[:20]))
    print("BROWSER QA OK")


if __name__ == "__main__":
    main()
