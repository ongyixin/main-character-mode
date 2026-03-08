/**
 * The overshoot library's Logger class unconditionally calls console.error for
 * WebSocket drops — before our onError callback fires. Next.js devtools
 * intercepts every console.error and shows it as an overlay, creating noise for
 * a transient error that our hooks already handle with retry logic.
 *
 * This module patches console.error once (browser-only) to silently drop that
 * specific message. All other console.error calls pass through unchanged.
 */
if (typeof window !== "undefined") {
  const original = console.error.bind(console);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  console.error = (...args: any[]) => {
    if (
      args[0] === "[RealtimeVision]" &&
      typeof args[1] === "string" &&
      args[1].includes("WebSocket error occurred")
    ) {
      return;
    }
    original(...args);
  };
}
