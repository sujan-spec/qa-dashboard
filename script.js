const SHEET_ID = "1B1cwUPkMjnDnH9LWM014qTcDG7-SdP3lnWViI9b05pY";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

let allData = [];
let chart;

/* =========================
   LOAD DATA FROM GOOGLE SHEET
========================= */
async function loadData() {
    try {
        const response = await fetch(SHEET_URL);
        const text = await response.text();

        const json = JSON.parse(text.substring(47).slice(0, -2));
        const rows = json.table.rows;

        // ✅ Correct Column Mapping Based On Your Sheet
        allData = rows.map(row => ({
            qa: row.c[0]?.v || "",
            jira: row.c[1]?.v || "",
            relatedJira: row.c[2]?.v || "",
            type: row.c[3]?.v || "",
            status: row.c[4]?.v || "",
            etaSujan: row.c[5]?.v || "",
            etaAssignee: row.c[6]?.v || "",
            jiraLink: row.c[7]?.v || "",
            developer: row.c[8]?.v || "",
            priority: row.c[9]?.v || "",
            complexity: row.c[10]?.v || "",
            qaRelease: formatDate(row.c[11]?.v),
            clientRelease: formatDate(row.c[12]?.v),
            buildQA: row.c[13]?.v || "",
            remarks: row.c[14]?.v || ""

        }));

        applyFilters();

    } catch (error) {
        console.error("Error loading data:", error);
    }
}


function formatDate(value) {
    if (!value) return "";

    // If already normal string (like from text column)
    if (typeof value === "string" && !value.startsWith("Date(")) {
        return value;
    }

    // Convert Date(2026,1,17) format
    const match = value.match(/Date\((\d+),(\d+),(\d+)\)/);

    if (!match) return value;

    const year = parseInt(match[1]);
    const month = parseInt(match[2]);
    const day = parseInt(match[3]);

    const date = new Date(year, month, day);

    return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

/* =========================
   APPLY FILTERS
========================= */
function applyFilters() {

    const searchValue = document.getElementById("searchInput").value.toLowerCase().trim();
    const qaValue = document.getElementById("qaFilter").value.toLowerCase().trim();
    const statusValue = document.getElementById("statusFilter").value.toLowerCase().trim();

    const filteredData = allData.filter(task => {

        const jira = task.jira.toLowerCase();
        const qa = task.qa.toLowerCase();
        const status = task.status.toLowerCase();

        const matchSearch =
            searchValue === "" || jira.includes(searchValue);

        const matchQA =
            qaValue === "" || qa.includes(qaValue);

        const matchStatus =
            statusValue === "" || status === statusValue;

        return matchSearch && matchQA && matchStatus;
    });

    updateDashboard(filteredData);
}

/* =========================
   UPDATE TABLE + SUMMARY
========================= */
function updateDashboard(data) {

    const tbody = document.querySelector("#taskTable tbody");
tbody.innerHTML = "";

if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="15" style="text-align:center;padding:20px;">
                    No Data Available
                </td>
            </tr>
        `;
        return;
    }

data.forEach(task => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
    <td>${task.qa || "-"}</td>
            <td>${task.jira || "-"}</td>
            <td>${task.relatedJira || "-"}</td>
            <td>${task.type || "-"}</td>
            <td>${task.status || "-"}</td>
            <td>${task.etaSujan || "-"}</td>
            <td>${task.etaAssignee || "-"}</td>
            <td>${task.jiraLink ? "View" : "-"}</td>
            <td>${task.developer || "-"}</td>
            <td>${task.priority || "-"}</td>
            <td>${task.complexity || "-"}</td>
            <td>${task.qaRelease || "-"}</td>
            <td>${task.clientRelease || "-"}</td>
            <td>${task.buildQA || "-"}</td>
            <td>${task.remarks || "-"}</td>
`;

    tbody.appendChild(tr);
});


    // ✅ Summary Cards
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

    // 🔥 Gradient for modern look
    const gradient = ctx.createLinearGradient(0, 0, 0, 220);
    gradient.addColorStop(0, "#4f46e5");
    gradient.addColorStop(1, "#06b6d4");

    const values = Object.values(qaCounts);

    chart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: Object.keys(qaCounts),
            datasets: [{
                data: values,
                backgroundColor: gradient,
                borderRadius: 8,
                borderSkipped: false,
                barThickness: 25,
                maxBarThickness: 30
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 800,
                easing: "easeOutQuart"
            },
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMax: Math.max(...values) + 1,
                    ticks: {
                        stepSize: 1,
                        precision: 0
                    },
                    grid: {
                        color: "rgba(0,0,0,0.05)"
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: "#111827",
                    padding: 10,
                    cornerRadius: 6
                }
            }
        }
    });
}

/* =========================
   EVENT LISTENERS
========================= */

// Button click
document.querySelector("button").addEventListener("click", applyFilters);

// Live search while typing
document.getElementById("searchInput").addEventListener("keyup", applyFilters);

/* =========================
   INITIAL LOAD
========================= */
loadData();