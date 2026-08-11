#!/usr/bin/env python3
"""EstatePro E2E runner extensions.

Keeps the main acceptance suite readable while adding richer browser stacks,
UI form coverage, and regression checks discovered during the first pass.
"""

from __future__ import annotations

from typing import Any

import e2e_estatepro as suite
from playwright.sync_api import BrowserContext, Page


def observe_page(page: Page) -> dict[str, list[Any]]:
    signals: dict[str, list[Any]] = {
        "pageErrors": [],
        "consoleErrors": [],
        "criticalConsoleErrors": [],
        "serverErrors": [],
    }

    def on_page_error(error: Any) -> None:
        stack = getattr(error, "stack", None)
        signals["pageErrors"].append(stack or str(error))

    def on_console(message: Any) -> None:
        if message.type != "error":
            return
        text = message.text
        signals["consoleErrors"].append(text)
        lowered = text.lower()
        if any(marker in lowered for marker in suite.CRITICAL_CONSOLE_MARKERS):
            signals["criticalConsoleErrors"].append(text)

    def on_response(response: Any) -> None:
        if response.status >= 500 and suite.same_origin(response.url):
            signals["serverErrors"].append(
                {"status": response.status, "url": response.url}
            )

    page.on("pageerror", on_page_error)
    page.on("console", on_console)
    page.on("response", on_response)
    return signals


def ui_login(context: BrowserContext) -> dict[str, Any]:
    page = context.new_page()
    page.set_default_timeout(suite.DEFAULT_TIMEOUT_MS)
    signals = observe_page(page)
    details: dict[str, Any] = {"signals": signals}

    try:
        page.goto(suite.BASE_URL, wait_until="domcontentloaded")
        page.wait_for_timeout(suite.SETTLE_MS)
        sign_in_button = page.get_by_role(
            "button", name="Sign In", exact=True
        ).first
        suite.expect(sign_in_button.is_visible(), "desktop Sign In button is not visible")
        sign_in_button.click()
        page.locator("#login-email").fill(suite.USERS["buyer"]["email"])
        page.locator("#login-password").fill(suite.PASSWORD)
        login_form = page.locator("form").filter(
            has=page.locator("#login-email")
        )
        login_form.get_by_role(
            "button", name="Sign In", exact=True
        ).click()
        page.locator("#login-email").wait_for(
            state="hidden", timeout=suite.DEFAULT_TIMEOUT_MS
        )

        session_response, session_payload = suite.api_request(
            context, "get", "/api/auth/session"
        )
        user = (
            session_payload.get("user")
            if isinstance(session_payload, dict)
            else None
        )
        suite.expect(
            session_response.status == 200 and isinstance(user, dict),
            "UI login did not establish a session",
            {"session": session_payload},
        )
        suite.expect(
            user.get("email") == suite.USERS["buyer"]["email"],
            "UI login established the wrong account",
            {"session": session_payload},
        )
        details["session"] = session_payload
        if signals["pageErrors"] or signals["criticalConsoleErrors"]:
            raise suite.CheckFailure(
                "UI login emitted critical browser errors", details
            )
        return details
    finally:
        details["screenshot"] = suite.screenshot(page, "buyer-ui", "login")
        page.close()


_original_route_health = suite.route_health


def route_health(
    context: BrowserContext,
    persona: str,
    path: str,
    expected_texts: tuple[str, ...] = (),
    *,
    mobile: bool = False,
) -> dict[str, Any]:
    details = _original_route_health(
        context,
        persona,
        path,
        expected_texts,
        mobile=mobile,
    )

    if path != "/contact" or persona != "guest" or mobile:
        return details

    page = context.new_page()
    page.set_default_timeout(suite.DEFAULT_TIMEOUT_MS)
    signals = observe_page(page)
    submission: dict[str, Any] = {"signals": signals}

    try:
        page.goto(
            f"{suite.BASE_URL}/contact",
            wait_until="domcontentloaded",
            timeout=suite.DEFAULT_TIMEOUT_MS,
        )
        page.wait_for_timeout(500)
        page.locator("#name").fill("EstatePro E2E Visitor")
        page.locator("#email").fill("contact-e2e@estatepro.test")
        page.locator("#phone").fill("+964 770 000 0000")
        page.locator("#subject").fill("Browser acceptance message")
        page.locator("#message").fill(
            "This message verifies the full EstatePro contact form workflow."
        )

        with page.expect_response(
            lambda response: response.url.endswith("/api/contact")
            and response.request.method == "POST",
            timeout=suite.DEFAULT_TIMEOUT_MS,
        ) as response_info:
            page.locator('button[type="submit"]').click()

        response = response_info.value
        submission["statusCode"] = response.status
        suite.expect(
            response.status == 201,
            f"contact form returned HTTP {response.status}",
            submission,
        )
        page.locator('[data-testid="contact-success"]').wait_for(
            state="visible", timeout=suite.DEFAULT_TIMEOUT_MS
        )
        suite.expect(
            not signals["pageErrors"],
            "contact submission emitted a page error",
            submission,
        )
        suite.expect(
            not signals["serverErrors"],
            "contact submission emitted a same-origin 5xx response",
            submission,
        )
        submission["screenshot"] = suite.screenshot(
            page, "guest", "contact-submitted"
        )
        details["formSubmission"] = submission
        return details
    finally:
        page.close()


_original_create_agent_listing = suite.create_agent_listing


def create_agent_listing(context: BrowserContext) -> dict[str, Any]:
    details = _original_create_agent_listing(context)
    listing_id = suite.STATE.get("listing_id")
    suite.expect(bool(listing_id), "agent listing id is unavailable")

    browser = context.browser
    suite.expect(browser is not None, "browser is unavailable for privacy checks")
    buyer = browser.new_context(
        base_url=suite.BASE_URL,
        viewport={"width": 1440, "height": 1000},
        locale="en-US",
        service_workers="block",
    )
    privacy_results: dict[str, Any] = {}

    try:
        suite.nextauth_login(
            buyer,
            suite.USERS["buyer"]["email"],
            suite.USERS["buyer"]["role"],
        )

        for endpoint, response_key in (
            ("/api/account/favorites", "favorites"),
            ("/api/account/comparison", "comparison"),
        ):
            before_response, before_payload = suite.api_request(
                buyer, "get", endpoint
            )
            suite.expect(
                before_response.status == 200,
                f"failed to load {response_key} before privacy check",
                {"response": before_payload},
            )
            before_ids = (
                before_payload.get(response_key, [])
                if isinstance(before_payload, dict)
                else []
            )

            update_response, update_payload = suite.api_request(
                buyer,
                "put",
                endpoint,
                data={"ids": [listing_id]},
            )
            suite.expect(
                update_response.status == 404,
                f"{endpoint} accepted a private pending listing",
                {"statusCode": update_response.status, "response": update_payload},
            )

            after_response, after_payload = suite.api_request(
                buyer, "get", endpoint
            )
            after_ids = (
                after_payload.get(response_key, [])
                if isinstance(after_payload, dict)
                else []
            )
            suite.expect(
                after_response.status == 200 and after_ids == before_ids,
                f"rejected private {response_key} update changed stored state",
                {"before": before_payload, "after": after_payload},
            )
            privacy_results[response_key] = {
                "statusCode": update_response.status,
                "statePreserved": True,
            }
    finally:
        buyer.close()

    details["privateListingProtection"] = privacy_results
    return details


suite.observe_page = observe_page
suite.ui_login = ui_login
suite.route_health = route_health
suite.create_agent_listing = create_agent_listing


if __name__ == "__main__":
    raise SystemExit(suite.main())
