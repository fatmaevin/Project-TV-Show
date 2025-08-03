//You can edit ALL of the code here
function setup() {
  const allEpisodes = getAllEpisodes();
  pageForEpisodes(allEpisodes);
}

function pageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = "";

  episodeList.forEach((episode) => {
    const seasonStr = episode.season.toString().padStart(2, "0");
    const episodeStr = episode.number.toString().padStart(2, "0");
    const code = `S${seasonStr}E${episodeStr}`;

    const divForEpisode = document.createElement("div");
    divForEpisode.className = "episode";

    const title = document.createElement("h2");
    title.textContent = `${episode.name} (${code})`;
    divForEpisode.appendChild(title);

    const image = document.createElement("img");
    image.src = episode.image.medium;
    image.alt = `Image for ${episode.name}`;
    divForEpisode.appendChild(image);

    const summary = document.createElement("div");
    summary.innerHTML = episode.summary;

    divForEpisode.appendChild(summary);

    rootElem.appendChild(divForEpisode);
  });

  const info = document.createElement("p");
  info.innerHTML =
    'Data from <a href="https://www.tvmaze.com/" target="_blank" rel="noopener noreferrer">TVMaze.com</a>';
  rootElem.appendChild(info);
}

window.onload = setup;
