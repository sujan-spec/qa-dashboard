const SHEET_ID = "1B1cwUPkMjnDnH9LWM014qTcDG7-SdP3lnWViI9b05pY";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

let allData = [];
let chart;

async function loadData() {
    const response = await fetch(SHEET_URL);
    const text = await response.text();

    const json = JSON.parse(text.substring(47).slice(0, -2));
    const rows = json.table.rows;

    allData = rows.map(row => ({
        jira: row.c[0]?.v || "",
        qa: row.c[1]?.v || "",
        type: row.c[2]?.v || "",
        dev: row.c[3]?.v || "",
        priority: row.c[4]?.v || "",
        complexity: row.c[5]?.v || "",
        status: row.c[6]?.v || ""
    }));

    applyFilters(); // 👈 Important
}

function applyFilters() {
    const searchValue = document.getElementById("searchInput").value.toLowerCase();
    const qaValue = document.getElementById("qaFilter").value;
    const statusValue = document.getElementById("statusFilter").value;

    let filteredData = allData.filter(task => {

        const matchSearch = task.jira.toLowerCase().includes(searchValue);
        const matchQA = qaValue === "" || task.qa === qaValue;
        const matchStatus = statusValue === "" || task.status === statusValue;

        return matchSearch && matchQA && matchStatus;
    });

    updateDashboard(filteredData);
}

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

    document.getElementById("totalTasks").innerText = data.length;
    document.getElementById("p1Tasks").innerText =
        data.filter(t => t.priority === "P1").length;

    document.getElementById("liveTasks").innerText =
        data.filter(t => t.status === "LIVE").length;

    document.getElementById("uatTasks").innerText =
        data.filter(t => t.status === "UAT").length;

    updateChart(data);
}

function updateChart(data) {
    const qaCounts = {};

    data.forEach(task => {
        qaCounts[task.qa] = (qaCounts[task.qa] || 0) + 1;
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
        }
    });
}

/* 🔥 IMPORTANT CHANGE HERE */
document.querySelector("button").addEventListener("click", applyFilters);

loadData();