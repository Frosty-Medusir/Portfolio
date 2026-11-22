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

let visitorId;
let visitId;
try {
  visitorId = window.localStorage.getItem("portfolio-visitor-id");
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    window.localStorage.setItem("portfolio-visitor-id", visitorId);
  }
  visitId = window.sessionStorage.getItem("portfolio-visit-id");
  if (!visitId) {
    visitId = crypto.randomUUID();
    window.sessionStorage.setItem("portfolio-visit-id", visitId);
  }
} catch (error) {
  console.error("Could not initialize visitor counting.", error);
  setUnavailable();
}

if (visitorId && visitId) {
  let requestPending = false;
  let failureReported = false;
  const updateVisitorCounts = async () => {
    if (requestPending) return;
    requestPending = true;
    try {
      const response = await fetch(
        "https://portfolio-nk5y.onrender.com/api/heartbeat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ visitorId, visitId }),
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
    } catch (error) {
      if (!failureReported) {
        console.error("Could not update shared visitor counts.", error);
        failureReported = true;
      }
      setUnavailable();
    } finally {
      requestPending = false;
    }
  };

  updateVisitorCounts();
  window.setInterval(updateVisitorCounts, 30_000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") updateVisitorCounts();
  });
}
