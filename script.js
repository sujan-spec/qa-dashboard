const SHEET_ID = "1B1cwUPkMjnDnH9LWM014qTcDG7-SdP3lnWViI9b05pY";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

let allData = [];
let chart;

/* =========================
   LOAD DATA FROM SHEET
========================= */
async function loadData() {
    try {
        const response = await fetch(SHEET_URL);
        const text = await response.text();

        const json = JSON.parse(text.substring(47).slice(0, -2));
        const rows = json.table.rows;

        allData = rows.map(row => ({
            jira: row.c[0]?.v?.toString().trim() || "",
            qa: row.c[1]?.v?.toString().trim() || "",
            type: row.c[2]?.v?.toString().trim() || "",
            dev: row.c[3]?.v?.toString().trim() || "",
            priority: row.c[4]?.v?.toString().trim() || "",
            complexity: row.c[5]?.v?.toString().trim() || "",
            status: row.c[6]?.v?.toString().trim() || ""
        }));

        applyFilters();

    } catch (error) {
        console.error("Error loading data:", error);
    }
}

/* =========================
   APPLY FILTERS
========================= */
function applyFilters() {

    const searchValue = document.getElementById("searchInput").value.toLowerCase().trim();
    const qaValue = document.getElementById("qaFilter").value.toLowerCase().trim();
    const statusValue = document.getElementById("statusFilter").value.toLowerCase().trim();

    const filteredData = allData.filter(task => {

        const matchSearch =
            task.jira.toLowerCase().includes(searchValue);

        const matchQA =
            qaValue === "" ||
            task.qa.toLowerCase() === qaValue;

        const matchStatus =
            statusValue === "" ||
            task.status.toLowerCase() === statusValue;

        return matchSearch && matchQA && matchStatus;
    });

    updateDashboard(filteredData);
}

/* =========================
   UPDATE TABLE + CARDS
========================= */
function updateDashboard(data) {

    const tbody = document.querySelector("#taskTable tbody");
    tbody.innerHTML = "";

    data.forEach(task => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${task.jira}</td>
            <td>${task.qa}</td>
            <td>${task.type}</td>
            <td>${task.dev}</td>
            <td>${task.priority}</td>
            <td>${task.complexity}</td>
            <td>${task.status}</td>
        `;
        tbody.appendChild(tr);
    });

    // Summary Cards
    document.getElementById("totalTasks").innerText = data.length;

    document.getElementById("p1Tasks").innerText =
        data.filter(t => t.priority.toLowerCase() === "p1").length;

    document.getElementById("liveTasks").innerText =
        data.filter(t => t.status.toLowerCase() === "live").length;

    document.getElementById("uatTasks").innerText =
        data.filter(t => t.status.toLowerCase() === "uat").length;

    updateChart(data);
}

/* =========================
   UPDATE CHART
========================= */
function updateChart(data) {

    const qaCounts = {};

    data.forEach(task => {
        if (task.qa) {
            qaCounts[task.qa] = (qaCounts[task.qa] || 0) + 1;
        }
    });

    const ctx = document.getElementById("qaChart").getContext("2d");

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: Object.keys(qaCounts),
            datasets: [{
                label: "Tasks per QA",
                data: Object.values(qaCounts)
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

/* =========================
   EVENT LISTENERS
========================= */
document.querySelector("button").addEventListener("click", applyFilters);

document.getElementById("searchInput").addEventListener("keyup", applyFilters);

/* =========================
   INITIAL LOAD
========================= */
loadData();