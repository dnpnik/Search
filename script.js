const form = document.querySelector("#search-form");
const whereInput = document.querySelector("#where-input");
const whatInput = document.querySelector("#what-input");
const resultList = document.querySelector("#result-list");

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

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const where = whereInput.value.trim();
  const what = whatInput.value.trim();

  if (!where || !what) {
    return;
  }

  const now = new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

  const count = Math.max(7, Math.floor(Math.random() * 130));
  resultList.prepend(makeRow({
    query: what,
    place: where,
    count,
    time: `Сегодня, ${now}`,
  }));

  form.reset();
  whereInput.focus();
});
