const showCache = {};
let allShows = [];
let currentEpisodes = [];
let root;

document.addEventListener("DOMContentLoaded", setup);

function setup() {
  root = document.getElementById("root");
  showLoading("Loading shows... Please wait.");

  fetch("https://api.tvmaze.com/shows")
    .then((res) => res.json())
    .then((shows) => {
      allShows = shows.sort((a, b) =>
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      );
      renderShowListing(allShows);
    })
    .catch((err) => {
      showError("❌ Error loading shows.");
      console.error(err);
    });
}

function showLoading(msg) {
  root.innerHTML = `<p>${msg}</p>`;
}

function showError(msg) {
  root.innerHTML = `<p style="color:red;">${msg}</p>`;
}

function renderShowListing(shows) {
  root.innerHTML = "";

  const searchContainer = document.createElement("div");
  searchContainer.id = "searchContainer";

  const searchInputLabel = document.createElement("label");
  searchInputLabel.setAttribute("for", "searchInput");
  searchInputLabel.textContent = "Search Shows: ";

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.id = "searchInput";
  searchInput.placeholder = "Search shows by name, genres, or summary...";

  const searchDropdownLabel = document.createElement("label");
  searchDropdownLabel.setAttribute("for", "searchDropdown");
  searchDropdownLabel.textContent = " Select  result: ";

  const searchDropdown = document.createElement("select");
  searchDropdown.id = "searchDropdown";
  searchDropdown.innerHTML = `<option value="">Select a result...</option>`;

  const infoSpan = document.createElement("span");

  const searchGroup1 = document.createElement("div");
  searchGroup1.className = "search-group";
  searchGroup1.appendChild(searchInputLabel);
  searchGroup1.appendChild(searchInput);

  const searchGroup2 = document.createElement("div");
  searchGroup2.className = "search-group";
  searchGroup2.appendChild(searchDropdownLabel);
  searchGroup2.appendChild(searchDropdown);

  searchContainer.appendChild(searchGroup1);
  searchContainer.appendChild(searchGroup2);
  searchContainer.appendChild(infoSpan);

  root.appendChild(searchContainer);

  const showList = document.createElement("div");
  root.appendChild(showList);

  function displayShows(list) {
    showList.innerHTML = "";
    list.forEach((show) => {
      const card = document.createElement("div");
      card.className = "show-card";

      const title = document.createElement("h2");
      title.textContent = show.name;
      title.style.cursor = "pointer";
      title.addEventListener("click", () => {
        loadEpisodesForShow(show.id);
      });

      const img = document.createElement("img");
      img.src =
        show.image?.medium ||
        "https://via.placeholder.com/210x295?text=No+Image";
      img.alt = show.name;

      const summary = document.createElement("p");
      summary.innerHTML = show.summary || "No summary available.";

      const details = document.createElement("p");
      details.innerHTML = `
        <strong>Rated:</strong> ${show.rating?.average || "N/A"}<br>
        <strong>Genres:</strong> ${show.genres.join(" | ") || "N/A"}<br>
        <strong>Status:</strong> ${show.status || "N/A"}<br>
        <strong>Runtime:</strong> ${show.runtime || "N/A"}
      `;

      card.appendChild(title);
      card.appendChild(img);
      card.appendChild(summary);
      card.appendChild(details);

      showList.appendChild(card);
    });
    infoSpan.textContent = `Found ${list.length} shows`;
  }

  searchInput.addEventListener("input", () => {
    const term = searchInput.value.toLowerCase();
    const filtered = allShows.filter(
      (show) =>
        show.name.toLowerCase().includes(term) ||
        show.genres.join(" ").toLowerCase().includes(term) ||
        (show.summary || "").toLowerCase().includes(term)
    );

    searchDropdown.innerHTML = `<option value="">Select a result...</option>`;
    filtered.forEach((show) => {
      const opt = document.createElement("option");
      opt.value = show.id;
      opt.textContent = show.name;
      searchDropdown.appendChild(opt);
    });

    displayShows(filtered);
  });

  searchDropdown.addEventListener("change", () => {
    if (searchDropdown.value) {
      loadEpisodesForShow(searchDropdown.value);
    }
  });

  displayShows(shows);
}

