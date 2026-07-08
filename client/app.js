const LOG_STORAGE_KEY = "latency_log";

const statsEl = document.getElementById("stats");
const moviesEl = document.getElementById("movies");
const logBodyEl = document.getElementById("log-body");
const regionInput = document.getElementById("region-label");

function loadLog() {
  const raw = localStorage.getItem(LOG_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveLog(log) {
  localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(log));
}

function renderLog() {
  const log = loadLog();
  logBodyEl.innerHTML = log
    .map(
      (row, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${row.region}</td>
        <td>${row.localTime}</td>
        <td>${row.roundTripMs}</td>
        <td>${row.serverMs}</td>
        <td>${row.networkMs}</td>
      </tr>`,
    )
    .join("");
}

function renderMovies(movies) {
  moviesEl.innerHTML = movies
    .map(
      (m) => `
      <div class="movie-card">
        <h3>${m.title}</h3>
        <p>${m.overview || ""}</p>
      </div>`,
    )
    .join("");
}

async function runTest() {
  const region = regionInput.value.trim() || "unlabeled";
  statsEl.textContent = "Testing...";

  const start = performance.now();
  let data;
  try {
    const response = await fetch(`${API_BASE_URL}/api/movie/`);
    data = await response.json();
  } catch (err) {
    statsEl.textContent = `Request failed: ${err.message}`;
    return;
  }
  const roundTripMs = Math.round(performance.now() - start);

  if (data.error) {
    statsEl.textContent = `Server error: ${data.error}`;
    return;
  }

  const serverMs = Math.round(data.meta.tmdb_fetch_ms);
  const networkMs = Math.max(roundTripMs - serverMs, 0);

  statsEl.innerHTML = `
    <div><strong>Region:</strong> ${region}</div>
    <div><strong>Round-trip:</strong> ${roundTripMs} ms</div>
    <div><strong>Server processing (TMDB fetch):</strong> ${serverMs} ms</div>
    <div><strong>Estimated network latency:</strong> ${networkMs} ms</div>
  `;

  renderMovies(data.movies);

  const log = loadLog();
  log.push({
    region,
    localTime: new Date().toLocaleString(),
    roundTripMs,
    serverMs,
    networkMs,
  });
  saveLog(log);
  renderLog();
}

function clearLog() {
  localStorage.removeItem(LOG_STORAGE_KEY);
  renderLog();
}

function exportCsv() {
  const log = loadLog();
  const header = "region,round_trip_ms,server_ms,network_ms";
  const rows = log.map(
    (r) => `${r.region},${r.roundTripMs},${r.serverMs},${r.networkMs}`,
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "latency-log.csv";
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById("test-btn").addEventListener("click", runTest);
document.getElementById("clear-btn").addEventListener("click", clearLog);
document.getElementById("export-btn").addEventListener("click", exportCsv);

renderLog();
