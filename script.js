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

    document.getElementById("p2Tasks").innerText =
        data.filter(t => t.priority.toLowerCase() === "p2").length;

    document.getElementById("p3Tasks").innerText =
        data.filter(t => t.priority.toLowerCase() === "p3").length;

    document.getElementById("p4Tasks").innerText =
        data.filter(t => t.priority.toLowerCase() === "p4").length;

    document.getElementById("liveTasks").innerText =
        data.filter(t => t.status.toLowerCase() === "live").length;

    document.getElementById("doneTasks").innerText =
        data.filter(t => t.status.toLowerCase() === "done").length;

    document.getElementById("uatTasks").innerText =
        data.filter(t => t.status.toLowerCase() === "uat").length;

    document.getElementById("notstartedTasks").innerText =
        data.filter(t => t.status.toLowerCase() === "not started").length;

    updateChart(data);
}

/* =========================
   UPDATE CHART
========================= */
function updateChart(data) {

    const qaList = [...new Set(data.map(t => t.qa).filter(Boolean))];

    const totalCounts = [];
    const featureCounts = [];
    const bugCounts = [];

    qaList.forEach(qa => {

        const qaTasks = data.filter(t => t.qa === qa);

        // 1️⃣ Total
        totalCounts.push(qaTasks.length);

        // 2️⃣ Enhancement + Task + Epic + Story + New Feature
        const featureSum = qaTasks.filter(t => {
            const type = t.type.toLowerCase();
            return (
                type === "enhancement" ||
                type === "task" ||
                type === "epic" ||
                type === "story" ||
                type === "new feature"
            );
        }).length;

        featureCounts.push(featureSum);

        // 3️⃣ Bug
        const bugSum = qaTasks.filter(t =>
            t.type.toLowerCase() === "bug"
        ).length;

        bugCounts.push(bugSum);
    });

    const ctx = document.getElementById("qaChart").getContext("2d");

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: qaList,
            datasets: [
                {
                    label: "Total Tasks",
                    data: totalCounts,
                    backgroundColor: "#374151",  // Dark Grey
                    borderRadius: 6
                },
                {
                    label: "Enhancement+Task+Epic+Story+New Feature",
                    data: featureCounts,
                    backgroundColor: "#16a34a",  // Green
                    borderRadius: 6
                },
                {
                    label: "Bug",
                    data: bugCounts,
                    backgroundColor: "#dc2626",  // Red
                    borderRadius: 6
                }
            ]
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
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    position: "top"
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

// Button click
document.querySelector("button").addEventListener("click", applyFilters);

// ===============================
// REFRESH BUTTON FUNCTIONALITY
// ===============================

document.getElementById("refreshBtn").addEventListener("click", function () {

    // 1️⃣ Clear all filter inputs
    document.getElementById("searchInput").value = "";
    document.getElementById("qaFilter").value = "";
    document.getElementById("statusFilter").value = "";

    // 2️⃣ Reload full dashboard with original data
    updateDashboard(allData);
});

// Live search while typing
document.getElementById("searchInput").addEventListener("keyup", applyFilters);

document.getElementById("exportBtn").addEventListener("click", () => {

    if (!allData.length) return;

    const searchValue = document.getElementById("searchInput").value.toLowerCase().trim();
    const qaValue = document.getElementById("qaFilter").value.toLowerCase().trim();
    const statusValue = document.getElementById("statusFilter").value.toLowerCase().trim();

    const filteredData = allData.filter(task => {
        const matchSearch = !searchValue || task.jira.toLowerCase().includes(searchValue);
        const matchQA = !qaValue || task.qa.toLowerCase().includes(qaValue);
        const matchStatus = !statusValue || task.status.toLowerCase() === statusValue;
        return matchSearch && matchQA && matchStatus;
    });

    let csv = "QA,Jira,Related Jira,Task Type,Status,QA ETA(Sujan),QA ETA(Assignee),Developer,Priority,Complexity,QA Release,Client Release,Build QA,Remarks\n";

    filteredData.forEach(task => {
        csv += `"${task.qa}","${task.jira}","${task.relatedJira}","${task.type}","${task.status}",
"${task.etaSujan}","${task.etaAssignee}","${task.developer}","${task.priority}",
"${task.complexity}","${task.qaRelease}","${task.clientRelease}",
"${task.buildQA}","${task.remarks}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "QA_Daily_Activity.csv";
    a.click();

    window.URL.revokeObjectURL(url);
});

/* =========================
   INITIAL LOAD
========================= */
loadData();