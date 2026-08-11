/* eslint-disable @typescript-eslint/no-require-imports */
const { test, expect } = require("@playwright/test");

const BASE_URL =
  process.env.E2E_BASE_URL || "https://estate-pro-one.vercel.app";
const BASE_ORIGIN = new URL(BASE_URL).origin;
const DEMO_PASSWORD = process.env.E2E_DEMO_PASSWORD || "DemoPass!2026";

const accounts = {
  buyer: { email: "buyer@estatepro.test", role: "user" },
  agent: { email: "agent@estatepro.test", role: "agent" },
  admin: { email: "admin@estatepro.test", role: "admin" },
  unverified: { email: "unverified@estatepro.test", role: "user" },
};

const publicRoutes = [
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
  "/about",
  "/contact",
];

const accountApis = [
  "/api/account/favorites",
  "/api/account/comparison",
  "/api/account/listings",
  "/api/account/notifications",
  "/api/account/property-alerts",
  "/api/account/saved-searches",
];

const accountRoutesByType = {
  buyer: [
    "/dashboard",
    "/favorites",
    "/compare",
    "/saved-searches",
    "/property-alerts",
    "/notifications",
    "/my-tours",
    "/messaging",
    "/settings",
  ],
  agent: ["/dashboard", "/my-listings", "/list-property", "/messaging"],
  admin: ["/dashboard", "/notifications", "/settings"],
  unverified: ["/dashboard", "/favorites", "/settings"],
};

function watchRuntime(page) {
  let failures = [];

  page.on("pageerror", (error) => {
    failures.push(`pageerror at ${page.url()}: ${error.message}`);
  });

  page.on("response", (response) => {
    try {
      const url = new URL(response.url());
      if (url.origin === BASE_ORIGIN && response.status() >= 500) {
        failures.push(`${response.status()} ${url.pathname}${url.search}`);
      }
    } catch {
      // Ignore non-URL browser resources.
    }
  });

  return {
    async assertClean(label) {
      await page.waitForTimeout(250);
      const checkpointFailures = failures;
      failures = [];
      expect(
        checkpointFailures,
        `${label}\n${checkpointFailures.join("\n")}`
      ).toEqual([]);
    },
  };
}

async function openRoute(page, path) {
  const response = await page.goto(path, { waitUntil: "domcontentloaded" });
  expect(response, `No document response for ${path}`).not.toBeNull();
  expect(response.status(), `Unexpected status for ${path}`).toBeLessThan(400);
  await expect(page.locator("body")).toBeVisible();
  await page.waitForTimeout(500);
  await expect(page.locator("body")).not.toContainText(
    /Application error|Internal Server Error|This page could not be found/i
  );
}

async function loginThroughDialog(page, email) {
  await openRoute(page, "/");
  await page.getByRole("button", { name: /^sign in$/i }).first().click();

  const emailInput = page.locator("#login-email");
  const passwordInput = page.locator("#login-password");
  await expect(emailInput).toBeVisible();
  await emailInput.fill(email);
  await passwordInput.fill(DEMO_PASSWORD);

  const form = emailInput.locator("xpath=ancestor::form");
  const callback = page.waitForResponse(
    (response) =>
      response.url().includes("/api/auth/callback/credentials") &&
      response.request().method() === "POST"
  );
  await form.getByRole("button", { name: /sign in/i }).click();
  const callbackResponse = await callback;
  expect(callbackResponse.status()).toBeLessThan(400);
  await expect(emailInput).toBeHidden();

  const meResponse = await page.request.get("/api/auth/me");
  expect(meResponse.status()).toBe(200);
  const payload = await meResponse.json();
  expect(payload.user.email).toBe(email);
  return payload.user;
}

function extractProperties(payload) {
  if (Array.isArray(payload)) return payload;
  for (const key of ["properties", "data", "results", "items"]) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
}

test.describe("guest and public experience", () => {
  for (const path of publicRoutes) {
    test(`guest route ${path} renders without server/runtime errors`, async ({
      page,
    }) => {
      const runtime = watchRuntime(page);
      await openRoute(page, path);
      await runtime.assertClean(`guest ${path}`);
    });
  }

  test("public property API only exposes published inventory", async ({
    request,
  }) => {
    const response = await request.get("/api/properties?limit=100");
    expect(response.status()).toBe(200);
    const payload = await response.json();
    const properties = extractProperties(payload);
    expect(properties.length).toBeGreaterThan(0);

    const privateIds = new Set([
      "property-archived",
      "property-changes_requested",
      "property-draft",
      "property-pending_review",
      "property-rejected",
      "property-scheduled",
    ]);

    for (const property of properties) {
      expect(privateIds.has(property.id), `${property.id} leaked publicly`).toBe(
        false
      );
      if (property.listingStatus) {
        expect(property.listingStatus).toBe("published");
      }
    }
  });

  test("guest requests cannot cross account, admin, or worker boundaries", async ({
    request,
  }) => {
    const protectedUrls = [
      "/api/auth/me",
      ...accountApis,
      "/api/admin/me",
      "/api/admin/overview",
      "/api/cron/publish-listings",
      "/api/cron/property-alerts",
    ];

    for (const url of protectedUrls) {
      const response = await request.get(url);
      expect(response.status(), `${url} should reject a guest`).toBe(401);
    }
  });
});

