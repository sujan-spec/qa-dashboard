let sprintCache = {};
let availableSheets = [];
let currentSprint = "";

const API_URL = "https://script.google.com/macros/s/AKfycbzKR0sBQTmD9XIU3n-e7SC29UiLQxLVkGEqsQVhipW-nKsfnBDQezUUH80YiT6_VPdj/exec";

let allData = [];
let chart;

function showLoader() {
    document.getElementById("globalLoader").style.display = "flex";
    document.getElementById("sheetSelector").disabled = true;
}

function hideLoader() {
    document.getElementById("globalLoader").style.display = "none";
    document.getElementById("sheetSelector").disabled = false;
}

/* =========================
   FORMAT DATE FUNCTION
========================= */
function formatDate(value) {

    if (!value) return "";

    const date = new Date(value);

    if (isNaN(date)) return value;

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

/* =========================
   LOAD DATA (Dynamic Sheet)
========================= */
async function loadData(sheetName = "") {

    try {
        const url = sheetName
            ? `${API_URL}?sheet=${sheetName}`
            : API_URL;

        const response = await fetch(url);
        const result = await response.json();

        populateSheetDropdown(result.sheets, result.currentSheet);

        // ✅ Show Current Sprint Name
        document.getElementById("currentSprint").innerText = "Current Sprint: " + result.currentSheet;

        allData = result.data.map(row => ({
            qa: row[0] || "",
            jira: row[1] || "",
            relatedJira: row[2] || "",
            type: row[3] || "",
            status: row[4] || "",
            etaSujan: row[5] || "",
            etaAssignee: row[6] || "",
            jiraLink: row[7] || "",
            developer: row[8] || "",
            priority: row[9] || "",
            complexity: row[10] || "",
            qaRelease: formatDate(row[11]),
            clientRelease: formatDate(row[12]),
            buildQA: row[13] || "",
            remarks: row[14] || ""
        }));

        applyFilters();

    } catch (error) {
        console.error("Error loading data:", error);
    }
}

/* =========================
   SHEET DROPDOWN
========================= */
function populateSheetDropdown(sheets, selectedSheet) {

    const dropdown = document.getElementById("sheetSelector");
    dropdown.innerHTML = "";

    sheets.forEach(sheet => {
        const option = document.createElement("option");
        option.value = sheet;
        option.textContent = sheet;
        dropdown.appendChild(option);
    });

    dropdown.value = selectedSheet;
}

document.getElementById("sheetSelector").addEventListener("change", async function () {

    const selected = this.value;

    localStorage.setItem("selectedSprint", selected);

    showLoader();  // 🔥 Show loader immediately

    try {
        const response = await fetch(API_URL + "?sheet=" + selected);
        const result = await response.json();

        currentSprint = selected;

        document.getElementById("currentSprint").innerText =
            "Sprint: " + selected;

        const formattedData = result.data.map(row => ({
            qa: row[0] || "",
            jira: row[1] || "",
            relatedJira: row[2] || "",
            type: row[3] || "",
            status: row[4] || "",
            etaSujan: row[5] || "",
            etaAssignee: row[6] || "",
            jiraLink: row[7] || "",
            developer: row[8] || "",
            priority: row[9] || "",
            complexity: row[10] || "",
            qaRelease: row[11] || "",
            clientRelease: row[12] || "",
            buildQA: row[13] || "",
            remarks: row[14] || ""
        }));

        allData = formattedData;
        applyFilters();

    } catch (error) {
        console.error("Error switching sprint:", error);
    }

    hideLoader(); // 🔥 Hide loader after everything
});

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

        return (
            (!searchValue || jira.includes(searchValue)) &&
            (!qaValue || qa.includes(qaValue)) &&
            (!statusValue || status === statusValue)
        );
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