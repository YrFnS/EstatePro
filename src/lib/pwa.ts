let registrationScheduled = false;

async function register(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      updateViaCache: "none",
    });

    // Check immediately instead of waiting for the browser's periodic update
    // cycle. This lets the v3 worker activate and remove stale application
    // caches as soon as a user returns after a deployment.
    await registration.update();

    if (registration.scope) {
      console.info("SW registered:", registration.scope);
    }
  } catch (error) {
    console.info("SW registration unavailable:", error);
  }
}

export function registerServiceWorker(): void {
  if (
    registrationScheduled ||
    typeof window === "undefined" ||
    !("serviceWorker" in navigator)
  ) {
    return;
  }

  registrationScheduled = true;

  if (document.readyState === "complete") {
    void register();
    return;
  }

  window.addEventListener("load", () => void register(), { once: true });
}