test.describe("authenticated account types", () => {
  for (const [type, account] of Object.entries(accounts)) {
    test(`${type} authenticates with the expected role and loads its account surfaces`, async ({
      page,
    }) => {
      const runtime = watchRuntime(page);
      const user = await loginThroughDialog(page, account.email);
      expect(user.role).toBe(account.role);
      await runtime.assertClean(`${type} login`);

      for (const url of accountApis) {
        const response = await page.request.get(url);
        expect(response.status(), `${url} failed for ${type}`).toBe(200);
      }

      const guardedAdmin = await page.request.get("/api/admin/overview");
      expect(guardedAdmin.status()).toBe(401);

      for (const path of accountRoutesByType[type]) {
        await openRoute(page, path);
        await runtime.assertClean(`${type} ${path}`);
      }
    });
  }

  test("buyer favorite persistence round-trips and restores the seed state", async ({
    page,
  }) => {
    await loginThroughDialog(page, accounts.buyer.email);

    const beforeResponse = await page.request.get("/api/account/favorites");
    expect(beforeResponse.status()).toBe(200);
    const before = (await beforeResponse.json()).favorites;
    expect(Array.isArray(before)).toBe(true);

    const candidate = "property-published";
    const changed = before.includes(candidate)
      ? before.filter((id) => id !== candidate)
      : [candidate, ...before];
    expect(changed).not.toEqual(before);

    try {
      const update = await page.request.put("/api/account/favorites", {
        data: { ids: changed },
      });
      expect(update.status()).toBe(200);
      expect((await update.json()).favorites).toEqual(changed);

      const persisted = await page.request.get("/api/account/favorites");
      expect(persisted.status()).toBe(200);
      expect((await persisted.json()).favorites).toEqual(changed);
    } finally {
      const restore = await page.request.put("/api/account/favorites", {
        data: { ids: before },
      });
      expect(restore.status()).toBe(200);
    }
  });
});

test("admin guard rejects an agent and grants the administrator dashboard and moderation UI", async ({
  page,
}) => {
  const runtime = watchRuntime(page);
  await openRoute(page, "/admin");
  await runtime.assertClean("admin login screen");

  const emailInput = page.locator("#admin-email");
  const passwordInput = page.locator("#admin-password");
  await expect(emailInput).toBeVisible();

  await emailInput.fill(accounts.agent.email);
  await passwordInput.fill(DEMO_PASSWORD);
  let loginResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/admin/login") &&
      response.request().method() === "POST"
  );
  await emailInput
    .locator("xpath=ancestor::form")
    .getByRole("button", { name: /sign in/i })
    .click();
  let loginResponse = await loginResponsePromise;
  expect(loginResponse.status()).toBe(401);
  await runtime.assertClean("agent rejected from admin login");

  await emailInput.fill(accounts.admin.email);
  await passwordInput.fill(DEMO_PASSWORD);
  loginResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/admin/login") &&
      response.request().method() === "POST"
  );
  await emailInput
    .locator("xpath=ancestor::form")
    .getByRole("button", { name: /sign in/i })
    .click();
  loginResponse = await loginResponsePromise;
  expect(loginResponse.status()).toBe(200);

  await expect(page.getByRole("heading", { name: /^Overview$/ })).toBeVisible();
  await runtime.assertClean("administrator dashboard");

  for (const url of ["/api/admin/me", "/api/admin/overview"]) {
    const response = await page.request.get(url);
    expect(response.status(), `${url} failed after admin login`).toBe(200);
  }

  await openRoute(page, "/admin/moderation");
  await expect(page.locator("body")).toContainText(/Listing moderation/i);
  await runtime.assertClean("administrator moderation");
});

test("@mobile mobile navigation remains usable and switches to RTL", async ({
  page,
}) => {
  const runtime = watchRuntime(page);
  await openRoute(page, "/");
  await runtime.assertClean("mobile home");

  await page.getByRole("button", { name: "Menu" }).click();
  const navigation = page.getByRole("navigation", { name: "Mobile navigation" });
  await expect(navigation).toBeVisible();
  await navigation.getByRole("button", { name: /for sale/i }).click();
  await expect(page).toHaveURL(/\/properties\?status=sale/);
  await runtime.assertClean("mobile for-sale navigation");

  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("button", { name: /العربية/ }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await runtime.assertClean("mobile RTL switch");
});
