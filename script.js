const themeToggle = document.querySelector(".theme-toggle");
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
  document.body.classList.add("dark");
}

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("dark") ? "dark" : "light"
  );
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((element) => {
  revealObserver.observe(element);
});

document.querySelector("#year").textContent = new Date().getFullYear();

if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  const cursor = document.createElement("div");
  cursor.className = "cursor-overlay";
  cursor.setAttribute("aria-hidden", "true");
  document.body.appendChild(cursor);

  window.addEventListener("pointermove", (event) => {
    cursor.classList.add("visible");
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
  });

  document.addEventListener("pointerleave", () => {
    cursor.classList.remove("visible", "active");
  });

  const hoverTargets = document.querySelectorAll(
    "a, button, .project-card, .stack-grid h3, .section-heading h2"
  );

  hoverTargets.forEach((target) => {
    target.addEventListener("pointerenter", () => cursor.classList.add("active"));
    target.addEventListener("pointerleave", () => cursor.classList.remove("active"));
  });
}
