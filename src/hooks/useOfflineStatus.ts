import { useCallback, useEffect, useState } from "react";

export function useOfflineStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);
  const supported =
    import.meta.env.PROD &&
    "serviceWorker" in navigator &&
    window.isSecureContext;
  const [cacheState, setCacheState] = useState<
    "preparing" | "ready" | "unavailable"
  >(() => (supported ? "preparing" : "unavailable"));
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => {
    setCacheState(supported ? "preparing" : "unavailable");
    setAttempt((value) => value + 1);
  }, [supported]);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    const prepare = async () => {
      const registration = await navigator.serviceWorker.register(
        `${import.meta.env.BASE_URL}sw.js`,
        {
          updateViaCache: "none",
        },
      );
      if (!registration.active) {
        const worker = registration.installing || registration.waiting;
        if (!worker) throw new Error("Offline installation did not start");
        await new Promise<void>((resolve, reject) => {
          const check = () => {
            if (worker.state === "activated" || worker.state === "redundant") {
              worker.removeEventListener("statechange", check);
              if (worker.state === "activated") resolve();
              else reject(new Error("Offline installation failed"));
            }
          };
          worker.addEventListener("statechange", check);
          check();
        });
      }
      if (!cancelled) setCacheState("ready");
    };
    void prepare().catch(() => {
      if (!cancelled) setCacheState("unavailable");
    });
    return () => {
      cancelled = true;
    };
  }, [attempt, supported]);

  return { online, cacheState, retry };
}
