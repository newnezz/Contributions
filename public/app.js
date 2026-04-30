async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }
  return response.json();
}

function renderConfig(config) {
  const configView = document.getElementById("configView");
  configView.textContent = JSON.stringify(config, null, 2);
}

function renderCommits(feed) {
  const commitList = document.getElementById("commitList");
  const items = Array.isArray(feed.items) ? feed.items : [];
  if (items.length === 0) {
    commitList.innerHTML = "<li>No generated commits yet.</li>";
    return;
  }

  commitList.innerHTML = items
    .map((item) => {
      const when = item.timestamp ? new Date(item.timestamp).toLocaleString() : "Unknown time";
      const message = item.message || "(no message)";
      return `<li><code>${when}</code> - ${message}</li>`;
    })
    .join("");
}

async function init() {
  const commitList = document.getElementById("commitList");
  const configView = document.getElementById("configView");

  try {
    const [config, feed] = await Promise.all([
      loadJson("../config/commit-config.json"),
      loadJson("./commits.json")
    ]);
    renderConfig(config);
    renderCommits(feed);
  } catch (error) {
    commitList.innerHTML = `<li>Unable to load data: ${error.message}</li>`;
    configView.textContent = "Unable to load configuration.";
  }
}

init();
