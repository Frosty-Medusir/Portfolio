document.querySelector("#year").textContent = new Date().getFullYear();

const greetingElement = document.querySelector("#local-greeting");
const timeElement = document.querySelector("#local-time");
const nairobiTimeElement = document.querySelector("#nairobi-time");

if (nairobiTimeElement) {
  const nairobiTimeFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const updateNairobiTime = () => {
    const now = new Date();
    nairobiTimeElement.dateTime = now.toISOString();
    nairobiTimeElement.textContent = `here now: ${nairobiTimeFormatter.format(now)}`;
  };

  updateNairobiTime();
  window.setInterval(updateNairobiTime, 30_000);
}

if (greetingElement && timeElement) {
  let activeTimeZone;
  let activeLocationName;
  let localHourFormatter;
  let localTimeFormatter;
  const updateLocalTime = () => {
    const now = new Date();
    const visitorTimeZone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

    if (visitorTimeZone !== activeTimeZone) {
      activeTimeZone = visitorTimeZone;
      activeLocationName =
        visitorTimeZone.includes("/") && !visitorTimeZone.startsWith("Etc/")
          ? visitorTimeZone.split("/").pop()?.replaceAll("_", " ").toLowerCase()
          : null;

      localHourFormatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: visitorTimeZone,
        hour: "2-digit",
        hourCycle: "h23",
      });
      localTimeFormatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: visitorTimeZone,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      });
    }

    const hour = Number(localHourFormatter.format(now));
    const greeting =
      hour < 5 || hour >= 21
        ? "good night"
        : hour < 12
          ? "good morning"
          : hour < 17
            ? "good afternoon"
            : "good evening";
    greetingElement.textContent = activeLocationName
      ? `${greeting} in ${activeLocationName}`
      : greeting;
    timeElement.dateTime = now.toISOString();
    timeElement.textContent = localTimeFormatter.format(now);
  };

  updateLocalTime();
  window.setInterval(updateLocalTime, 30_000);
}

const visitCountElement = document.querySelector("#visit-count");

const setUnavailable = () => {
  if (visitCountElement) {
    visitCountElement.textContent = "visits unavailable";
  }
};

const createVisitorId = () => {
  if (typeof crypto?.randomUUID === "function") {
    return crypto.randomUUID();
  }
  if (typeof crypto?.getRandomValues === "function") {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
    return [
      hex.slice(0, 4).join(""),
      hex.slice(4, 6).join(""),
      hex.slice(6, 8).join(""),
      hex.slice(8, 10).join(""),
      hex.slice(10).join(""),
    ].join("-");
  }
  const randomHex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${randomHex()}${randomHex()}-${randomHex()}-${randomHex()}-${randomHex()}-${randomHex()}${randomHex()}${randomHex()}`;
};

let visitorId;
let visitId;
try {
  visitorId = window.localStorage.getItem("portfolio-visitor-id");
  if (!visitorId) {
    visitorId = createVisitorId();
    window.localStorage.setItem("portfolio-visitor-id", visitorId);
  }
  visitId = window.sessionStorage.getItem("portfolio-visit-id");
  if (!visitId) {
    visitId = createVisitorId();
    window.sessionStorage.setItem("portfolio-visit-id", visitId);
  }
} catch (error) {
  console.error("Could not initialize visitor counting.", error);
  setUnavailable();
}

if (visitorId && visitId) {
  let requestPending = false;
  let failureReported = false;
  let pollTimer;
  const scheduleNextUpdate = (failed) => {
    window.clearTimeout(pollTimer);
    pollTimer = window.setTimeout(updateVisitorCounts, failed ? 60_000 : 30_000);
  };
  const updateVisitorCounts = async () => {
    if (requestPending) return;
    requestPending = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8_000);
    try {
      const response = await fetch(
        "https://portfolio-nk5y.onrender.com/api/heartbeat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ visitorId, visitId }),
          signal: controller.signal,
        },
      );
      if (!response.ok) {
        throw new Error(`Visitor count request failed (${response.status}).`);
      }

      const counts = await response.json();
      if (
        !Number.isSafeInteger(counts.visits) ||
        counts.visits < 0
      ) {
        throw new Error("Visitor count response was invalid.");
      }

      if (visitCountElement) {
        visitCountElement.textContent = `${counts.visits} ${
          counts.visits === 1 ? "visit" : "visits"
        }`;
      }
      failureReported = false;
      scheduleNextUpdate(false);
    } catch (error) {
      if (!failureReported) {
        console.error("Could not update shared visitor counts.", error);
        failureReported = true;
      }
      setUnavailable();
      scheduleNextUpdate(true);
    } finally {
      window.clearTimeout(timeout);
      requestPending = false;
    }
  };

  updateVisitorCounts();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      window.clearTimeout(pollTimer);
      updateVisitorCounts();
    }
  });
}
