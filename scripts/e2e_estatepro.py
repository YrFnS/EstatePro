#!/usr/bin/env python3
"""End-to-end browser and API acceptance suite for EstatePro.

The suite is intentionally safe for CI: it expects a disposable seeded database,
uses only the application's public HTTP surface, and stores screenshots plus a
machine-readable report under artifacts/e2e.
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable
from urllib.parse import urlparse

from playwright.sync_api import (
    APIResponse,
    Browser,
    BrowserContext,
    Page,
    Playwright,
    sync_playwright,
)

BASE_URL = os.environ.get("E2E_BASE_URL", "http://127.0.0.1:3000").rstrip("/")
PASSWORD = os.environ.get("E2E_PASSWORD", "EstatePro123!")
ARTIFACT_ROOT = Path(os.environ.get("E2E_ARTIFACT_DIR", "artifacts/e2e"))
SCREENSHOT_ROOT = ARTIFACT_ROOT / "screenshots"
DEFAULT_TIMEOUT_MS = int(os.environ.get("E2E_TIMEOUT_MS", "45000"))
SETTLE_MS = int(os.environ.get("E2E_SETTLE_MS", "1800"))

USERS = {
    "buyer": {"email": "buyer@estatepro.test", "role": "user"},
    "agent": {"email": "agent@estatepro.test", "role": "agent"},
    "unverified": {"email": "unverified@estatepro.test", "role": "user"},
}
ADMIN = {"email": "admin@estatepro.test", "role": "admin"}

PUBLIC_ROUTES: list[tuple[str, tuple[str, ...]]] = [
    ("/", ("EstatePro",)),
    ("/properties", ("Properties",)),
    ("/properties/property-published", ("published demo home",)),
    ("/agents", ("Agents",)),
    ("/agents/agent-omar", ("Omar Al-Hassan",)),
    ("/about", ("About",)),
    ("/contact", ("Contact",)),
    ("/market-insights", ("Market",)),
    ("/neighborhood-guide", ("Neighborhood",)),
    ("/calculator", ("Calculator",)),
    ("/valuation", ("Valuation",)),
    ("/commute", ("Commute",)),
    ("/ai-recommend", ("AI",)),
    ("/compare", ("Compare",)),
]

BUYER_ROUTES = [
    "/dashboard",
    "/favorites",
    "/compare",
    "/saved-searches",
    "/property-alerts",
    "/notifications",
    "/messaging",
    "/my-tours",
    "/settings",
    "/my-listings",
    "/list-property",
]

AGENT_ROUTES = [
    "/dashboard",
    "/my-listings",
    "/list-property",
    "/messaging",
    "/notifications",
    "/settings",
]

ACCOUNT_APIS = [
    "/api/account/favorites",
    "/api/account/comparison",
    "/api/account/saved-searches",
    "/api/account/notifications",
    "/api/account/property-alerts",
    "/api/account/listings",
]

FATAL_PAGE_MARKERS = (
    "application error: a client-side exception has occurred",
    "internal server error",
    "this page could not be found",
    "page not found",
    "unexpected application error",
)

CRITICAL_CONSOLE_MARKERS = (
    "hydration failed",
    "minified react error",
    "uncaught error",
    "unhandled runtime error",
    "application error",
)

ARTIFACT_ROOT.mkdir(parents=True, exist_ok=True)
SCREENSHOT_ROOT.mkdir(parents=True, exist_ok=True)

CHECKS: list[dict[str, Any]] = []
STATE: dict[str, Any] = {}


class CheckFailure(AssertionError):
    def __init__(self, message: str, details: dict[str, Any] | None = None):
        super().__init__(message)
        self.details = details or {}


def expect(condition: bool, message: str, details: dict[str, Any] | None = None) -> None:
    if not condition:
        raise CheckFailure(message, details)


def response_json(response: APIResponse) -> Any:
    try:
        return response.json()
    except Exception:
        try:
            return {"raw": response.text()[:2000]}
        except Exception:
            return {"raw": "<unreadable response>"}


def api_request(
    context: BrowserContext,
    method: str,
    path: str,
    *,
    data: Any | None = None,
    form: dict[str, Any] | None = None,
    headers: dict[str, str] | None = None,
) -> tuple[APIResponse, Any]:
    url = f"{BASE_URL}{path}"
    request_method = getattr(context.request, method.lower())
    kwargs: dict[str, Any] = {}
    if data is not None:
        kwargs["data"] = data
    if form is not None:
        kwargs["form"] = form
    if headers is not None:
        kwargs["headers"] = headers
    response = request_method(url, **kwargs)
    return response, response_json(response)


def record_check(
    persona: str,
    name: str,
    operation: Callable[[], dict[str, Any] | None],
) -> bool:
    started = time.perf_counter()
    try:
        details = operation() or {}
        result = {
            "persona": persona,
            "name": name,
            "status": "passed",
            "durationMs": round((time.perf_counter() - started) * 1000),
            "details": details,
        }
        CHECKS.append(result)
        print(f"PASS [{persona}] {name}")
        return True
    except CheckFailure as error:
        result = {
            "persona": persona,
            "name": name,
            "status": "failed",
            "durationMs": round((time.perf_counter() - started) * 1000),
            "error": str(error),
            "details": error.details,
        }
        CHECKS.append(result)
        print(f"FAIL [{persona}] {name}: {error}")
        return False
    except Exception as error:  # pragma: no cover - defensive test reporting
        result = {
            "persona": persona,
            "name": name,
            "status": "failed",
            "durationMs": round((time.perf_counter() - started) * 1000),
            "error": f"{type(error).__name__}: {error}",
            "details": {},
        }
        CHECKS.append(result)
        print(f"FAIL [{persona}] {name}: {type(error).__name__}: {error}")
        return False


def slug(value: str) -> str:
    normalized = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return normalized or "root"


def same_origin(url: str) -> bool:
    return urlparse(url).netloc == urlparse(BASE_URL).netloc


def observe_page(page: Page) -> dict[str, list[Any]]:
    signals: dict[str, list[Any]] = {
        "pageErrors": [],
        "consoleErrors": [],
        "criticalConsoleErrors": [],
        "serverErrors": [],
    }

    page.on("pageerror", lambda error: signals["pageErrors"].append(str(error)))

    def on_console(message: Any) -> None:
        if message.type != "error":
            return
        text = message.text
        signals["consoleErrors"].append(text)
        lowered = text.lower()
        if any(marker in lowered for marker in CRITICAL_CONSOLE_MARKERS):
            signals["criticalConsoleErrors"].append(text)

    def on_response(response: Any) -> None:
        if response.status >= 500 and same_origin(response.url):
            signals["serverErrors"].append(
                {"status": response.status, "url": response.url}
            )

    page.on("console", on_console)
    page.on("response", on_response)
    return signals


def screenshot(page: Page, persona: str, name: str) -> str | None:
    target = SCREENSHOT_ROOT / persona / f"{slug(name)}.jpg"
    target.parent.mkdir(parents=True, exist_ok=True)
    try:
        page.screenshot(path=str(target), type="jpeg", quality=72, full_page=False)
        return str(target)
    except Exception:
        return None


def route_health(
    context: BrowserContext,
    persona: str,
    path: str,
    expected_texts: tuple[str, ...] = (),
    *,
    mobile: bool = False,
) -> dict[str, Any]:
    page = context.new_page()
    page.set_default_timeout(DEFAULT_TIMEOUT_MS)
    signals = observe_page(page)
    details: dict[str, Any] = {"path": path}
    issues: list[str] = []

    try:
        response = page.goto(
            f"{BASE_URL}{path}",
            wait_until="domcontentloaded",
            timeout=DEFAULT_TIMEOUT_MS,
        )
        page.wait_for_timeout(SETTLE_MS)
        body = page.locator("body").inner_text(timeout=DEFAULT_TIMEOUT_MS)
        title = page.title()
        status = response.status if response else None
        final_url = page.url

        details.update(
            {
                "statusCode": status,
                "finalUrl": final_url,
                "title": title,
                "bodyLength": len(body),
                "signals": signals,
            }
        )

        if status is None or status >= 400:
            issues.append(f"route returned HTTP {status}")
        if len(body.strip()) < 60:
            issues.append("page rendered too little readable content")

        lowered = body.lower()
        found_markers = [marker for marker in FATAL_PAGE_MARKERS if marker in lowered]
        if found_markers:
            issues.append(f"fatal page marker(s): {', '.join(found_markers)}")

        missing_texts = [text for text in expected_texts if text.lower() not in lowered]
        if missing_texts:
            issues.append(f"missing expected text: {', '.join(missing_texts)}")

        if signals["pageErrors"]:
            issues.append(f"page errors: {signals['pageErrors'][:3]}")
        if signals["criticalConsoleErrors"]:
            issues.append(
                f"critical console errors: {signals['criticalConsoleErrors'][:3]}"
            )
        if signals["serverErrors"]:
            issues.append(f"same-origin 5xx responses: {signals['serverErrors'][:3]}")

        if mobile:
            no_overflow = bool(
                page.evaluate(
                    "document.documentElement.scrollWidth <= "
                    "document.documentElement.clientWidth + 2"
                )
            )
            details["noHorizontalOverflow"] = no_overflow
            if not no_overflow:
                issues.append("page has horizontal overflow at the mobile viewport")
    except Exception as error:
        details["signals"] = signals
        issues.append(f"navigation failed: {type(error).__name__}: {error}")
    finally:
        details["screenshot"] = screenshot(page, persona, path)
        page.close()

    if issues:
        raise CheckFailure("; ".join(issues), details)
    return details


def nextauth_login(
    context: BrowserContext,
    email: str,
    expected_role: str,
) -> dict[str, Any]:
    csrf_response, csrf_payload = api_request(context, "get", "/api/auth/csrf")
    expect(
        csrf_response.status == 200 and isinstance(csrf_payload, dict),
        f"failed to load CSRF token ({csrf_response.status})",
        {"response": csrf_payload},
    )
    csrf_token = csrf_payload.get("csrfToken")
    expect(bool(csrf_token), "CSRF response did not contain csrfToken", csrf_payload)

    callback_response, callback_payload = api_request(
        context,
        "post",
        "/api/auth/callback/credentials",
        form={
            "csrfToken": csrf_token,
            "email": email,
            "password": PASSWORD,
            "callbackUrl": f"{BASE_URL}/dashboard",
            "json": "true",
        },
        headers={"X-Auth-Return-Redirect": "1"},
    )
    expect(
        callback_response.status in (200, 302),
        f"credentials callback returned {callback_response.status}",
        {"response": callback_payload},
    )

    session_response, session_payload = api_request(
        context, "get", "/api/auth/session"
    )
    user = session_payload.get("user") if isinstance(session_payload, dict) else None
    expect(
        session_response.status == 200 and isinstance(user, dict),
        "credentials were not converted into an authenticated session",
        {"callback": callback_payload, "session": session_payload},
    )
    expect(
        str(user.get("email", "")).lower() == email.lower(),
        "session email does not match the signed-in account",
        {"session": session_payload},
    )
    expect(
        user.get("role") == expected_role,
        f"expected role {expected_role}, received {user.get('role')}",
        {"session": session_payload},
    )
    return {"session": session_payload, "callback": callback_payload}


def admin_login(context: BrowserContext) -> dict[str, Any]:
    response, payload = api_request(
        context,
        "post",
        "/api/admin/login",
        data={"email": ADMIN["email"], "password": PASSWORD},
    )
    expect(
        response.status == 200,
        f"admin login returned {response.status}",
        {"response": payload},
    )
    me_response, me_payload = api_request(context, "get", "/api/admin/me")
    user = me_payload.get("user") if isinstance(me_payload, dict) else None
    expect(
        me_response.status == 200 and isinstance(user, dict),
        "admin session cookie was not accepted by /api/admin/me",
        {"response": me_payload},
    )
    expect(user.get("role") == "admin", "admin session has the wrong role", me_payload)
    return {"login": payload, "me": me_payload}


def expect_api_status(
    context: BrowserContext,
    method: str,
    path: str,
    expected_status: int,
    *,
    data: Any | None = None,
) -> dict[str, Any]:
    response, payload = api_request(context, method, path, data=data)
    expect(
        response.status == expected_status,
        f"{method.upper()} {path} returned {response.status}, expected {expected_status}",
        {"response": payload},
    )
    return {"statusCode": response.status, "response": payload}


def ui_login(context: BrowserContext) -> dict[str, Any]:
    page = context.new_page()
    page.set_default_timeout(DEFAULT_TIMEOUT_MS)
    signals = observe_page(page)
    details: dict[str, Any] = {"signals": signals}
    try:
        page.goto(BASE_URL, wait_until="domcontentloaded")
        page.wait_for_timeout(SETTLE_MS)
        sign_in_button = page.get_by_role("button", name="Sign In", exact=True).first
        expect(sign_in_button.is_visible(), "desktop Sign In button is not visible")
        sign_in_button.click()
        page.locator("#login-email").fill(USERS["buyer"]["email"])
        page.locator("#login-password").fill(PASSWORD)
        login_form = page.locator("form").filter(has=page.locator("#login-email"))
        login_form.get_by_role("button").click()
        page.locator("#login-email").wait_for(state="hidden", timeout=DEFAULT_TIMEOUT_MS)

        session_response, session_payload = api_request(
            context, "get", "/api/auth/session"
        )
        user = session_payload.get("user") if isinstance(session_payload, dict) else None
        expect(
            session_response.status == 200 and isinstance(user, dict),
            "UI login did not establish a session",
            {"session": session_payload},
        )
        expect(
            user.get("email") == USERS["buyer"]["email"],
            "UI login established the wrong account",
            {"session": session_payload},
        )
        details["session"] = session_payload
        if signals["pageErrors"] or signals["criticalConsoleErrors"]:
            raise CheckFailure("UI login emitted critical browser errors", details)
        return details
    finally:
        details["screenshot"] = screenshot(page, "buyer-ui", "login")
        page.close()


def language_toggle(context: BrowserContext) -> dict[str, Any]:
    page = context.new_page()
    page.set_default_timeout(DEFAULT_TIMEOUT_MS)
    signals = observe_page(page)
    details: dict[str, Any] = {"signals": signals}
    try:
        page.goto(BASE_URL, wait_until="domcontentloaded")
        page.wait_for_timeout(SETTLE_MS)
        toggle = page.get_by_role("button", name="Arabic").first
        expect(toggle.is_visible(), "Arabic language toggle is not visible")
        toggle.click()
        page.wait_for_timeout(500)
        rtl_nodes = page.locator('[dir="rtl"]').count()
        expect(rtl_nodes > 0, "switching to Arabic did not apply RTL direction")
        details["rtlNodes"] = rtl_nodes

        english_toggle = page.get_by_role("button", name="English").first
        if english_toggle.count() and english_toggle.is_visible():
            english_toggle.click()
            page.wait_for_timeout(300)
        if signals["pageErrors"] or signals["criticalConsoleErrors"]:
            raise CheckFailure("language toggle emitted critical browser errors", details)
        return details
    finally:
        details["screenshot"] = screenshot(page, "guest-ui", "arabic-toggle")
        page.close()


def public_property_filter(context: BrowserContext) -> dict[str, Any]:
    response, payload = api_request(context, "get", "/api/properties?limit=100")
    expect(response.status == 200, "public property list failed", {"response": payload})
    properties = payload.get("properties") if isinstance(payload, dict) else None
    expect(isinstance(properties, list), "property list response is malformed", payload)
    unexpected = [
        item.get("id")
        for item in properties
        if item.get("listingStatus") != "published"
    ]
    expect(
        not unexpected,
        "public property API exposed non-published listings",
        {"unexpectedIds": unexpected},
    )
    ids = [item.get("id") for item in properties]
    expect("property-published" in ids, "seeded published listing is absent", {"ids": ids})
    return {"publishedIds": ids, "count": len(ids)}


def create_agent_listing(context: BrowserContext) -> dict[str, Any]:
    payload = {
        "titleEn": "E2E Agent Listing",
        "titleAr": "عقار اختبار شامل للوكيل",
        "descriptionEn": (
            "A complete automated listing created by the agent during the "
            "EstatePro end-to-end acceptance test."
        ),
        "descriptionAr": (
            "عقار مكتمل تم إنشاؤه بواسطة الوكيل أثناء اختبار القبول الشامل "
            "لتطبيق إستيت برو."
        ),
        "price": 275000,
        "type": "house",
        "status": "sale",
        "bedrooms": 3,
        "bathrooms": 2,
        "area": 180,
        "locationEn": "Al Mansour, Baghdad",
        "locationAr": "المنصور، بغداد",
        "addressEn": "100 E2E Test Street",
        "addressAr": "100 شارع اختبار شامل",
        "cityEn": "Baghdad",
        "cityAr": "بغداد",
        "images": "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg",
        "features": "Garden,Parking,Security",
        "yearBuilt": 2022,
        "parking": 1,
        "featured": False,
        "lat": 33.3128,
        "lng": 44.3615,
    }
    response, body = api_request(context, "post", "/api/properties", data=payload)
    expect(
        response.status == 201 and isinstance(body, dict),
        f"agent listing creation returned {response.status}",
        {"response": body},
    )
    expect(
        body.get("listingStatus") == "pending_review",
        "agent-created listing did not enter pending_review",
        {"response": body},
    )
    expect(
        body.get("ownerUserId") == "user-agent",
        "agent-created listing has the wrong owner",
        {"response": body},
    )
    listing_id = body.get("id")
    expect(bool(listing_id), "created listing has no id", {"response": body})
    STATE["listing_id"] = listing_id
    STATE["listing_title"] = payload["titleEn"]
    return {
        "listingId": listing_id,
        "listingStatus": body.get("listingStatus"),
        "agentId": body.get("agentId"),
    }


def moderate_agent_listing(context: BrowserContext) -> dict[str, Any]:
    listing_id = STATE.get("listing_id")
    expect(bool(listing_id), "agent listing was not created")
    response, payload = api_request(
        context,
        "post",
        f"/api/admin/listings/{listing_id}/moderate",
        data={"action": "approve", "reviewNotes": "Approved by E2E acceptance."},
    )
    listing = payload.get("listing") if isinstance(payload, dict) else None
    expect(
        response.status == 200 and isinstance(listing, dict),
        f"admin moderation returned {response.status}",
        {"response": payload},
    )
    expect(
        listing.get("listingStatus") == "published",
        "approved listing did not become published",
        {"response": payload},
    )
    return {
        "listingId": listing_id,
        "listingStatus": listing.get("listingStatus"),
        "reviewedByUserId": listing.get("reviewedByUserId"),
    }


def favorite_approved_listing(context: BrowserContext) -> dict[str, Any]:
    listing_id = STATE.get("listing_id")
    expect(bool(listing_id), "approved listing id is unavailable")
    current_response, current_payload = api_request(
        context, "get", "/api/account/favorites"
    )
    expect(current_response.status == 200, "failed to load buyer favorites", current_payload)
    current = current_payload.get("favorites", []) if isinstance(current_payload, dict) else []
    ids = list(dict.fromkeys([listing_id, *current]))
    update_response, update_payload = api_request(
        context, "put", "/api/account/favorites", data={"ids": ids}
    )
    expect(
        update_response.status == 200,
        f"favorite update returned {update_response.status}",
        {"response": update_payload},
    )
    saved = update_payload.get("favorites") if isinstance(update_payload, dict) else []
    expect(listing_id in saved, "approved listing was not persisted as a favorite", update_payload)
    return {"favorites": saved}


def register_new_user(context: BrowserContext) -> dict[str, Any]:
    email = "e2e-new-user@estatepro.test"
    response, payload = api_request(
        context,
        "post",
        "/api/auth/register",
        data={
            "name": "E2E New User",
            "email": email,
            "password": PASSWORD,
        },
    )
    expect(
        response.status == 201,
        f"registration returned {response.status}",
        {"response": payload},
    )
    login = nextauth_login(context, email, "user")
    return {"registration": payload, "session": login["session"]}


def run_suite(playwright: Playwright) -> None:
    browser: Browser = playwright.chromium.launch(
        headless=True,
        args=["--disable-dev-shm-usage", "--no-sandbox"],
    )

    guest = browser.new_context(
        base_url=BASE_URL,
        viewport={"width": 1440, "height": 1000},
        locale="en-US",
        service_workers="block",
    )
    guest.set_default_timeout(DEFAULT_TIMEOUT_MS)

    for path, expected_texts in PUBLIC_ROUTES:
        record_check(
            "guest",
            f"public route {path}",
            lambda path=path, expected_texts=expected_texts: route_health(
                guest, "guest", path, expected_texts
            ),
        )

    record_check("guest", "published-only property API", lambda: public_property_filter(guest))
    record_check(
        "guest",
        "draft listing is hidden",
        lambda: expect_api_status(
            guest, "get", "/api/properties/property-draft", 404
        ),
    )
    for path in ACCOUNT_APIS:
        record_check(
            "guest",
            f"account API rejects {path}",
            lambda path=path: expect_api_status(guest, "get", path, 401),
        )
    record_check(
        "guest",
        "admin API rejects anonymous access",
        lambda: expect_api_status(guest, "get", "/api/admin/overview", 401),
    )
    record_check(
        "guest",
        "property creation requires authentication",
        lambda: expect_api_status(guest, "post", "/api/properties", 401, data={}),
    )
    record_check("guest-ui", "Arabic RTL toggle", lambda: language_toggle(guest))

    ui_context = browser.new_context(
        base_url=BASE_URL,
        viewport={"width": 1440, "height": 1000},
        locale="en-US",
        service_workers="block",
    )
    record_check("buyer-ui", "sign in through dialog", lambda: ui_login(ui_context))

    buyer = browser.new_context(
        base_url=BASE_URL,
        viewport={"width": 1440, "height": 1000},
        locale="en-US",
        service_workers="block",
    )
    record_check(
        "buyer",
        "credentials session",
        lambda: nextauth_login(buyer, USERS["buyer"]["email"], USERS["buyer"]["role"]),
    )
    for path in ACCOUNT_APIS:
        record_check(
            "buyer",
            f"account API loads {path}",
            lambda path=path: expect_api_status(buyer, "get", path, 200),
        )
    for path in BUYER_ROUTES:
        record_check(
            "buyer",
            f"account route {path}",
            lambda path=path: route_health(buyer, "buyer", path),
        )
    record_check(
        "buyer",
        "buyer cannot publish through staff endpoint",
        lambda: expect_api_status(buyer, "post", "/api/properties", 403, data={}),
    )

    agent = browser.new_context(
        base_url=BASE_URL,
        viewport={"width": 1440, "height": 1000},
        locale="en-US",
        service_workers="block",
    )
    record_check(
        "agent",
        "credentials session",
        lambda: nextauth_login(agent, USERS["agent"]["email"], USERS["agent"]["role"]),
    )
    for path in AGENT_ROUTES:
        record_check(
            "agent",
            f"workspace route {path}",
            lambda path=path: route_health(agent, "agent", path),
        )
    record_check("agent", "create and submit listing", lambda: create_agent_listing(agent))
    record_check(
        "agent",
        "owner can preview pending listing",
        lambda: expect_api_status(
            agent,
            "get",
            f"/api/properties/{STATE.get('listing_id', 'missing')}",
            200,
        ),
    )
    record_check(
        "agent",
        "agent cannot call admin API",
        lambda: expect_api_status(agent, "get", "/api/admin/overview", 401),
    )
    record_check(
        "guest",
        "new pending listing remains private",
        lambda: expect_api_status(
            guest,
            "get",
            f"/api/properties/{STATE.get('listing_id', 'missing')}",
            404,
        ),
    )

    unverified = browser.new_context(
        base_url=BASE_URL,
        viewport={"width": 1440, "height": 1000},
        locale="en-US",
        service_workers="block",
    )
    record_check(
        "new-account-state",
        "seeded unverified account follows current auto-login product flow",
        lambda: nextauth_login(
            unverified,
            USERS["unverified"]["email"],
            USERS["unverified"]["role"],
        ),
    )
    record_check(
        "new-account-state",
        "dashboard route",
        lambda: route_health(unverified, "new-account-state", "/dashboard"),
    )

    registration = browser.new_context(
        base_url=BASE_URL,
        viewport={"width": 1440, "height": 1000},
        locale="en-US",
        service_workers="block",
    )
    record_check(
        "new-user",
        "register and authenticate",
        lambda: register_new_user(registration),
    )

    admin = browser.new_context(
        base_url=BASE_URL,
        viewport={"width": 1440, "height": 1000},
        locale="en-US",
        service_workers="block",
    )
    record_check(
        "admin",
        "invalid password rejected",
        lambda: expect_api_status(
            admin,
            "post",
            "/api/admin/login",
            401,
            data={"email": ADMIN["email"], "password": "definitely-wrong"},
        ),
    )
    record_check("admin", "secure admin session", lambda: admin_login(admin))
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
        record_check(
            "admin",
            f"admin API loads {path}",
            lambda path=path: expect_api_status(admin, "get", path, 200),
        )
    record_check("admin", "approve agent listing", lambda: moderate_agent_listing(admin))
    for path in ["/admin", "/admin/moderation"]:
        record_check(
            "admin",
            f"admin route {path}",
            lambda path=path: route_health(admin, "admin", path),
        )

    record_check(
        "guest",
        "approved listing is public through API",
        lambda: expect_api_status(
            guest,
            "get",
            f"/api/properties/{STATE.get('listing_id', 'missing')}",
            200,
        ),
    )
    record_check(
        "guest",
        "approved listing page renders",
        lambda: route_health(
            guest,
            "guest",
            f"/properties/{STATE.get('listing_id', 'missing')}",
            (STATE.get("listing_title", "E2E Agent Listing"),),
        ),
    )
    record_check(
        "buyer",
        "favorite approved listing",
        lambda: favorite_approved_listing(buyer),
    )
    record_check(
        "buyer",
        "favorites page renders approved listing",
        lambda: route_health(
            buyer,
            "buyer",
            "/favorites",
            (STATE.get("listing_title", "E2E Agent Listing"),),
        ),
    )
    record_check(
        "agent",
        "moderation notification is visible",
        lambda: expect_api_status(agent, "get", "/api/account/notifications", 200),
    )

    mobile_guest = browser.new_context(
        base_url=BASE_URL,
        viewport={"width": 390, "height": 844},
        is_mobile=True,
        has_touch=True,
        locale="en-US",
        service_workers="block",
    )
    for path in ["/", "/properties"]:
        record_check(
            "mobile-guest",
            f"responsive route {path}",
            lambda path=path: route_health(
                mobile_guest, "mobile-guest", path, mobile=True
            ),
        )

    mobile_buyer = browser.new_context(
        base_url=BASE_URL,
        viewport={"width": 390, "height": 844},
        is_mobile=True,
        has_touch=True,
        locale="en-US",
        service_workers="block",
    )
    record_check(
        "mobile-buyer",
        "credentials session",
        lambda: nextauth_login(
            mobile_buyer, USERS["buyer"]["email"], USERS["buyer"]["role"]
        ),
    )
    record_check(
        "mobile-buyer",
        "responsive dashboard",
        lambda: route_health(
            mobile_buyer, "mobile-buyer", "/dashboard", mobile=True
        ),
    )

    for context in [
        guest,
        ui_context,
        buyer,
        agent,
        unverified,
        registration,
        admin,
        mobile_guest,
        mobile_buyer,
    ]:
        context.close()
    browser.close()


def write_report(started_at: str) -> int:
    passed = sum(1 for check in CHECKS if check["status"] == "passed")
    failed = len(CHECKS) - passed
    report = {
        "suite": "EstatePro multi-role E2E acceptance",
        "baseUrl": BASE_URL,
        "startedAt": started_at,
        "finishedAt": datetime.now(timezone.utc).isoformat(),
        "summary": {"total": len(CHECKS), "passed": passed, "failed": failed},
        "state": STATE,
        "checks": CHECKS,
    }
    report_path = ARTIFACT_ROOT / "report.json"
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")

    markdown = [
        "# EstatePro E2E report",
        "",
        f"- Base URL: `{BASE_URL}`",
        f"- Total: **{len(CHECKS)}**",
        f"- Passed: **{passed}**",
        f"- Failed: **{failed}**",
        "",
        "| Persona | Check | Result | Duration |",
        "|---|---|---:|---:|",
    ]
    for check in CHECKS:
        icon = "✅" if check["status"] == "passed" else "❌"
        markdown.append(
            f"| {check['persona']} | {check['name']} | {icon} | "
            f"{check['durationMs']} ms |"
        )
        if check["status"] == "failed":
            markdown.append(
                f"|  | ↳ `{str(check.get('error', '')).replace('|', '\\|')}` |  |  |"
            )
    (ARTIFACT_ROOT / "report.md").write_text(
        "\n".join(markdown) + "\n", encoding="utf-8"
    )

    print(f"\nEstatePro E2E: {passed}/{len(CHECKS)} passed; {failed} failed")
    print(f"Report: {report_path}")
    return 1 if failed else 0


def main() -> int:
    started_at = datetime.now(timezone.utc).isoformat()
    exit_code = 1
    try:
        with sync_playwright() as playwright:
            run_suite(playwright)
    except Exception as error:  # pragma: no cover - preserve artifacts on harness failure
        CHECKS.append(
            {
                "persona": "harness",
                "name": "suite execution",
                "status": "failed",
                "durationMs": 0,
                "error": f"{type(error).__name__}: {error}",
                "details": {},
            }
        )
        print(f"FATAL E2E HARNESS ERROR: {type(error).__name__}: {error}")
    finally:
        exit_code = write_report(started_at)
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
