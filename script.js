const themeToggle = document.querySelector(".theme-toggle");
const savedTheme = localStorage.getItem("theme");

const setTheme = (theme) => {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark", isDark);
  themeToggle.setAttribute(
    "aria-label",
    isDark ? "Switch to light theme" : "Switch to dark theme"
  );
};

setTheme(savedTheme);
themeToggle.addEventListener("click", () => {
  const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
  setTheme(nextTheme);
  localStorage.setItem("theme", nextTheme);
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

  document.documentElement.addEventListener("pointerleave", () => {
    cursor.classList.remove("visible", "active");
  });

  const hoverTargets = document.querySelectorAll("a, button, h1, h2, h3");

  hoverTargets.forEach((target) => {
    target.addEventListener("pointerenter", () => cursor.classList.add("active"));
    target.addEventListener("pointerleave", () => cursor.classList.remove("active"));
  });
}
