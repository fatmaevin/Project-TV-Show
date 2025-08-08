// ==============================
// Global caches to avoid re-fetching
// ==============================
const showCache = {};     // Cache episodes per show ID
let allShows = [];        // Cached list of all shows
let currentEpisodes = []; // Currently displayed episodes

// ==============================
// Entry point - runs when page loads
// ==============================
document.addEventListener("DOMContentLoaded", setup);

function setup() {
  const root = document.getElementById("root");
  root.textContent = "Loading shows... Please wait."; // Show loading state

  // If we already have the list, just use it
  if (allShows.length > 0) {
    createShowSelector(allShows);
    loadEpisodesForShow(82); // Auto-load default show
  } else {
    // Fetch all shows from TVMaze API (one time only)
    fetch("https://api.tvmaze.com/shows")
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then(shows => {
        // Sort shows alphabetically (case-insensitive)
        allShows = shows.sort((a, b) =>
          a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        );

        root.textContent = ""; // Clear loading message
        createShowSelector(allShows);
        loadEpisodesForShow(82); // Auto-load default show on page load
      })
      .catch(err => {
        // Show error message in UI (not just console)
        root.textContent = "❌ Error loading shows. Please try again later.";
        console.error("Error fetching shows:", err);
      });
  }
}

// ==============================
// Creates dropdown to select a TV show
// ==============================
function createShowSelector(shows) {
  const root = document.getElementById("root");

  const container = document.createElement("div");
  container.id = "show-container";

  const select = document.createElement("select");
  select.id = "show-select";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select a show...";
  select.appendChild(defaultOption);

  // Populate dropdown with show names
  shows.forEach(show => {
    const option = document.createElement("option");
    option.value = show.id;
    option.textContent = show.name;
    select.appendChild(option);
  });

  container.appendChild(select);
  root.parentNode.insertBefore(container, root);

  // When a show is selected, load its episodes
  select.addEventListener("change", () => {
    const selectedId = select.value;
    if (selectedId) {
      loadEpisodesForShow(selectedId);
    }
  });
}

// ==============================
// Fetches episodes for a given show ID (from cache if available)
// ==============================
function loadEpisodesForShow(showId) {
  const root = document.getElementById("root");
  root.textContent = "Loading episodes..."; // Show loading state

  if (showCache[showId]) {
    // Already cached, render immediately
    renderShowEpisodes(showCache[showId]);
  } else {
    // Fetch episodes for the selected show
    fetch(`https://api.tvmaze.com/shows/${showId}/episodes`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then(episodes => {
        showCache[showId] = episodes; // Cache them for later
        renderShowEpisodes(episodes);
      })
      .catch(err => {
        root.textContent = "❌ Failed to load episodes for this show.";
        console.error("Error fetching episodes:", err);
      });
  }
}

// ==============================
// Renders episodes and search/filter controls
// ==============================
function renderShowEpisodes(episodes) {
  currentEpisodes = episodes;

  // Remove old UI elements before rendering new
  removeElementById("search-container");
  removeElementById("select-container");
  removeElementByClass("info-text");

  createSearchInput();
  createEpisodeSelector(currentEpisodes);
  makePageForEpisodes(currentEpisodes);
  updateInfoText(currentEpisodes.length, currentEpisodes.length);
  setupSearchAndSelector();
}

// ==============================
// Creates search input box
// ==============================
function createSearchInput() {
  const root = document.getElementById("root");
  const container = document.createElement("div");
  container.id = "search-container";

  const input = document.createElement("input");
  input.type = "text";
  input.id = "search-input";
  input.placeholder = "Search episodes by name or summary...";

  container.appendChild(input);
  root.parentNode.insertBefore(container, root);
}

// ==============================
// Creates episode selector dropdown
// ==============================
function createEpisodeSelector(episodeList) {
  const root = document.getElementById("root");
  const container = document.createElement("div");
  container.id = "select-container";

  const select = document.createElement("select");
  select.id = "episode-select";

  const defaultOption = document.createElement("option");
  defaultOption.value = "all";
  defaultOption.textContent = "Show All Episodes";
  select.appendChild(defaultOption);

  // Add each episode as dropdown option
  episodeList.forEach(ep => {
    const option = document.createElement("option");
    option.value = getEpisodeCode(ep);
    option.textContent = `${getEpisodeCode(ep)} - ${ep.name}`;
    select.appendChild(option);
  });

  container.appendChild(select);
  root.parentNode.insertBefore(container, root);
}

// ==============================
// Connects search box and dropdown filters
// ==============================
function setupSearchAndSelector() {
  const searchInput = document.getElementById("search-input");
  const episodeSelect = document.getElementById("episode-select");

  // Search by text
  searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.toLowerCase();
    episodeSelect.value = "all"; // Reset dropdown when searching

    const filtered = currentEpisodes.filter(ep => {
      const name = ep.name.toLowerCase();
      const summary = (ep.summary || "").toLowerCase();
      return name.includes(searchTerm) || summary.includes(searchTerm);
    });

    makePageForEpisodes(filtered);
    updateInfoText(filtered.length, currentEpisodes.length);
  });

  // Filter by selected episode
  episodeSelect.addEventListener("change", () => {
    const selectedValue = episodeSelect.value;
    searchInput.value = ""; // Clear search box

    if (selectedValue === "all") {
      makePageForEpisodes(currentEpisodes);
      updateInfoText(currentEpisodes.length, currentEpisodes.length);
    } else {
      const selectedEpisode = currentEpisodes.find(ep => getEpisodeCode(ep) === selectedValue);
      makePageForEpisodes(selectedEpisode ? [selectedEpisode] : []);
      updateInfoText(selectedEpisode ? 1 : 0, currentEpisodes.length);
    }
  });
}

// ==============================
// Renders episode cards to the page
// ==============================
function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = ""; // Clear previous content

  episodeList.forEach(ep => {
    const card = document.createElement("div");
    card.className = "episode-card";

    const title = document.createElement("h3");
    title.textContent = `${getEpisodeCode(ep)} - ${ep.name}`;

    const img = document.createElement("img");
    img.src = ep.image?.medium || "https://via.placeholder.com/210x295?text=No+Image";
    img.alt = `Image for ${ep.name}`;

    const summary = document.createElement("p");
    summary.innerHTML = ep.summary || "No summary available.";

    const link = document.createElement("a");
    link.href = ep.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "View on TVMaze";

    card.appendChild(title);
    card.appendChild(img);
    card.appendChild(summary);
    card.appendChild(link);

    rootElem.appendChild(card);
  });
}

// ==============================
// Shows number of displayed episodes
// ==============================
function updateInfoText(shownCount, totalCount) {
  let info = document.querySelector(".info-text");

  if (!info) {
    info = document.createElement("p");
    info.className = "info-text";
    const root = document.getElementById("root");
    root.parentNode.insertBefore(info, root.nextSibling);
  }

  info.textContent = `Showing ${shownCount} episode${shownCount !== 1 ? "s" : ""} of ${totalCount} total.`;
}

// ==============================
// Utility functions
// ==============================
function getEpisodeCode(episode) {
  const seasonStr = String(episode.season).padStart(2, "0");
  const episodeStr = String(episode.number).padStart(2, "0");
  return `S${seasonStr}E${episodeStr}`;
}

function removeElementById(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function removeElementByClass(className) {
  const el = document.querySelector(`.${className}`);
  if (el) el.remove();
}
