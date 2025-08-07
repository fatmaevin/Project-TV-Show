// Global session-level caches
const showCache = {};     // { showId: episodes[] }
let allShows = [];        // Cached show list (alphabetical)
let currentEpisodes = []; // Currently displayed episodes

document.addEventListener("DOMContentLoaded", setup);

/**
 * Entry point: Loads show list and creates show selector (once per session)
 */
function setup() {
  if (allShows.length > 0) {
    createShowSelector(allShows); // Use cached show list
  } else {
    fetch("https://api.tvmaze.com/shows")
      .then(res => res.json())
      .then(shows => {
        allShows = shows.sort((a, b) =>
          a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        );
        createShowSelector(allShows);
      })
      .catch(err => console.error("Error fetching shows:", err));
  }
}

/**
 * Create dropdown to select a TV show
 */
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

  shows.forEach(show => {
    const option = document.createElement("option");
    option.value = show.id;
    option.textContent = show.name;
    select.appendChild(option);
  });

  container.appendChild(select);
  root.parentNode.insertBefore(container, root);

  select.addEventListener("change", () => {
    const selectedId = select.value;
    if (selectedId) {
      loadEpisodesForShow(selectedId);
    }
  });
}

/**
 * Load episodes from cache or fetch them once per session
 */
function loadEpisodesForShow(showId) {
  if (showCache[showId]) {
    renderShowEpisodes(showCache[showId]);
  } else {
    fetch(`https://api.tvmaze.com/shows/${showId}/episodes`)
      .then(res => res.json())
      .then(episodes => {
        showCache[showId] = episodes; // Cache it
        renderShowEpisodes(episodes);
      })
      .catch(err => console.error("Error fetching episodes:", err));
  }
}

/**
 * Render all UI for the selected show's episodes
 */
function renderShowEpisodes(episodes) {
  currentEpisodes = episodes;

  // Clear previous UI if present
  removeElementById("search-container");
  removeElementById("select-container");
  removeElementByClass("info-text");

  createSearchInput();
  createEpisodeSelector(currentEpisodes);
  makePageForEpisodes(currentEpisodes);
  updateInfoText(currentEpisodes.length, currentEpisodes.length);
  setupSearchAndSelector();
}

/**
 * Creates the search input
 */
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

/**
 * Creates the episode dropdown for selected show
 */
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

  episodeList.forEach(ep => {
    const option = document.createElement("option");
    option.value = getEpisodeCode(ep);
    option.textContent = `${getEpisodeCode(ep)} - ${ep.name}`;
    select.appendChild(option);
  });

  container.appendChild(select);
  root.parentNode.insertBefore(container, root);
}

/**
 * Sets up search input and episode selector filtering
 */
function setupSearchAndSelector() {
  const searchInput = document.getElementById("search-input");
  const episodeSelect = document.getElementById("episode-select");

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

  episodeSelect.addEventListener("change", () => {
    const selectedValue = episodeSelect.value;
    searchInput.value = ""; // Clear search when selecting

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

/**
 * Renders a list of episode cards
 */
function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = ""; // Clear all existing content

  episodeList.forEach(ep => {
    const card = document.createElement("div");
    card.className = "episode-card";

    const title = document.createElement("h3");
    title.textContent = `${getEpisodeCode(ep)} - ${ep.name}`;

    const img = document.createElement("img");
    img.src = ep.image?.medium || "placeholder.jpg";
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

/**
 * Displays number of shown episodes out of total
 */
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

/**
 * Returns formatted episode code like S01E03
 */
function getEpisodeCode(episode) {
  const seasonStr = String(episode.season).padStart(2, "0");
  const episodeStr = String(episode.number).padStart(2, "0");
  return `S${seasonStr}E${episodeStr}`;
}

/**
 * Utility to remove an element by ID
 */
function removeElementById(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

/**
 * Utility to remove first element by class name
 */
function removeElementByClass(className) {
  const el = document.querySelector(`.${className}`);
  if (el) el.remove();
}
