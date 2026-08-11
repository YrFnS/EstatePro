let registrationScheduled = false;

async function register(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.register("/sw.js");

    if (registration?.scope) {
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