function loadEpisodesForShow(showId) {
  showLoading("Loading episodes...");

  if (showCache[showId]) {
    renderEpisodeListing(showCache[showId]);
  } else {
    fetch(`https://api.tvmaze.com/shows/${showId}/episodes`)
      .then((res) => res.json())
      .then((episodes) => {
        showCache[showId] = episodes;
        renderEpisodeListing(episodes);
      })
      .catch((err) => {
        showError("❌ Failed to load episodes.");
        console.error(err);
      });
  }
}

function renderEpisodeListing(episodes) {
  currentEpisodes = episodes;
  root.innerHTML = "";

  const backBtn = document.createElement("button");
  backBtn.textContent = " Back to Shows";
  backBtn.addEventListener("click", () => renderShowListing(allShows));
  root.appendChild(backBtn);

  const controls = document.createElement("div");

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = "Search episodes...";

  const episodeSelect = document.createElement("select");
  const defaultOption = document.createElement("option");
  defaultOption.value = "all";
  defaultOption.textContent = "Show All Episodes";
  episodeSelect.appendChild(defaultOption);

  episodes.forEach((ep) => {
    const option = document.createElement("option");
    option.value = getEpisodeCode(ep);
    option.textContent = `${getEpisodeCode(ep)} - ${ep.name}`;
    episodeSelect.appendChild(option);
  });

  const infoSpan = document.createElement("span");

  controls.appendChild(searchInput);
  controls.appendChild(episodeSelect);
  controls.appendChild(infoSpan);
  root.appendChild(controls);

  searchInput.addEventListener("input", () => {
    const term = searchInput.value.toLowerCase();
    episodeSelect.value = "all";
    const filtered = currentEpisodes.filter(
      (ep) =>
        ep.name.toLowerCase().includes(term) ||
        (ep.summary || "").toLowerCase().includes(term)
    );
    makePageForEpisodes(filtered);
    infoSpan.textContent = `Showing ${filtered.length} of ${currentEpisodes.length}`;
  });

  episodeSelect.addEventListener("change", () => {
    searchInput.value = "";
    if (episodeSelect.value === "all") {
      makePageForEpisodes(currentEpisodes);
      infoSpan.textContent = `Showing ${currentEpisodes.length} of ${currentEpisodes.length}`;
    } else {
      const selected = currentEpisodes.find(
        (ep) => getEpisodeCode(ep) === episodeSelect.value
      );
      makePageForEpisodes(selected ? [selected] : []);
      infoSpan.textContent = `Showing ${selected ? 1 : 0} of ${
        currentEpisodes.length
      }`;
    }
  });

  makePageForEpisodes(episodes);
  infoSpan.textContent = `Showing ${episodes.length} of ${episodes.length}`;
}

function makePageForEpisodes(episodeList) {
  document.querySelectorAll(".episode-card").forEach((el) => el.remove());

  episodeList.forEach((ep) => {
    const card = document.createElement("div");
    card.className = "episode-card";

    const title = document.createElement("h3");
    title.textContent = `${getEpisodeCode(ep)} - ${ep.name}`;

    const img = document.createElement("img");
    img.src =
      ep.image?.medium || "https://via.placeholder.com/210x295?text=No+Image";

    const summary = document.createElement("p");
    summary.innerHTML = ep.summary || "No summary available.";

    root.appendChild(card);
    card.appendChild(title);
    card.appendChild(img);
    card.appendChild(summary);
  });
}

function getEpisodeCode(episode) {
  const seasonStr = String(episode.season).padStart(2, "0");
  const episodeStr = String(episode.number).padStart(2, "0");
  return `S${seasonStr}E${episodeStr}`;
}
