from __future__ import annotations

import json
import os
import re
import sys
import time
import traceback
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable
from urllib.parse import urlparse

from playwright.sync_api import (
    APIResponse,
    Browser,
    BrowserContext,
    Page,
    Response,
    sync_playwright,
)

BASE_URL = os.environ.get("E2E_BASE_URL", "http://127.0.0.1:3000").rstrip("/")
DEMO_PASSWORD = os.environ.get("E2E_PASSWORD", "DemoPass!2026")
CRON_SECRET = os.environ.get("CRON_SECRET", "estatepro-e2e-cron-secret-2026")
ARTIFACT_DIR = Path(os.environ.get("E2E_ARTIFACT_DIR", "artifacts/e2e-playwright"))
SCREENSHOT_DIR = ARTIFACT_DIR / "screenshots"

ACCOUNTS = {
    "buyer": {"email": "buyer@estatepro.test", "role": "user"},
    "agent": {"email": "agent@estatepro.test", "role": "agent"},
    "admin": {"email": "admin@estatepro.test", "role": "admin"},
    "unverified": {"email": "unverified@estatepro.test", "role": "user"},
}

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

ACCOUNT_APIS = [
    "/api/account/favorites",
    "/api/account/comparison",
    "/api/account/listings",
    "/api/account/notifications",
    "/api/account/property-alerts",
    "/api/account/saved-searches",
]

ACCOUNT_ROUTES = {
    "buyer": [
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
    ],
    "agent": [
        "/dashboard",
        "/my-listings",
        "/list-property",
        "/messaging",
        "/notifications",
        "/settings",
    ],
    "admin-account": ["/dashboard", "/notifications", "/settings"],
    "unverified": ["/dashboard", "/favorites", "/settings"],
}

