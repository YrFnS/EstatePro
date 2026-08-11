from __future__ import annotations

import re
from urllib.parse import urlparse

import e2e_estatepro_playwright as suite


def first_visible(locator):
    for index in range(locator.count()):
        candidate = locator.nth(index)
        if candidate.is_visible():
            return candidate
    return None


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


def patched_login_user(page, context, email):
    page.goto(f"{suite.BASE_URL}/", wait_until="domcontentloaded")

    sign_in_buttons = page.get_by_role(
        "button", name=re.compile(r"^sign in$", re.IGNORECASE)
    )
    sign_in_button = first_visible(sign_in_buttons)

    if sign_in_button is None:
        page.get_by_role("button", name="Menu").click()
        page.get_by_role(
            "navigation", name="Mobile navigation"
        ).wait_for(state="visible")
        sign_in_button = first_visible(sign_in_buttons)

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
suite.login_user = patched_login_user
suite.login_admin = patched_login_admin

raise SystemExit(suite.main())
