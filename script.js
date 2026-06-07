const DATA_FILES = {
  episodes: "data/episodes.json",
  routes: "data/routes.json",
  characters: "data/characters.json",
  themes: "data/themes.json"
};

const STORAGE_KEY = "swvn.watchedEpisodes";
const state = {
  episodes: [],
  routes: [],
  characters: [],
  themes: [],
  watched: new Set(),
  selectedCategory: "all",
  selectedRouteId: null,
  selectedDifficulty: "complete",
  filters: {
    unwatched: false,
    important: false,
    movie: false,
    drama: false,
    anime: false
  },
  query: ""
};

const categoryLabels = {
  character: "キャラクター",
  theme: "テーマ",
  release: "新作映画"
};

const difficultyLabels = {
  shortest: "最短ルート",
  complete: "しっかりルート",
  cameo: "カメオ込み"
};

const dom = {
  searchInput: document.querySelector("#searchInput"),
  clearWatchedButton: document.querySelector("#clearWatchedButton"),
  routeList: document.querySelector("#routeList"),
  routeCount: document.querySelector("#routeCount"),
  routeDetail: document.querySelector("#routeDetail"),
  overallWatched: document.querySelector("#overallWatched"),
  overallTotal: document.querySelector("#overallTotal"),
  routeButtonTemplate: document.querySelector("#routeButtonTemplate"),
  episodeTemplate: document.querySelector("#episodeTemplate"),
  tabButtons: [...document.querySelectorAll(".tab-button")],
  homeCards: [...document.querySelectorAll(".home-card")]
};

init();

async function init() {
  loadWatched();
  const [episodes, routes, characters, themes] = await Promise.all([
    fetchJson(DATA_FILES.episodes),
    fetchJson(DATA_FILES.routes),
    fetchJson(DATA_FILES.characters),
    fetchJson(DATA_FILES.themes)
  ]);

  state.episodes = episodes;
  state.routes = routes;
  state.characters = characters;
  state.themes = themes;
  state.selectedRouteId = routes[0]?.id ?? null;
  bindEvents();
  render();
}

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`${path} を読み込めませんでした`);
  }
  return response.json();
}

function bindEvents() {
  dom.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    selectFirstVisibleRoute();
    renderRoutes();
    renderDetail();
  });

  dom.clearWatchedButton.addEventListener("click", () => {
    if (!state.watched.size) return;
    state.watched.clear();
    saveWatched();
    render();
  });

  dom.tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedCategory = button.dataset.category;
      selectFirstVisibleRoute();
      render();
    });
  });

  dom.homeCards.forEach((card) => {
    card.addEventListener("click", () => {
      state.selectedCategory = card.dataset.categoryJump;
      selectFirstVisibleRoute();
      render();
      document.querySelector(".content-grid").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function render() {
  renderTabs();
  renderRoutes();
  renderDetail();
  renderOverallProgress();
}

function renderTabs() {
  dom.tabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.category === state.selectedCategory);
  });
}

function renderRoutes() {
  const routes = getVisibleRoutes();
  dom.routeList.innerHTML = "";
  dom.routeCount.textContent = String(routes.length);

  if (!routes.length) {
    dom.routeList.innerHTML = '<div class="no-results">一致するルートがありません。</div>';
    return;
  }

  routes.forEach((route) => {
    const button = dom.routeButtonTemplate.content.firstElementChild.cloneNode(true);
    const progress = getRouteProgress(route, state.selectedDifficulty);
    button.classList.toggle("active", route.id === state.selectedRouteId);
    button.querySelector(".route-type").textContent = categoryLabels[route.category];
    button.querySelector("strong").textContent = route.name;
    button.querySelector(".route-meta").textContent = `${progress.watched}/${progress.total} 視聴済み`;
    button.querySelector(".progress-bar span").style.width = `${progress.percent}%`;
    button.addEventListener("click", () => {
      state.selectedRouteId = route.id;
      state.selectedDifficulty = getDefaultDifficulty(route);
      renderRoutes();
      renderDetail();
    });
    dom.routeList.append(button);
  });
}

function renderDetail() {
  const route = state.routes.find((item) => item.id === state.selectedRouteId);
  if (!route) {
    dom.routeDetail.className = "route-detail empty-state";
    dom.routeDetail.innerHTML = '<p class="kicker">No route</p><h2>表示できるルートがありません。</h2>';
    return;
  }

  const difficulty = route.difficulties[state.selectedDifficulty] ? state.selectedDifficulty : getDefaultDifficulty(route);
  state.selectedDifficulty = difficulty;
  const episodeIds = route.difficulties[difficulty] ?? [];
  const episodes = applyEpisodeFilters(episodeIds.map(getEpisodeById).filter(Boolean));
  const progress = getRouteProgress(route, difficulty);

  dom.routeDetail.className = "route-detail";
  dom.routeDetail.innerHTML = `
    <header class="detail-header">
      <p class="kicker">${categoryLabels[route.category]}ルート</p>
      <div>
        <h2>${escapeHtml(route.name)}</h2>
        <p>${escapeHtml(route.description)}</p>
      </div>
      <div class="difficulty-tabs" aria-label="難易度"></div>
    </header>
    <div class="route-stats">
      <div class="stat"><strong>${progress.percent}%</strong><span>進捗率</span></div>
      <div class="stat"><strong>${progress.total}</strong><span>対象エピソード</span></div>
      <div class="stat"><strong>${difficultyLabels[difficulty]}</strong><span>難易度</span></div>
    </div>
    <div class="filters" aria-label="フィルタ"></div>
    <div class="episode-list"></div>
  `;

  renderDifficultyButtons(route);
  renderFilters();
  renderEpisodes(episodes);
}

function renderDifficultyButtons(route) {
  const wrapper = dom.routeDetail.querySelector(".difficulty-tabs");
  Object.keys(route.difficulties).forEach((difficulty) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "difficulty-button";
    button.classList.toggle("active", difficulty === state.selectedDifficulty);
    button.textContent = difficultyLabels[difficulty];
    button.addEventListener("click", () => {
      state.selectedDifficulty = difficulty;
      renderRoutes();
      renderDetail();
    });
    wrapper.append(button);
  });
}

