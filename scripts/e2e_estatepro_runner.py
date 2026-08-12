from __future__ import annotations

import re
import time
from urllib.parse import urlparse

import e2e_estatepro_playwright as suite


def first_visible(locator):
    for index in range(locator.count()):
        candidate = locator.nth(index)
        if candidate.is_visible():
            return candidate
    return None


def wait_for_visible(page, locator, timeout_ms=10_000):
    deadline = time.monotonic() + timeout_ms / 1000
    while time.monotonic() < deadline:
        candidate = first_visible(locator)
        if candidate is not None:
            return candidate
        page.wait_for_timeout(100)
    return None


def wait_for_hydration(page, timeout_ms=15_000):
    page.locator(
        "#estatepro-hydration-marker[data-state='ready']"
    ).wait_for(
        state="attached",
        timeout=timeout_ms,
    )
    # The marker appears one animation frame after browser-owned provider state
    # is released, so all related React commits have settled before assertions.
    page.wait_for_timeout(50)


def patched_request_failed(self, request):
    if not request.url.startswith(suite.BASE_URL):
        return

    failure = request.failure or ""
    parsed = urlparse(request.url)

    # Next.js cancels speculative React Server Component requests when a
    # navigation is superseded. These aborted `_rsc` prefetches are expected
    # browser behavior, not application failures.
    if "net::ERR_ABORTED" in failure and "_rsc=" in parsed.query:
        return

    self.request_failures.append(
        f"{request.method} {request.url}: {failure}"
    )


def patched_visit(
    page,
    signals,
    path,
    persona,
    *,
    expected_text=None,
    screenshot=True,
):
    signals.reset()
    response = page.goto(
        f"{suite.BASE_URL}{path}",
        wait_until="domcontentloaded",
    )
    suite.require(response is not None, f"No document response for {path}")
    suite.require(response.status < 400, f"{path} returned {response.status}")
    page.locator("body").wait_for(state="visible")
    wait_for_hydration(page)

    # Authenticated workspaces can perform a protected data request after the
    # shared shell is hydrated. Wait for their stable marker when supplied.
    if expected_text:
        page.get_by_text(expected_text, exact=False).first.wait_for(
            state="visible",
            timeout=15_000,
        )

    body_text = page.locator("body").inner_text()
    suite.require(
        not re.search(
            r"Application error|Internal Server Error|This page could not be found",
            body_text,
            re.IGNORECASE,
        ),
        f"{path} rendered an application error",
    )

    runtime = signals.assert_clean(f"{persona} {path}")
    screenshot_path = None
    if screenshot:
        target = suite.SCREENSHOT_DIR / persona / f"{suite.slug(path)}.jpg"
        target.parent.mkdir(parents=True, exist_ok=True)
        page.screenshot(
            path=str(target),
            type="jpeg",
            quality=65,
            full_page=True,
        )
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


def patched_login_user(page, context, email):
    page.goto(f"{suite.BASE_URL}/", wait_until="domcontentloaded")
    page.locator("header").wait_for(state="visible", timeout=10_000)
    wait_for_hydration(page)

    sign_in_buttons = page.get_by_role(
        "button", name=re.compile(r"^sign in$", re.IGNORECASE)
    )
    sign_in_button = wait_for_visible(page, sign_in_buttons)

    if sign_in_button is None:
        menu_button = wait_for_visible(
            page,
            page.get_by_role("button", name="Menu"),
            timeout_ms=3_000,
        )
        suite.require(
            menu_button is not None,
            "Neither a visible Sign In button nor a mobile Menu button was found",
        )
        menu_button.click()
        page.get_by_role(
            "navigation", name="Mobile navigation"
        ).wait_for(state="visible")
        sign_in_button = wait_for_visible(page, sign_in_buttons, timeout_ms=5_000)

    suite.require(sign_in_button is not None, "A visible Sign In button was not found")
    sign_in_button.click()

    email_input = page.locator("#login-email")
    password_input = page.locator("#login-password")
    email_input.wait_for(state="visible")
    email_input.fill(email)
    password_input.fill(suite.DEMO_PASSWORD)

    form = email_input.locator("xpath=ancestor::form")
    with page.expect_response(
        lambda response: "/api/auth/callback/credentials" in response.url
        and response.request.method == "POST"
    ) as callback_info:
        form.get_by_role(
            "button", name=re.compile(r"^sign in$", re.IGNORECASE)
        ).click()

    callback = callback_info.value
    suite.require(
        callback.status < 400,
        f"Credentials callback returned {callback.status}",
    )
    email_input.wait_for(state="hidden")

    me_response = suite.context_request(context, "GET", "/api/auth/me")
    suite.require_status(me_response, 200, "GET /api/auth/me")
    payload = suite.response_json(me_response)
    suite.require(
        payload.get("user", {}).get("email") == email,
        "Authenticated account email mismatch",
    )
    return payload["user"]


def patched_login_admin(page, context):
    page.goto(f"{suite.BASE_URL}/admin", wait_until="domcontentloaded")
    wait_for_hydration(page)
    email_input = page.locator("#admin-email")
    password_input = page.locator("#admin-password")
    email_input.wait_for(state="visible")
    submit = email_input.locator("xpath=ancestor::form").get_by_role(
        "button", name=re.compile(r"^sign in$", re.IGNORECASE)
    )

    email_input.fill(suite.ACCOUNTS["agent"]["email"])
    password_input.fill(suite.DEMO_PASSWORD)
    with page.expect_response(
        lambda response: "/api/admin/login" in response.url
        and response.request.method == "POST"
    ) as rejected_info:
        submit.click()
    suite.require(
        rejected_info.value.status == 401,
        "Agent credentials crossed the admin boundary",
    )

    email_input.fill(suite.ACCOUNTS["admin"]["email"])
    password_input.fill(suite.DEMO_PASSWORD)
    with page.expect_response(
        lambda response: "/api/admin/login" in response.url
        and response.request.method == "POST"
    ) as accepted_info:
        submit.click()
    suite.require(
        accepted_info.value.status == 200,
        "Administrator login was rejected",
    )
    page.get_by_role(
        "heading", name="Overview", exact=True
    ).wait_for(state="visible")

    me_response = suite.context_request(context, "GET", "/api/admin/me")
    suite.require_status(me_response, 200, "GET /api/admin/me")
    payload = suite.response_json(me_response)
    suite.require(
        payload.get("user", {}).get("role") == "admin",
        "Admin session role mismatch",
    )
    return payload["user"]


suite.RuntimeSignals._on_request_failed = patched_request_failed
suite.visit = patched_visit
suite.login_user = patched_login_user
suite.login_admin = patched_login_admin

raise SystemExit(suite.main())
