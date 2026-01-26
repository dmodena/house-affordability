let chart;

// Guardamos el último dataset cargado (overview o borough) para calcular el insight
let currentSeries = {
  title: "",
  years: [],
  house_price: [],
  annual_income: [],
};

// Guardamos los dos años seleccionados
let selectedYears = []; // e.g. [2012, 2020]

function moneyGBP(x) {
  return "£" + Number(x).toLocaleString("en-GB");
}

function pctChange(from, to) {
  if (from === 0 || from === null || from === undefined) return null;
  return ((to - from) / from) * 100;
}

function setInsightText(msg) {
  document.getElementById("insightText").textContent = msg;
}

function updateYearRangeUI() {
  const el = document.getElementById("yearRange");
  if (selectedYears.length === 0) el.textContent = "None";
  else if (selectedYears.length === 1)
    el.textContent = `${selectedYears[0]} (pick one more year)`;
  else el.textContent = `${selectedYears[0]} → ${selectedYears[1]}`;
}

function resetSelection() {
  selectedYears = [];
  updateYearRangeUI();
  setInsightText("Click two years on the chart to compare.");
}

function computeInsight() {
  if (selectedYears.length < 2) return;

  const [y1, y2] = selectedYears;
  const i1 = currentSeries.years.indexOf(y1);
  const i2 = currentSeries.years.indexOf(y2);

  if (i1 === -1 || i2 === -1) {
    setInsightText("Could not find data for the selected years.");
    return;
  }

  const hp1 = currentSeries.house_price[i1];
  const hp2 = currentSeries.house_price[i2];
  const inc1 = currentSeries.annual_income[i1];
  const inc2 = currentSeries.annual_income[i2];

  const hpPct = pctChange(hp1, hp2);
  const incPct = pctChange(inc1, inc2);

  const contextLabel = currentSeries.title; // "London overview..." o "Barnet"
  const hpMsg = hpPct === null ? "N/A" : `${hpPct.toFixed(1)}%`;
  const incMsg = incPct === null ? "N/A" : `${incPct.toFixed(1)}%`;

  const msg =
    `${contextLabel}: From ${y1} to ${y2}, house price went from ${moneyGBP(hp1)} to ${moneyGBP(hp2)} (${hpMsg}). ` +
    `Income went from ${moneyGBP(inc1)} to ${moneyGBP(inc2)} (${incMsg}).`;

  setInsightText(msg);
}