function renderFilters() {
  const filters = [
    ["unwatched", "未視聴のみ"],
    ["important", "重要回のみ"],
    ["movie", "映画のみ"],
    ["drama", "ドラマのみ"],
    ["anime", "アニメのみ"]
  ];
  const wrapper = dom.routeDetail.querySelector(".filters");

  filters.forEach(([key, label]) => {
    const item = document.createElement("label");
    item.className = "filter-check";
    item.innerHTML = `<input type="checkbox" ${state.filters[key] ? "checked" : ""}> <span>${label}</span>`;
    item.querySelector("input").addEventListener("change", (event) => {
      state.filters[key] = event.target.checked;
      renderDetail();
    });
    wrapper.append(item);
  });
}

function renderEpisodes(episodes) {
  const list = dom.routeDetail.querySelector(".episode-list");
  if (!episodes.length) {
    list.innerHTML = '<div class="no-results">条件に合うエピソードがありません。</div>';
    return;
  }

  episodes.forEach((episode) => {
    const card = dom.episodeTemplate.content.firstElementChild.cloneNode(true);
    const isWatched = state.watched.has(episode.id);
    card.classList.toggle("watched", isWatched);
    card.querySelector("input").checked = isWatched;
    card.querySelector("input").addEventListener("change", (event) => {
      setWatched(episode.id, event.target.checked);
    });
    card.querySelector(".episode-code").textContent = episodeCode(episode);
    card.querySelector("h3").textContent = episode.title;
    card.querySelector("p").textContent = episode.description;
    const tags = card.querySelector(".episode-tags");
    [...episode.characters, ...episode.themes].forEach((tag) => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = tag;
      tags.append(span);
    });
    list.append(card);
  });
}

function renderOverallProgress() {
  const ids = new Set(state.episodes.map((episode) => episode.id));
  const watched = [...state.watched].filter((id) => ids.has(id)).length;
  dom.overallWatched.textContent = String(watched);
  dom.overallTotal.textContent = String(ids.size);
}

function getVisibleRoutes() {
  return state.routes.filter((route) => {
    const categoryMatch = state.selectedCategory === "all" || route.category === state.selectedCategory;
    if (!categoryMatch) return false;
    if (!state.query) return true;
    const haystack = [
      route.name,
      route.description,
      route.category,
      ...Object.values(route.difficulties).flat().map((id) => {
        const episode = getEpisodeById(id);
        return episode ? stringifyEpisode(episode) : "";
      })
    ].join(" ").toLowerCase();
    return haystack.includes(state.query);
  });
}

function applyEpisodeFilters(episodes) {
  return episodes.filter((episode) => {
    if (state.query && !stringifyEpisode(episode).toLowerCase().includes(state.query)) return false;
    if (state.filters.unwatched && state.watched.has(episode.id)) return false;
    if (state.filters.important && episode.importance < 4) return false;
    if (state.filters.movie && episode.format !== "movie") return false;
    if (state.filters.drama && episode.format !== "drama") return false;
    if (state.filters.anime && episode.format !== "anime") return false;
    return true;
  });
}

function getRouteProgress(route, difficulty) {
  const ids = route.difficulties[difficulty] ?? route.difficulties[getDefaultDifficulty(route)] ?? [];
  const watched = ids.filter((id) => state.watched.has(id)).length;
  const total = ids.length;
  return {
    watched,
    total,
    percent: total ? Math.round((watched / total) * 100) : 0
  };
}

function getDefaultDifficulty(route) {
  return route.difficulties.complete ? "complete" : Object.keys(route.difficulties)[0];
}

function selectFirstVisibleRoute() {
  const route = getVisibleRoutes()[0];
  state.selectedRouteId = route?.id ?? null;
  state.selectedDifficulty = route ? getDefaultDifficulty(route) : "complete";
}

function getEpisodeById(id) {
  return state.episodes.find((episode) => episode.id === id);
}

function episodeCode(episode) {
  if (episode.format === "movie") return `${episode.series} 映画`;
  if (episode.format === "comic") return `${episode.series} コミック`;
  return `${episode.series} S${episode.season}E${episode.episode}`;
}

function stringifyEpisode(episode) {
  return [
    episode.series,
    episode.title,
    episode.description,
    episode.format,
    ...episode.characters,
    ...episode.themes
  ].join(" ");
}

function setWatched(id, watched) {
  if (watched) {
    state.watched.add(id);
  } else {
    state.watched.delete(id);
  }
  saveWatched();
  render();
}

function loadWatched() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    state.watched = new Set(Array.isArray(saved) ? saved : []);
  } catch {
    state.watched = new Set();
  }
}

function saveWatched() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.watched]));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
