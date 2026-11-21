document.querySelector("#year").textContent = new Date().getFullYear();

const greetingElement = document.querySelector("#local-greeting");
const timeElement = document.querySelector("#nairobi-time");

if (greetingElement && timeElement) {
  const nairobiHourFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    hour: "2-digit",
    hourCycle: "h23",
  });
  const nairobiTimeFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const updateNairobiTime = () => {
    const now = new Date();
    const hour = Number(nairobiHourFormatter.format(now));

    greetingElement.textContent =
      hour >= 5 && hour < 12
        ? "good morning in nairobi"
        : hour >= 12 && hour < 17
          ? "good afternoon in nairobi"
          : "good evening in nairobi";
    timeElement.dateTime = now.toISOString();
    timeElement.textContent = nairobiTimeFormatter.format(now);
  };

  updateNairobiTime();
  window.setInterval(updateNairobiTime, 30_000);
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
