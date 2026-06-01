const form = document.querySelector("#search-form");
const whereInput = document.querySelector("#where-input");
const whatInput = document.querySelector("#what-input");
const resultList = document.querySelector("#result-list");
const resultsTitle = document.querySelector("#results-title");
const searchButton = document.querySelector(".search-button");
const saveButton = document.querySelector("#save-button");
let latestResultJson = "";

const setSaveStatus = (message) => {
  resultsTitle.dataset.status = message;
};

const makeRow = ({ query, place, count, time }) => {
  const row = document.createElement("article");
  row.className = "result-row";
  row.setAttribute("role", "row");

  row.innerHTML = `
    <div class="query-cell" role="cell">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9"></circle>
        <path d="M12 7v5l3 2"></path>
      </svg>
      <strong></strong>
    </div>
    <div class="place-cell" role="cell"></div>
    <div role="cell"><span class="count-pill"></span></div>
    <div role="cell"></div>
    <button class="row-menu" type="button" aria-label="Действия">...</button>
  `;

  row.querySelector("strong").textContent = query;
  row.querySelector(".place-cell").textContent = place;
  row.querySelector(".count-pill").textContent = count;
  row.querySelector("[role='cell']:nth-of-type(4)").textContent = time;
  row.querySelector(".row-menu").setAttribute("aria-label", `Действия для ${query}`);

  return row;
};

const saveSearchResult = async (result) => {
  const response = await fetch("/api/search-results", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(result),
  });

  if (!response.ok) {
    throw new Error("Search result was not saved");
  }

  return response.json();
};

const setLatestResult = (result) => {
  latestResultJson = JSON.stringify(result);
  saveButton.dataset.result = latestResultJson;
};

const getLatestResult = () => {
  const resultJson = saveButton.dataset.result || latestResultJson;

  if (!resultJson) {
    return null;
  }

  try {
    return JSON.parse(resultJson);
  } catch {
    return null;
  }
};

const buildResultFromInputs = () => {
  const where = whereInput.value.trim();
  const what = whatInput.value.trim();

  if (!where || !what) {
    return null;
  }

  const now = new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

  const count = Math.max(7, Math.floor(Math.random() * 130));
  const result = {
    query: what,
    place: where,
    count,
    time: `Сегодня, ${now}`,
    savedAt: new Date().toISOString(),
  };
};

const runSearch = () => {
  const result = buildResultFromInputs();

  if (!result) {
    setSaveStatus("Заполните оба поля");
    return false;
  }

  resultList.prepend(makeRow(result));
  setLatestResult(result);
  setSaveStatus("Нажмите «Сохранить»");

  form.reset();
  whereInput.focus();
  return true;
};

form.addEventListener("submit", (event) => {
  event.preventDefault();
  runSearch();
});

searchButton.addEventListener("click", (event) => {
  event.preventDefault();
  runSearch();
});

saveButton.addEventListener("click", async () => {
  const result = getLatestResult() || buildResultFromInputs();

  if (!result) {
    setSaveStatus("Сначала заполните поля");
    whereInput.focus();
    return;
  }

  setSaveStatus("Сохранение...");
  saveButton.disabled = true;

  try {
    await saveSearchResult(result);
    setSaveStatus("Сохранено на ПК");
    latestResultJson = "";
    delete saveButton.dataset.result;
  } catch {
    setSaveStatus("Локальный сервер не запущен");
  } finally {
    saveButton.disabled = false;
  }
});
