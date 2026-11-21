document.querySelector("#year").textContent = new Date().getFullYear();

const greetingElement = document.querySelector("#local-greeting");
const timeElement = document.querySelector("#local-time");

if (greetingElement && timeElement) {
  const locationNames = {
    "Europe/Berlin": "Germany",
    "Europe/Busingen": "Germany",
    "Africa/Nairobi": "Nairobi, Kenya",
    "Africa/Lagos": "Nigeria",
    "Africa/Cairo": "Egypt",
    "Africa/Johannesburg": "South Africa",
    "Europe/London": "United Kingdom",
    "Europe/Paris": "France",
    "Europe/Madrid": "Spain",
    "Europe/Rome": "Italy",
    "Europe/Amsterdam": "Netherlands",
    "Europe/Zurich": "Switzerland",
    "America/New_York": "United States",
    "America/Chicago": "United States",
    "America/Denver": "United States",
    "America/Los_Angeles": "United States",
    "America/Toronto": "Canada",
    "America/Vancouver": "Canada",
    "America/Sao_Paulo": "Brazil",
    "Asia/Dubai": "United Arab Emirates",
    "Asia/Kolkata": "India",
    "Asia/Singapore": "Singapore",
    "Asia/Tokyo": "Japan",
    "Australia/Sydney": "Australia",
  };

  let activeTimeZone;
  let localTimeFormatter;
  const updateLocalTime = () => {
    const now = new Date();
    const visitorTimeZone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

    if (visitorTimeZone !== activeTimeZone) {
      activeTimeZone = visitorTimeZone;
      const locationName =
        locationNames[visitorTimeZone] ||
        visitorTimeZone.split("/").pop()?.replaceAll("_", " ") ||
        "your local time zone";

      greetingElement.textContent = `hi from ${locationName}`;
      localTimeFormatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: visitorTimeZone,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      });
    }

    timeElement.dateTime = now.toISOString();
    timeElement.textContent = localTimeFormatter.format(now);
  };

  updateLocalTime();
  window.setInterval(updateLocalTime, 30_000);
}

const visitCountElement = document.querySelector("#visit-count");

if (visitCountElement) {
  try {
    const storedCount = window.localStorage.getItem("portfolio-local-visits");
    const previousCount = storedCount === null ? 0 : Number(storedCount);
    if (!Number.isSafeInteger(previousCount) || previousCount < 0) {
      throw new Error("Stored visit count is invalid.");
    }

    const visitCount = previousCount + 1;
    window.localStorage.setItem("portfolio-local-visits", String(visitCount));
    visitCountElement.textContent = `${visitCount} local ${
      visitCount === 1 ? "visit" : "visits"
    }`;
  } catch (error) {
    console.error("Could not update the local visit count.", error);
    visitCountElement.textContent = "local visits unavailable";
  }
}
