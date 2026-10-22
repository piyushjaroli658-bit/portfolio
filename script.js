console.log("JavaScript connected");

// ===== Theme toggle =====

const themeButton = document.getElementById("themeToggle");

if (themeButton) {
  themeButton.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");

    const isDark = document.body.classList.contains("dark-mode");

    themeButton.textContent = isDark
      ? "Switch to Light Mode"
      : "Switch to Dark Mode";
  });
}

// ===== Weather widget =====

const cityInput = document.getElementById("cityInput");
const weatherButton = document.getElementById("weatherButton");
const weatherResult = document.getElementById("weatherResult");

async function getWeather() {
  const city = cityInput.value.trim();

  if (!city) {
    weatherResult.textContent = "Please enter a city.";
    return;
  }

  weatherButton.disabled = true;
  weatherResult.textContent = "Loading weather...";

  try {
    const response = await fetch(
      "/api/weather?city=" + encodeURIComponent(city)
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.error || "Unable to fetch weather."
      );
    }

    // Build the output safely without injecting HTML.
    weatherResult.replaceChildren();

    const cityHeading = document.createElement("h3");
    cityHeading.textContent = data.city;

    const temperature = document.createElement("p");
    temperature.textContent =
      "Temperature: " + data.temperature + "°C";

    const condition = document.createElement("p");
    condition.textContent =
      "Condition: " + data.condition;

    weatherResult.append(
      cityHeading,
      temperature,
      condition
    );
  } catch (error) {
    console.error("Weather request failed:", error.message);
    weatherResult.textContent =
      error.message || "Unable to fetch weather. Please try again.";
  } finally {
    weatherButton.disabled = false;
  }
}

if (weatherButton && cityInput && weatherResult) {
  weatherButton.addEventListener("click", getWeather);

  cityInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      getWeather();
    }
  });
}

// ===== Project search and filters =====

document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("projectSearch");
  const projectGrid = document.getElementById("projectGrid");
  const noResults = document.getElementById("noProjectsMessage");
  const filterButtons = document.querySelectorAll(".filter-button");

  if (!searchInput || !projectGrid || !noResults) {
    return;
  }

  const cards = Array.from(
    projectGrid.querySelectorAll(".project-card")
  );

  let activeFilter = "all";

  function filterProjects() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    let visibleCount = 0;

    cards.forEach(function (card) {
      const searchableText = (
        (card.dataset.title || "") + " " +
        (card.dataset.tech || "") + " " +
        card.textContent
      ).toLowerCase();

      const technologies = (card.dataset.tech || "")
        .toLowerCase()
        .split(/\s+/);

      const matchesSearch = searchableText.includes(searchTerm);
      const matchesFilter =
        activeFilter === "all" ||
        technologies.includes(activeFilter);

      const visible = matchesSearch && matchesFilter;

      card.hidden = !visible;

      if (visible) {
        visibleCount++;
      }
    });

    noResults.hidden = visibleCount > 0;
  }

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      activeFilter = button.dataset.filter || "all";

      filterButtons.forEach(function (other) {
        const active = other === button;

        other.classList.toggle("active", active);
        other.setAttribute("aria-pressed", String(active));
      });

      filterProjects();
    });
  });

  searchInput.addEventListener("input", filterProjects);

  filterProjects();
});