function renderChart(title, labels, house, income) {
  const ctx = document.getElementById("chart");
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels, // years
      datasets: [
        {
          label: "House price",
          data: house,
          tension: 0.2,
          pointRadius: 3,
          pointHitRadius: 12, // easier to click
        },
        {
          label: "Annual income",
          data: income,
          tension: 0.2,
          pointRadius: 3,
          pointHitRadius: 12,
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { mode: "nearest", intersect: true }, // helps clicking points
      plugins: {
        title: { display: true, text: title },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${moneyGBP(ctx.parsed.y)}`,
          },
        },
      },
      scales: {
        y: {
          ticks: { callback: (v) => moneyGBP(v) },
        },
      },

      // ✅ click handler (pick years)
      onClick: (_event, elements) => {
        if (!elements || elements.length === 0) return;

        // elements[0].index is the x-position (year index)
        const idx = elements[0].index;
        const year = Number(labels[idx]);

        // If already selected same year, ignore
        if (selectedYears.includes(year)) return;

        if (selectedYears.length === 0) {
          selectedYears = [year];
        } else if (selectedYears.length === 1) {
          selectedYears = [selectedYears[0], year].sort((a, b) => a - b);
        } else {
          // If already had 2, start a new selection with this year
          selectedYears = [year];
        }

        updateYearRangeUI();

        if (selectedYears.length === 2) {
          computeInsight();
        } else {
          setInsightText("Now click one more year to compare.");
        }
      },
    },
  });

  // Reset selection whenever we render a new chart (overview vs borough)
  resetSelection();
}

/**
 * NEW: Render chart with dotted forecast lines (2025–2030) using /api/forecast response
 * - history: {years, house_price, annual_income}
 * - forecast: {years, house_price:{yhat,lower,upper}, annual_income:{yhat,lower,upper}}
 */
function renderChartWithForecast(title, history, forecast) {
  const ctx = document.getElementById("chart");
  if (chart) chart.destroy();

  const labels = forecast.years; // full axis (e.g., 2002..2030)
  const lastHistYear = Math.max(...history.years);

  // Split: historical solid lines
  const houseHist = labels.map((y) => {
    const idx = history.years.indexOf(y);
    return idx !== -1 ? history.house_price[idx] : null;
  });

  const incomeHist = labels.map((y) => {
    const idx = history.years.indexOf(y);
    return idx !== -1 ? history.annual_income[idx] : null;
  });

  // Split: forecast dotted lines (only after last historical year)
  const houseFc = labels.map((y, i) =>
    y > lastHistYear ? forecast.house_price.yhat[i] : null,
  );
  const incomeFc = labels.map((y, i) =>
    y > lastHistYear ? forecast.annual_income.yhat[i] : null,
  );

  // Optional bands (upper/lower) for forecast only
  const houseUpper = labels.map((y, i) =>
    y > lastHistYear ? forecast.house_price.upper[i] : null,
  );
  const houseLower = labels.map((y, i) =>
    y > lastHistYear ? forecast.house_price.lower[i] : null,
  );
  const incUpper = labels.map((y, i) =>
    y > lastHistYear ? forecast.annual_income.upper[i] : null,
  );
  const incLower = labels.map((y, i) =>
    y > lastHistYear ? forecast.annual_income.lower[i] : null,
  );

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        // --- Historical (solid)
        {
          label: "House price (history)",
          data: houseHist,
          tension: 0.2,
          pointRadius: 3,
          pointHitRadius: 12,
        },
        {
          label: "Annual income (history)",
          data: incomeHist,
          tension: 0.2,
          pointRadius: 3,
          pointHitRadius: 12,
        },

        // --- Forecast (dotted)
        {
          label: "House price (forecast)",
          data: houseFc,
          tension: 0.2,
          pointRadius: 3,
          pointHitRadius: 12,
          borderDash: [6, 6],
        },
        {
          label: "Annual income (forecast)",
          data: incomeFc,
          tension: 0.2,
          pointRadius: 3,
          pointHitRadius: 12,
          borderDash: [6, 6],
        },

        // --- Optional uncertainty bands (drawn as fill between upper/lower)
        // House band
        {
          label: "House forecast (upper)",
          data: houseUpper,
          tension: 0.2,
          pointRadius: 0,
          borderWidth: 0,
        },
        {
          label: "House forecast (lower)",
          data: houseLower,
          tension: 0.2,
          pointRadius: 0,
          borderWidth: 0,
          fill: "-1",
        },

        // Income band
        {
          label: "Income forecast (upper)",
          data: incUpper,
          tension: 0.2,
          pointRadius: 0,
          borderWidth: 0,
        },
        {
          label: "Income forecast (lower)",
          data: incLower,
          tension: 0.2,
          pointRadius: 0,
          borderWidth: 0,
          fill: "-1",
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { mode: "nearest", intersect: true },
      plugins: {
        title: { display: true, text: title },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${moneyGBP(ctx.parsed.y)}`,
          },
        },
        legend: {
          labels: {
            // Hide the band legend items to keep UI clean (optional)
            filter: (legendItem) => {
              const t = legendItem.text || "";
              return !t.includes("(upper)") && !t.includes("(lower)");
            },
          },
        },
      },
      scales: {
        y: {
          ticks: { callback: (v) => moneyGBP(v) },
        },
      },
      onClick: (_event, elements) => {
        if (!elements || elements.length === 0) return;

        const idx = elements[0].index;
        const year = Number(labels[idx]);

        if (selectedYears.includes(year)) return;

        if (selectedYears.length === 0) {
          selectedYears = [year];
        } else if (selectedYears.length === 1) {
          selectedYears = [selectedYears[0], year].sort((a, b) => a - b);
        } else {
          selectedYears = [year];
        }

        updateYearRangeUI();

        if (selectedYears.length === 2) {
          computeInsight();
        } else {
          setInsightText("Now click one more year to compare.");
        }
      },
    },
  });

  resetSelection();
}

// -------------------------
// API loaders
// -------------------------
async function loadOverview() {
  const status = document.getElementById("status");
  status.textContent = "Loading London overview forecast...";

  const res = await fetch("/api/overview-forecast?years_ahead=6");
  if (!res.ok) {
    status.textContent = "Failed to load overview.";
    return;
  }

  const data = await res.json();
  status.textContent = data.title;

  // For insights, use the full-axis central forecast values
  currentSeries = {
    title: data.title,
    years: data.forecast.years,
    house_price: data.forecast.house_price.yhat,
    annual_income: data.forecast.annual_income.yhat,
  };

  renderChartWithForecast(data.title, data.history, data.forecast);
}

async function loadBorough() {
  const input = document.getElementById("boroughInput");
  const status = document.getElementById("status");
  const borough = input.value.trim();

  if (!borough) {
    loadOverview();
    return;
  }

  status.textContent = "Loading forecast...";

  // Use the forecast API (assumes your backend endpoint /api/forecast exists)
  const res = await fetch(
    `/api/forecast?borough=${encodeURIComponent(borough)}&years_ahead=6`,
  );

  if (!res.ok) {
    status.textContent = "Not found. (Try selecting from the list)";
    return;
  }

  const data = await res.json();
  status.textContent = `Showing: ${data.title}`;

  // For insights, use the full-axis central forecast values
  currentSeries = {
    title: data.title,
    years: data.forecast.years,
    house_price: data.forecast.house_price.yhat,
    annual_income: data.forecast.annual_income.yhat,
  };

  renderChartWithForecast(data.title, data.history, data.forecast);
}

// -------------------------
// Events
// -------------------------
document.getElementById("loadBtn").addEventListener("click", loadBorough);
document.getElementById("boroughInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") loadBorough();
});
document
  .getElementById("resetRangeBtn")
  .addEventListener("click", resetSelection);

// Default view on load
window.addEventListener("load", () => {
  loadOverview();
});
