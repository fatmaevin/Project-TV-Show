// Wait for the DOM to be fully loaded before running the setup function
document.addEventListener("DOMContentLoaded", setup);

/**
 * Entry point function that initializes the page.
 * - Fetches all episodes from the provided episodes.js file
 * - Creates search input and episode selector UI elements
 * - Renders the full list of episodes initially
 * - Adds event listeners for live search and episode selection filtering
 */
function setup() {
  const allEpisodes = getAllEpisodes(); // Fetch all episodes from episodes.js

  // Create search input box and episode selector dropdown above the episodes list
  createSearchInput();
  createEpisodeSelector(allEpisodes);

  // Display all episodes on initial load
  makePageForEpisodes(allEpisodes);

  // Grab references to the search input and episode selector elements
  const searchInput = document.getElementById("search-input");
  const episodeSelect = document.getElementById("episode-select");

  // Listen for input events on the search box to filter episodes live
  searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.toLowerCase(); // Lowercase for case-insensitive matching
    episodeSelect.value = "all"; // Reset dropdown to "Show All" when searching

    // Filter episodes where name or summary contains the search term
    const filtered = allEpisodes.filter(ep => {
      const name = ep.name.toLowerCase();
      const summary = (ep.summary || "").toLowerCase();
      return name.includes(searchTerm) || summary.includes(searchTerm);
    });

    // Re-render the filtered episodes list
    makePageForEpisodes(filtered);
    // Update the info text to show how many episodes are displayed out of total
    updateInfoText(filtered.length, allEpisodes.length);
  });

  // Listen for change events on the episode selector dropdown
  episodeSelect.addEventListener("change", () => {
    const selectedValue = episodeSelect.value;
    searchInput.value = ""; // Clear search input when using dropdown to avoid conflicting filters

    if (selectedValue === "all") {
      // If "Show All" selected, display all episodes
      makePageForEpisodes(allEpisodes);
      updateInfoText(allEpisodes.length, allEpisodes.length);
    } else {
      // Find the selected episode by its code (e.g., S01E01)
      const selectedEpisode = allEpisodes.find(ep => getEpisodeCode(ep) === selectedValue);
      // Show only the selected episode (or none if not found)
      makePageForEpisodes(selectedEpisode ? [selectedEpisode] : []);
      updateInfoText(1, allEpisodes.length);
    }
  });

  // Initially set info text to show total number of episodes
  updateInfoText(allEpisodes.length, allEpisodes.length);
}

/**
 * Creates and inserts a search input element above the episodes container (#root)
 * Allows users to filter episodes by name or summary.
 */
function createSearchInput() {
  const root = document.getElementById("root");

  // Create a container div for styling/layout
  const container = document.createElement("div");
  container.id = "search-container";

  // Create the text input element with placeholder text
  const input = document.createElement("input");
  input.type = "text";
  input.id = "search-input";
  input.placeholder = "Search episodes by name or summary...";

  // Add input box inside container
  container.appendChild(input);

  // Insert container just before the root element in the DOM
  root.parentNode.insertBefore(container, root);
}

/**
 * Creates and inserts a dropdown selector above the episodes container (#root)
 * Allows user to jump to a particular episode quickly.
 * @param {Array} episodeList - Array of episode objects
 */
function createEpisodeSelector(episodeList) {
  const root = document.getElementById("root");

  // Create container div for styling/layout
  const container = document.createElement("div");
  container.id = "select-container";

  // Create the <select> element
  const select = document.createElement("select");
  select.id = "episode-select";

  // Create and append default option to show all episodes
  const defaultOption = document.createElement("option");
  defaultOption.value = "all";
  defaultOption.textContent = "Show All Episodes";
  select.appendChild(defaultOption);

  // Create and append an option for each episode in the format "S01E01 - Episode Name"
  episodeList.forEach(ep => {
    const option = document.createElement("option");
    option.value = getEpisodeCode(ep); // Use episode code as option value
    option.textContent = `${getEpisodeCode(ep)} - ${ep.name}`;
    select.appendChild(option);
  });

  // Append the select dropdown to its container
  container.appendChild(select);

  // Insert container just before the root element, below the search input container
  root.parentNode.insertBefore(container, root);
}

/**
 * Renders a list of episodes inside the root element.
 * @param {Array} episodeList - Array of episode objects to render
 */
function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = ""; // Clear any existing episodes

  // Loop through episodes and create card elements for each
  episodeList.forEach(ep => {
    const card = document.createElement("div");
    card.className = "episode-card"; // CSS class for styling cards

    // Create title showing episode code and name
    const title = document.createElement("h3");
    title.textContent = `${getEpisodeCode(ep)} - ${ep.name}`;

    // Create episode image element (fallback to placeholder if no image)
    const img = document.createElement("img");
    img.src = ep.image?.medium || "placeholder.jpg";
    img.alt = `Image for ${ep.name}`;

    // Create summary paragraph (use default text if summary missing)
    const summary = document.createElement("p");
    summary.innerHTML = ep.summary || "No summary available.";

    // Create link to episode page on TVMaze
    const link = document.createElement("a");
    link.href = ep.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "View on TVMaze";

    // Append all created elements to the card container
    card.appendChild(title);
    card.appendChild(img);
    card.appendChild(summary);
    card.appendChild(link);

    // Append the card to the root element in the DOM
    rootElem.appendChild(card);
  });
}

/**
 * Updates or creates an info text paragraph below the episodes list,
 * showing how many episodes are currently displayed out of total episodes.
 * @param {number} shownCount - Number of episodes currently shown
 * @param {number} totalCount - Total number of episodes available
 */
function updateInfoText(shownCount, totalCount) {
  let info = document.querySelector(".info-text"); // Check if info paragraph exists

  if (!info) {
    // If it doesn't exist, create it
    info = document.createElement("p");
    info.className = "info-text";

    // Insert info paragraph right after the root episodes container
    const root = document.getElementById("root");
    root.parentNode.insertBefore(info, root.nextSibling);
  }

  // Update the text content to reflect the current count of shown episodes
  info.textContent = `Showing ${shownCount} episode${shownCount !== 1 ? "s" : ""} of ${totalCount} total.`;
}

/**
 * Helper function to format the episode code as "S01E02"
 * Pads season and episode numbers with leading zeros if needed.
 * @param {Object} episode - Episode object with season and number properties
 * @returns {string} Formatted episode code (e.g., "S01E02")
 */
function getEpisodeCode(episode) {
  const seasonStr = String(episode.season).padStart(2, "0");
  const episodeStr = String(episode.number).padStart(2, "0");
  return `S${seasonStr}E${episodeStr}`;
}