PRIVATE_PROPERTY_IDS = {
    "property-archived",
    "property-changes_requested",
    "property-draft",
    "property-pending_review",
    "property-rejected",
    "property-scheduled",
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def slug(value: str) -> str:
    normalized = re.sub(r"[^a-zA-Z0-9._-]+", "-", value.strip("/"))
    return normalized.strip("-") or "root"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def response_json(response: APIResponse) -> Any:
    try:
        return response.json()
    except Exception as error:  # pragma: no cover - diagnostic path
        body = response.text()
        raise AssertionError(
            f"{response.request.method} {response.url} did not return JSON: {body[:500]}"
        ) from error


def require_status(response: APIResponse, expected: int | set[int], label: str) -> None:
    allowed = {expected} if isinstance(expected, int) else expected
    if response.status not in allowed:
        body = response.text()
        raise AssertionError(
            f"{label} returned {response.status}, expected {sorted(allowed)}: {body[:800]}"
        )


class AcceptanceSuite:
    def __init__(self) -> None:
        self.started_at = utc_now()
        self.checks: list[dict[str, Any]] = []
        ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
        SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

    def check(
        self,
        persona: str,
        name: str,
        function: Callable[[], Any],
    ) -> tuple[bool, Any | None]:
        started = time.perf_counter()
        try:
            details = function()
            duration_ms = round((time.perf_counter() - started) * 1000)
            self.checks.append(
                {
                    "persona": persona,
                    "name": name,
                    "status": "passed",
                    "durationMs": duration_ms,
                    "details": details,
                }
            )
            print(f"PASS [{persona}] {name}")
            return True, details
        except Exception as error:
            duration_ms = round((time.perf_counter() - started) * 1000)
            diagnostic = "".join(
                traceback.format_exception(type(error), error, error.__traceback__)
            )
            self.checks.append(
                {
                    "persona": persona,
                    "name": name,
                    "status": "failed",
                    "durationMs": duration_ms,
                    "error": str(error),
                    "traceback": diagnostic,
                }
            )
            print(f"FAIL [{persona}] {name}: {error}")
            return False, None

    def finish(self) -> int:
        passed = sum(check["status"] == "passed" for check in self.checks)
        failed = len(self.checks) - passed
        report = {
            "suite": "EstatePro Playwright multi-role acceptance",
            "baseUrl": BASE_URL,
            "startedAt": self.started_at,
            "finishedAt": utc_now(),
            "summary": {
                "total": len(self.checks),
                "passed": passed,
                "failed": failed,
            },
            "checks": self.checks,
        }
        (ARTIFACT_DIR / "report.json").write_text(
            json.dumps(report, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

        lines = [
            "# EstatePro E2E acceptance",
            "",
            f"- Base URL: `{BASE_URL}`",
            f"- Passed: **{passed}**",
            f"- Failed: **{failed}**",
            "",
        ]
        for check in self.checks:
            marker = "✅" if check["status"] == "passed" else "❌"
            lines.append(f"- {marker} **{check['persona']}** — {check['name']}")
            if check["status"] == "failed":
                lines.append(f"  - `{check.get('error', 'unknown failure')}`")
        (ARTIFACT_DIR / "report.md").write_text("\n".join(lines), encoding="utf-8")

        print(f"\nEstatePro E2E: {passed}/{len(self.checks)} passed; {failed} failed")
        print(f"Report: {ARTIFACT_DIR / 'report.json'}")
        return 1 if failed else 0


class RuntimeSignals:
    def __init__(self, page: Page) -> None:
        self.page = page
        self.page_errors: list[str] = []
        self.server_errors: list[str] = []
        self.critical_console_errors: list[str] = []
        self.request_failures: list[str] = []
        page.on("pageerror", self._on_page_error)
        page.on("response", self._on_response)
        page.on("console", self._on_console)
        page.on("requestfailed", self._on_request_failed)

    def reset(self) -> None:
        self.page_errors.clear()
        self.server_errors.clear()
        self.critical_console_errors.clear()
        self.request_failures.clear()

    def _on_page_error(self, error: Any) -> None:
        message = getattr(error, "message", str(error))
        stack = getattr(error, "stack", None)
        self.page_errors.append(f"{message}\n{stack}" if stack else message)

    def _on_response(self, response: Response) -> None:
        if response.url.startswith(BASE_URL) and response.status >= 500:
            self.server_errors.append(f"{response.status} {response.url}")

    def _on_console(self, message: Any) -> None:
        if message.type != "error":
            return
        text = message.text
        critical_markers = (
            "Application error",
            "Hydration failed",
            "Minified React error #418",
            "Internal Server Error",
        )
        if any(marker in text for marker in critical_markers):
            self.critical_console_errors.append(text)

    def _on_request_failed(self, request: Any) -> None:
        if request.url.startswith(BASE_URL):
            self.request_failures.append(
                f"{request.method} {request.url}: {request.failure}"
            )

    def assert_clean(self, label: str) -> dict[str, Any]:
        failures = {
            "pageErrors": list(self.page_errors),
            "serverErrors": list(self.server_errors),
            "criticalConsoleErrors": list(self.critical_console_errors),
            "requestFailures": list(self.request_failures),
        }
        active = {key: value for key, value in failures.items() if value}
        require(not active, f"{label} runtime failures: {json.dumps(active, ensure_ascii=False)}")
        return failures


def create_context(browser: Browser, *, mobile: bool = False) -> BrowserContext:
    if mobile:
        return browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
            locale="en-US",
        )
    return browser.new_context(viewport={"width": 1440, "height": 1000}, locale="en-US")


def install_external_stubs(context: BrowserContext) -> None:
    # OpenStreetMap's embedded frame has occasionally raised a script exception
    # inside the third-party frame during CI. Keep the iframe URL in the DOM, but
    # stub its remote document so the acceptance suite measures EstatePro code.
    context.route(
        "https://www.openstreetmap.org/**",
        lambda route: route.fulfill(
            status=200,
            content_type="text/html",
            body="<!doctype html><html><body></body></html>",
        ),
    )


def visit(
    page: Page,
    signals: RuntimeSignals,
    path: str,
    persona: str,
    *,
    expected_text: str | None = None,
    screenshot: bool = True,
) -> dict[str, Any]:
    signals.reset()
    response = page.goto(f"{BASE_URL}{path}", wait_until="domcontentloaded")
    require(response is not None, f"No document response for {path}")
    require(response.status < 400, f"{path} returned {response.status}")
    page.locator("body").wait_for(state="visible")
    page.wait_for_timeout(700)
    body_text = page.locator("body").inner_text()
    require(
        not re.search(
            r"Application error|Internal Server Error|This page could not be found",
            body_text,
            re.IGNORECASE,
        ),
        f"{path} rendered an application error",
    )
    if expected_text:
        require(expected_text in body_text, f"{path} is missing expected text: {expected_text}")

    runtime = signals.assert_clean(f"{persona} {path}")
    screenshot_path = None
    if screenshot:
        target = SCREENSHOT_DIR / persona / f"{slug(path)}.jpg"
        target.parent.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(target), type="jpeg", quality=65, full_page=True)
        screenshot_path = str(target)

    return {
        "path": path,
        "statusCode": response.status,
        "finalUrl": page.url,
        "title": page.title(),
        "bodyLength": len(body_text),
        "runtime": runtime,
        "screenshot": screenshot_path,
    }


def context_request(
    context: BrowserContext,
    method: str,
    path: str,
    *,
    data: dict[str, Any] | None = None,
    headers: dict[str, str] | None = None,
) -> APIResponse:
    request_headers = dict(headers or {})
    payload: str | None = None
    if data is not None:
        request_headers.setdefault("Content-Type", "application/json")
        payload = json.dumps(data, ensure_ascii=False)
    return context.request.fetch(
        f"{BASE_URL}{path}",
        method=method,
        headers=request_headers,
        data=payload,
        fail_on_status_code=False,
    )


def login_user(page: Page, context: BrowserContext, email: str) -> dict[str, Any]:
    page.goto(f"{BASE_URL}/", wait_until="domcontentloaded")
    page.get_by_role("button", name=re.compile(r"^sign in$", re.IGNORECASE)).first.click()
    email_input = page.locator("#login-email")
    password_input = page.locator("#login-password")
    email_input.wait_for(state="visible")
    email_input.fill(email)
    password_input.fill(DEMO_PASSWORD)

    form = email_input.locator("xpath=ancestor::form")
    with page.expect_response(
        lambda response: "/api/auth/callback/credentials" in response.url
        and response.request.method == "POST"
    ) as callback_info:
        form.get_by_role("button", name="Sign In", exact=True).click()
    callback = callback_info.value
    require(callback.status < 400, f"Credentials callback returned {callback.status}")
    email_input.wait_for(state="hidden")

    me_response = context_request(context, "GET", "/api/auth/me")
    require_status(me_response, 200, "GET /api/auth/me")
    payload = response_json(me_response)
    require(payload.get("user", {}).get("email") == email, "Authenticated account email mismatch")
    return payload["user"]


def login_admin(page: Page, context: BrowserContext) -> dict[str, Any]:
    page.goto(f"{BASE_URL}/admin", wait_until="domcontentloaded")
    email_input = page.locator("#admin-email")
    password_input = page.locator("#admin-password")
    email_input.wait_for(state="visible")

    email_input.fill(ACCOUNTS["agent"]["email"])
    password_input.fill(DEMO_PASSWORD)
    with page.expect_response(
        lambda response: "/api/admin/login" in response.url
        and response.request.method == "POST"
    ) as rejected_info:
        email_input.locator("xpath=ancestor::form").get_by_role(
            "button", name="Sign In", exact=True
        ).click()
    require(rejected_info.value.status == 401, "Agent credentials crossed the admin boundary")

    email_input.fill(ACCOUNTS["admin"]["email"])
    password_input.fill(DEMO_PASSWORD)
    with page.expect_response(
        lambda response: "/api/admin/login" in response.url
        and response.request.method == "POST"
    ) as accepted_info:
        email_input.locator("xpath=ancestor::form").get_by_role(
            "button", name="Sign In", exact=True
        ).click()
    require(accepted_info.value.status == 200, "Administrator login was rejected")
    page.get_by_role("heading", name="Overview", exact=True).wait_for(state="visible")

    me_response = context_request(context, "GET", "/api/admin/me")
    require_status(me_response, 200, "GET /api/admin/me")
    payload = response_json(me_response)
    require(payload.get("user", {}).get("role") == "admin", "Admin session role mismatch")
    return payload["user"]


def extract_properties(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        for key in ("properties", "data", "results", "items"):
            value = payload.get(key)
            if isinstance(value, list):
                return value
    return []


def property_payload(title: str) -> dict[str, Any]:
    return {
        "titleEn": title,
        "titleAr": "عقار اختبار شامل",
        "descriptionEn": "A complete disposable listing created by the EstatePro browser acceptance suite.",
        "descriptionAr": "عقار مكتمل تم إنشاؤه بواسطة اختبار القبول الشامل لتطبيق إيستيت برو.",
        "price": 425000,
        "type": "Villa",
        "status": "sale",
        "bedrooms": 4,
        "bathrooms": 3,
        "area": 320,
        "locationEn": "Baghdad, Iraq",
        "locationAr": "بغداد، العراق",
        "addressEn": "E2E Acceptance Street 12",
        "addressAr": "شارع اختبار القبول ١٢",
        "cityEn": "Baghdad",
        "cityAr": "بغداد",
        "images": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
        "features": "Garden,Parking,Security",
        "yearBuilt": 2024,
        "parking": 2,
        "featured": False,
        "badge": None,
        "lat": 33.3152,
        "lng": 44.3661,
        "virtualTourUrl": None,
        "virtualTourImages": None,
        "agentId": None,
    }


def main() -> int:
    suite = AcceptanceSuite()

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)

        guest_context = create_context(browser)
        install_external_stubs(guest_context)
        guest_page = guest_context.new_page()
        guest_signals = RuntimeSignals(guest_page)

        for path in PUBLIC_ROUTES:
            suite.check(
                "guest",
                f"public route {path}",
                lambda path=path: visit(guest_page, guest_signals, path, "guest"),
            )

        suite.check(
            "guest",
            "contact page keeps an OpenStreetMap embed",
            lambda: {
                "src": (
                    guest_page.goto(f"{BASE_URL}/contact", wait_until="domcontentloaded")
                    and guest_page.locator('iframe[src*="openstreetmap.org"]').get_attribute("src")
                )
                or (_ for _ in ()).throw(AssertionError("OpenStreetMap iframe is missing"))
            },
        )

        def published_inventory_check() -> dict[str, Any]:
            default_response = context_request(guest_context, "GET", "/api/properties")
            require_status(default_response, 200, "GET /api/properties")
            default_payload = response_json(default_response)
            default_properties = extract_properties(default_payload)
            require(default_properties, "Default property API returned no inventory")

            response = context_request(guest_context, "GET", "/api/properties?limit=100")
            require_status(response, 200, "GET /api/properties?limit=100")
            payload = response_json(response)
            properties = extract_properties(payload)
            require(properties, "Published inventory is empty")
            for property_record in properties:
                property_id = property_record.get("id")
                require(property_id not in PRIVATE_PROPERTY_IDS, f"Private listing leaked: {property_id}")
                if property_record.get("listingStatus"):
                    require(
                        property_record["listingStatus"] == "published",
                        f"Non-published listing leaked: {property_id}",
                    )

            second_page = context_request(
                guest_context, "GET", "/api/properties?page=2&limit=1"
            )
            require_status(second_page, 200, "GET /api/properties?page=2&limit=1")
            return {
                "defaultCount": len(default_properties),
                "fullCount": len(properties),
                "secondPage": response_json(second_page),
            }

        suite.check("guest", "published-only property API and pagination", published_inventory_check)

        for property_id in sorted(PRIVATE_PROPERTY_IDS):
            suite.check(
                "guest",
                f"private listing {property_id} stays hidden",
                lambda property_id=property_id: (
                    (lambda response: (
                        require_status(response, 404, f"GET /api/properties/{property_id}"),
                        {"status": response.status},
                    )[1])(
                        context_request(
                            guest_context, "GET", f"/api/properties/{property_id}"
                        )
                    )
                ),
            )

        for path in [
            "/api/auth/me",
            *ACCOUNT_APIS,
            "/api/admin/me",
            "/api/admin/overview",
            "/api/cron/publish-listings",
            "/api/cron/property-alerts",
        ]:
            suite.check(
                "guest",
                f"protected endpoint rejects {path}",
                lambda path=path: (
                    (lambda response: (
                        require_status(response, 401, f"GET {path}"),
                        {"status": response.status},
                    )[1])(context_request(guest_context, "GET", path))
                ),
            )

        suite.check(
            "guest",
            "property creation requires authentication",
            lambda: (
                (lambda response: (
                    require_status(response, 401, "POST /api/properties"),
                    {"status": response.status},
                )[1])(
                    context_request(
                        guest_context,
                        "POST",
                        "/api/properties",
                        data=property_payload("Unauthorized E2E Listing"),
                    )
                )
            ),
        )

        suite.check(
            "guest",
            "contact message persists",
            lambda: (
                (lambda response: (
                    require_status(response, 201, "POST /api/contact"),
                    response_json(response),
                )[1])(
                    context_request(
                        guest_context,
                        "POST",
                        "/api/contact",
                        data={
                            "name": "EstatePro E2E",
                            "email": "e2e-contact@estatepro.test",
                            "phone": "+964 770 000 0000",
                            "subject": "Browser acceptance",
                            "message": "This message verifies the contact persistence flow.",
                        },
                    )
                )
            ),
        )

        buyer_context = create_context(browser)
        install_external_stubs(buyer_context)
        buyer_page = buyer_context.new_page()
        buyer_signals = RuntimeSignals(buyer_page)
        buyer_ok, buyer_user = suite.check(
            "buyer-ui",
            "sign in through dialog",
            lambda: login_user(buyer_page, buyer_context, ACCOUNTS["buyer"]["email"]),
        )
        if buyer_ok:
            require(isinstance(buyer_user, dict), "Buyer login did not return a user")
            suite.check(
                "buyer",
                "credentials session has user role",
                lambda: (
                    require(buyer_user.get("role") == "user", "Buyer role mismatch"),
                    buyer_user,
                )[1],
            )
            for path in ACCOUNT_APIS:
                suite.check(
                    "buyer",
                    f"account API loads {path}",
                    lambda path=path: (
                        (lambda response: (
                            require_status(response, 200, f"GET {path}"),
                            response_json(response),
                        )[1])(context_request(buyer_context, "GET", path))
                    ),
                )
            for path in ACCOUNT_ROUTES["buyer"]:
                suite.check(
                    "buyer",
                    f"account route {path}",
                    lambda path=path: visit(
                        buyer_page, buyer_signals, path, "buyer"
                    ),
                )

            def favorite_round_trip() -> dict[str, Any]:
                before_response = context_request(
                    buyer_context, "GET", "/api/account/favorites"
                )
                require_status(before_response, 200, "GET /api/account/favorites")
                before = response_json(before_response).get("favorites", [])
                require(isinstance(before, list), "Favorites payload is not a list")
                candidate = "property-published"
                changed = (
                    [property_id for property_id in before if property_id != candidate]
                    if candidate in before
                    else [candidate, *before]
                )
                require(changed != before, "Favorite mutation did not change state")
                try:
                    update = context_request(
                        buyer_context,
                        "PUT",
                        "/api/account/favorites",
                        data={"ids": changed},
                    )
                    require_status(update, 200, "PUT /api/account/favorites")
                    require(response_json(update).get("favorites") == changed, "Favorite update mismatch")
                    persisted = context_request(
                        buyer_context, "GET", "/api/account/favorites"
                    )
                    require_status(persisted, 200, "GET persisted favorites")
                    require(
                        response_json(persisted).get("favorites") == changed,
                        "Favorite state was not persisted",
                    )
                finally:
                    restore = context_request(
                        buyer_context,
                        "PUT",
                        "/api/account/favorites",
                        data={"ids": before},
                    )
                    require_status(restore, 200, "restore favorites")
                return {"before": before, "mutated": changed, "restored": True}

            suite.check("buyer", "favorite persistence round trip", favorite_round_trip)

            suite.check(
                "buyer",
                "buyer cannot publish through staff endpoint",
                lambda: (
                    (lambda response: (
                        require_status(response, 403, "buyer POST /api/properties"),
                        {"status": response.status},
                    )[1])(
                        context_request(
                            buyer_context,
                            "POST",
                            "/api/properties",
                            data=property_payload("Buyer Must Not Publish"),
                        )
                    )
                ),
            )

        agent_context = create_context(browser)
        install_external_stubs(agent_context)
        agent_page = agent_context.new_page()
        agent_signals = RuntimeSignals(agent_page)
        agent_ok, agent_user = suite.check(
            "agent",
            "credentials session",
            lambda: login_user(agent_page, agent_context, ACCOUNTS["agent"]["email"]),
        )
        created_property: dict[str, Any] | None = None
        if agent_ok:
            require(isinstance(agent_user, dict), "Agent login did not return a user")
            suite.check(
                "agent",
                "credentials session has agent role",
                lambda: (
                    require(agent_user.get("role") == "agent", "Agent role mismatch"),
                    agent_user,
                )[1],
            )
            for path in ACCOUNT_ROUTES["agent"]:
                suite.check(
                    "agent",
                    f"workspace route {path}",
                    lambda path=path: visit(
                        agent_page, agent_signals, path, "agent"
                    ),
                )

            def create_agent_listing() -> dict[str, Any]:
                title = f"E2E Agent Listing {int(time.time())}"
                response = context_request(
                    agent_context,
                    "POST",
                    "/api/properties",
                    data=property_payload(title),
                )
                require_status(response, 201, "agent POST /api/properties")
                property_record = response_json(response)
                require(property_record.get("id"), "Created listing has no ID")
                require(
                    property_record.get("listingStatus") == "pending_review",
                    "Agent listing was not submitted for review",
                )
                return property_record

            created_ok, created_details = suite.check(
                "agent", "create and submit listing", create_agent_listing
            )
            if created_ok:
                require(isinstance(created_details, dict), "Created listing payload is invalid")
                created_property = created_details
                property_id = created_property["id"]
                property_title = created_property["titleEn"]
                suite.check(
                    "agent",
                    "owner can preview pending listing",
                    lambda: (
                        (lambda response: (
                            require_status(
                                response, 200, f"GET /api/properties/{property_id} as owner"
                            ),
                            response_json(response),
                        )[1])(
                            context_request(
                                agent_context, "GET", f"/api/properties/{property_id}"
                            )
                        )
                    ),
                )
                suite.check(
                    "agent",
                    "pending listing page renders for owner",
                    lambda: visit(
                        agent_page,
                        agent_signals,
                        f"/properties/{property_id}",
                        "agent",
                        expected_text=property_title,
                    ),
                )
                suite.check(
                    "guest",
                    "new pending listing remains private",
                    lambda: (
                        (lambda response: (
                            require_status(
                                response, 404, f"guest GET /api/properties/{property_id}"
                            ),
                            {"status": response.status},
                        )[1])(
                            context_request(
                                guest_context, "GET", f"/api/properties/{property_id}"
                            )
                        )
                    ),
                )

            suite.check(
                "agent",
                "agent cannot call admin API",
                lambda: (
                    (lambda response: (
                        require_status(response, 401, "agent GET /api/admin/overview"),
                        {"status": response.status},
                    )[1])(
                        context_request(agent_context, "GET", "/api/admin/overview")
                    )
                ),
            )

        unverified_context = create_context(browser)
        install_external_stubs(unverified_context)
        unverified_page = unverified_context.new_page()
        unverified_signals = RuntimeSignals(unverified_page)
        unverified_ok, unverified_user = suite.check(
            "unverified",
            "seeded unverified account follows current sign-in flow",
            lambda: login_user(
                unverified_page,
                unverified_context,
                ACCOUNTS["unverified"]["email"],
            ),
        )
        if unverified_ok:
            require(isinstance(unverified_user, dict), "Unverified login payload is invalid")
            for path in ACCOUNT_ROUTES["unverified"]:
                suite.check(
                    "unverified",
                    f"account route {path}",
                    lambda path=path: visit(
                        unverified_page, unverified_signals, path, "unverified"
                    ),
                )

        registration_email = f"e2e-{int(time.time())}@estatepro.test"

        def register_new_user() -> dict[str, Any]:
            response = context_request(
                guest_context,
                "POST",
                "/api/auth/register",
                data={
                    "name": "E2E Registered User",
                    "email": registration_email,
                    "password": DEMO_PASSWORD,
                },
            )
            require_status(response, {200, 201}, "POST /api/auth/register")
            return response_json(response)

        registered_ok, _ = suite.check("new-user", "register account", register_new_user)
        if registered_ok:
            new_user_context = create_context(browser)
            install_external_stubs(new_user_context)
            new_user_page = new_user_context.new_page()
            new_user_signals = RuntimeSignals(new_user_page)
            new_login_ok, _ = suite.check(
                "new-user",
                "authenticate registered account",
                lambda: login_user(new_user_page, new_user_context, registration_email),
            )
            if new_login_ok:
                suite.check(
                    "new-user",
                    "registered account dashboard",
                    lambda: visit(
                        new_user_page,
                        new_user_signals,
                        "/dashboard",
                        "new-user",
                    ),
                )
            new_user_context.close()

        admin_context = create_context(browser)
        install_external_stubs(admin_context)
        admin_page = admin_context.new_page()
        admin_signals = RuntimeSignals(admin_page)
        admin_ok, admin_user = suite.check(
            "admin", "secure admin session and role guard", lambda: login_admin(admin_page, admin_context)
        )
        if admin_ok:
            require(isinstance(admin_user, dict), "Admin login payload is invalid")
            for path in [
                "/api/admin/overview",
                "/api/admin/listings",
                "/api/admin/agents",
                "/api/admin/settings",
                "/api/admin/property-types",
                "/api/admin/neighborhoods",
                "/api/admin/testimonials",
                "/api/admin/market-data",
            ]:
                suite.check(
                    "admin",
                    f"admin API loads {path}",
                    lambda path=path: (
                        (lambda response: (
                            require_status(response, 200, f"GET {path}"),
                            response_json(response),
                        )[1])(context_request(admin_context, "GET", path))
                    ),
                )

            suite.check(
                "admin",
                "admin route /admin",
                lambda: visit(admin_page, admin_signals, "/admin", "admin"),
            )
            suite.check(
                "admin",
                "admin route /admin/moderation",
                lambda: visit(
                    admin_page,
                    admin_signals,
                    "/admin/moderation",
                    "admin",
                    expected_text="Listing moderation",
                ),
            )

            if created_property:
                property_id = created_property["id"]
                property_title = created_property["titleEn"]

                def approve_listing() -> dict[str, Any]:
                    response = context_request(
                        admin_context,
                        "POST",
                        f"/api/admin/listings/{property_id}/moderate",
                        data={
                            "action": "approve",
                            "reviewNotes": "Approved by the disposable E2E acceptance suite.",
                        },
                    )
                    require_status(response, 200, "admin approve listing")
                    payload = response_json(response)
                    require(
                        payload.get("listing", {}).get("listingStatus") == "published",
                        "Moderation did not publish the listing",
                    )
                    return payload

                approved_ok, _ = suite.check("admin", "approve agent listing", approve_listing)
                if approved_ok:
                    suite.check(
                        "guest",
                        "approved listing is public through API",
                        lambda: (
                            (lambda response: (
                                require_status(
                                    response, 200, f"GET /api/properties/{property_id}"
                                ),
                                response_json(response),
                            )[1])(
                                context_request(
                                    guest_context, "GET", f"/api/properties/{property_id}"
                                )
                            )
                        ),
                    )
                    suite.check(
                        "guest",
                        "approved listing page renders",
                        lambda: visit(
                            guest_page,
                            guest_signals,
                            f"/properties/{property_id}",
                            "guest",
                            expected_text=property_title,
                        ),
                    )

                    if buyer_ok:
                        def favorite_approved_listing() -> dict[str, Any]:
                            before_response = context_request(
                                buyer_context, "GET", "/api/account/favorites"
                            )
                            require_status(before_response, 200, "GET buyer favorites")
                            before = response_json(before_response).get("favorites", [])
                            changed = [property_id, *[item for item in before if item != property_id]]
                            try:
                                update = context_request(
                                    buyer_context,
                                    "PUT",
                                    "/api/account/favorites",
                                    data={"ids": changed},
                                )
                                require_status(update, 200, "favorite approved listing")
                                visit(
                                    buyer_page,
                                    buyer_signals,
                                    "/favorites",
                                    "buyer",
                                    expected_text=property_title,
                                )
                            finally:
                                restore = context_request(
                                    buyer_context,
                                    "PUT",
                                    "/api/account/favorites",
                                    data={"ids": before},
                                )
                                require_status(restore, 200, "restore buyer favorites")
                            return {"propertyId": property_id, "restored": True}

                        suite.check(
                            "buyer",
                            "favorites page renders approved listing",
                            favorite_approved_listing,
                        )

                    suite.check(
                        "agent",
                        "moderation notification is visible",
                        lambda: (
                            (lambda response: (
                                require_status(
                                    response, 200, "GET agent notifications"
                                ),
                                (
                                    lambda payload: (
                                        require(
                                            property_title in json.dumps(payload, ensure_ascii=False)
                                            or "Listing review update"
                                            in json.dumps(payload, ensure_ascii=False),
                                            "Agent did not receive a moderation notification",
                                        ),
                                        payload,
                                    )[1]
                                )(response_json(response)),
                            )[1])(
                                context_request(
                                    agent_context,
                                    "GET",
                                    "/api/account/notifications",
                                )
                            )
                        ),
                    )

        def authorized_worker(path: str) -> dict[str, Any]:
            response = context_request(
                guest_context,
                "POST",
                path,
                headers={"Authorization": f"Bearer {CRON_SECRET}"},
            )
            require_status(response, 200, f"POST {path}")
            payload = response_json(response)
            require(payload.get("success") is True, f"{path} reported a worker failure")
            return payload

        publish_ok, _ = suite.check(
            "worker",
            "publish due scheduled listings",
            lambda: authorized_worker("/api/cron/publish-listings"),
        )
        if publish_ok:
            suite.check(
                "guest",
                "scheduled fixture becomes public after worker run",
                lambda: (
                    (lambda response: (
                        require_status(
                            response, 200, "GET /api/properties/property-scheduled"
                        ),
                        (
                            lambda payload: (
                                require(
                                    payload.get("listingStatus") == "published",
                                    "Scheduled listing was not published",
                                ),
                                payload,
                            )[1]
                        )(response_json(response)),
                    )[1])(
                        context_request(
                            guest_context,
                            "GET",
                            "/api/properties/property-scheduled",
                        )
                    )
                ),
            )

        suite.check(
            "worker",
            "process due property alerts",
            lambda: authorized_worker("/api/cron/property-alerts"),
        )

        mobile_guest_context = create_context(browser, mobile=True)
        install_external_stubs(mobile_guest_context)
        mobile_guest_page = mobile_guest_context.new_page()
        mobile_guest_signals = RuntimeSignals(mobile_guest_page)
        suite.check(
            "mobile-guest",
            "responsive route /",
            lambda: visit(
                mobile_guest_page,
                mobile_guest_signals,
                "/",
                "mobile-guest",
            ),
        )
        suite.check(
            "mobile-guest",
            "navigation menu and RTL switch",
            lambda: (
                mobile_guest_page.get_by_role("button", name="Menu").click(),
                mobile_guest_page.get_by_role(
                    "navigation", name="Mobile navigation"
                ).wait_for(state="visible"),
                mobile_guest_page.get_by_role("button", name=re.compile("العربية")).click(),
                mobile_guest_page.locator("html").wait_for(state="attached"),
                require(
                    mobile_guest_page.locator("html").get_attribute("dir") == "rtl",
                    "Mobile language switch did not enable RTL",
                ),
                {"dir": mobile_guest_page.locator("html").get_attribute("dir")},
            )[-1],
        )

        mobile_buyer_context = create_context(browser, mobile=True)
        install_external_stubs(mobile_buyer_context)
        mobile_buyer_page = mobile_buyer_context.new_page()
        mobile_buyer_signals = RuntimeSignals(mobile_buyer_page)
        mobile_buyer_ok, _ = suite.check(
            "mobile-buyer",
            "credentials session",
            lambda: login_user(
                mobile_buyer_page,
                mobile_buyer_context,
                ACCOUNTS["buyer"]["email"],
            ),
        )
        if mobile_buyer_ok:
            suite.check(
                "mobile-buyer",
                "responsive dashboard",
                lambda: visit(
                    mobile_buyer_page,
                    mobile_buyer_signals,
                    "/dashboard",
                    "mobile-buyer",
                ),
            )
            suite.check(
                "mobile-buyer",
                "dashboard has no horizontal overflow",
                lambda: (
                    require(
                        mobile_buyer_page.evaluate(
                            "document.documentElement.scrollWidth <= document.documentElement.clientWidth"
                        ),
                        "Dashboard overflows horizontally on mobile",
                    ),
                    {
                        "scrollWidth": mobile_buyer_page.evaluate(
                            "document.documentElement.scrollWidth"
                        ),
                        "clientWidth": mobile_buyer_page.evaluate(
                            "document.documentElement.clientWidth"
                        ),
                    },
                )[1],
            )

        for context in [
            mobile_buyer_context,
            mobile_guest_context,
            admin_context,
            unverified_context,
            agent_context,
            buyer_context,
            guest_context,
        ]:
            context.close()
        browser.close()

    return suite.finish()


if __name__ == "__main__":
    sys.exit(main())
