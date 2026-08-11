from __future__ import annotations

import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Any

from playwright.sync_api import Browser, BrowserContext, Page, sync_playwright

BASE_URL = os.environ.get("E2E_BASE_URL", "http://127.0.0.1:3000").rstrip("/")
PASSWORD = os.environ.get("E2E_PASSWORD", "DemoPass!2026")
ARTIFACT_DIR = Path(os.environ.get("HYDRATION_ARTIFACT_DIR", "artifacts/hydration"))

PUBLIC_ROUTES = [
    "/",
    "/properties",
    "/properties/property-published",
    "/agents",
    "/agents/agent-omar",
    "/market-insights",
    "/calculator",
    "/commute",
    "/ai-recommend",
    "/valuation",
    "/neighborhood-guide",
    "/virtual-tour",
    "/compare",
    "/about",
    "/contact",
]

BUYER_ROUTES = [
    "/dashboard",
    "/favorites",
    "/compare",
    "/saved-searches",
    "/property-alerts",
    "/notifications",
    "/my-tours",
    "/messaging",
    "/settings",
    "/my-listings",
    "/list-property",
]

ROOT_OBSERVER = r"""
(() => {
  const records = [];
  Object.defineProperty(window, "__estateproRootMutations", {
    configurable: false,
    enumerable: false,
    value: records,
    writable: false,
  });

  const observe = () => {
    if (!document.documentElement || document.documentElement.__estateproObserved) return;
    Object.defineProperty(document.documentElement, "__estateproObserved", {
      value: true,
      configurable: true,
    });
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type !== "attributes") continue;
        records.push({
          at: performance.now(),
          name: mutation.attributeName,
          oldValue: mutation.oldValue,
          newValue: document.documentElement.getAttribute(mutation.attributeName),
          stack: new Error("root mutation").stack,
        });
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeOldValue: true,
    });
  };

  observe();
  document.addEventListener("readystatechange", observe);
})();
"""


def slug(value: str) -> str:
    normalized = re.sub(r"[^a-zA-Z0-9._-]+", "-", value.strip("/"))
    return normalized.strip("-") or "root"


def visible(locator):
    for index in range(locator.count()):
        candidate = locator.nth(index)
        if candidate.is_visible():
            return candidate
    return None


def login(page: Page, email: str) -> None:
    page.goto(f"{BASE_URL}/", wait_until="domcontentloaded")
    buttons = page.get_by_role("button", name=re.compile(r"^sign in$", re.I))
    button = visible(buttons)
    if button is None:
        page.get_by_role("button", name="Menu").click()
        page.get_by_role("navigation", name="Mobile navigation").wait_for(
            state="visible"
        )
        button = visible(buttons)
    if button is None:
        raise AssertionError("No visible Sign In button")
    button.click()

    email_input = page.locator("#login-email")
    password_input = page.locator("#login-password")
    email_input.wait_for(state="visible")
    email_input.fill(email)
    password_input.fill(PASSWORD)
    with page.expect_response(
        lambda response: "/api/auth/callback/credentials" in response.url
        and response.request.method == "POST"
    ) as info:
        email_input.locator("xpath=ancestor::form").get_by_role(
            "button", name=re.compile(r"^sign in$", re.I)
        ).click()
    if info.value.status >= 400:
        raise AssertionError(f"Login returned {info.value.status}")
    email_input.wait_for(state="hidden")


def new_context(browser: Browser, service_workers: str) -> BrowserContext:
    context = browser.new_context(
        viewport={"width": 1440, "height": 1000},
        locale="en-US",
        service_workers=service_workers,
    )
    context.add_init_script(ROOT_OBSERVER)
    context.route(
        "https://www.openstreetmap.org/**",
        lambda route: route.fulfill(
            status=200,
            content_type="text/html",
            body="<!doctype html><html><body></body></html>",
        ),
    )
    return context


def run_sequence(
    browser: Browser,
    *,
    name: str,
    service_workers: str,
    routes: list[str],
    account_email: str | None = None,
) -> dict[str, Any]:
    context = new_context(browser, service_workers)
    page = context.new_page()
    scenario_dir = ARTIFACT_DIR / name
    scenario_dir.mkdir(parents=True, exist_ok=True)
    current_errors: list[dict[str, Any]] = []
    current_console: list[dict[str, Any]] = []
    route_results: list[dict[str, Any]] = []

    def on_page_error(error: Any) -> None:
        current_errors.append(
            {
                "url": page.url,
                "message": getattr(error, "message", str(error)),
                "stack": getattr(error, "stack", None),
            }
        )

    def on_console(message: Any) -> None:
        if message.type not in {"error", "warning"}:
            return
        values: list[str] = []
        for argument in message.args:
            try:
                values.append(str(argument.json_value()))
            except Exception:
                values.append(str(argument))
        current_console.append(
            {
                "url": page.url,
                "type": message.type,
                "text": message.text,
                "args": values,
            }
        )

    page.on("pageerror", on_page_error)
    page.on("console", on_console)

    if account_email:
        login(page, account_email)
        page.wait_for_timeout(1_000)

    for path in routes:
        current_errors.clear()
        current_console.clear()
        response = page.goto(f"{BASE_URL}{path}", wait_until="domcontentloaded")
        page.locator("body").wait_for(state="visible")
        page.wait_for_timeout(2_000)
        mutations = page.evaluate("window.__estateproRootMutations || []")
        result = {
            "path": path,
            "status": response.status if response else None,
            "url": page.url,
            "errors": list(current_errors),
            "console": list(current_console),
            "rootMutations": mutations,
            "htmlAttributes": page.evaluate(
                "Object.fromEntries(Array.from(document.documentElement.attributes).map(a => [a.name, a.value]))"
            ),
        }
        route_results.append(result)
        page.screenshot(
            path=str(scenario_dir / f"{slug(path)}.png"),
            full_page=False,
        )
        print(json.dumps({"scenario": name, **result}, ensure_ascii=False))

    context.close()
    return {
        "name": name,
        "serviceWorkers": service_workers,
        "account": account_email,
        "routes": route_results,
    }


def main() -> int:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    scenarios: list[dict[str, Any]] = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        scenarios.append(
            run_sequence(
                browser,
                name="public-sw-allow",
                service_workers="allow",
                routes=PUBLIC_ROUTES,
            )
        )
        scenarios.append(
            run_sequence(
                browser,
                name="public-sw-block",
                service_workers="block",
                routes=PUBLIC_ROUTES,
            )
        )
        scenarios.append(
            run_sequence(
                browser,
                name="buyer-sw-allow",
                service_workers="allow",
                routes=BUYER_ROUTES,
                account_email="buyer@estatepro.test",
            )
        )
        scenarios.append(
            run_sequence(
                browser,
                name="buyer-sw-block",
                service_workers="block",
                routes=BUYER_ROUTES,
                account_email="buyer@estatepro.test",
            )
        )
        browser.close()

    report = {
        "baseUrl": BASE_URL,
        "generatedAt": time.time(),
        "scenarios": scenarios,
    }
    (ARTIFACT_DIR / "report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    hydration_errors = [
        error
        for scenario in scenarios
        for route in scenario["routes"]
        for error in route["errors"]
        if "hydration" in error["message"].lower()
        or "server rendered html" in error["message"].lower()
        or "Minified React error #418" in error["message"]
    ]
    print(f"Hydration errors captured: {len(hydration_errors)}")
    return 1 if hydration_errors else 0


if __name__ == "__main__":
    sys.exit(main())
