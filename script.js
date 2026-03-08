let sprintCache = {};
let availableSheets = [];
let currentSprint = "";

const API_URL = "https://script.google.com/macros/s/AKfycbwR0ujItNOYvscIbZlGAC6gTqgFcHoIjTg4jXRB2rUkogK4VAhirbpBKiFbD1D9gHHj/exec";

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
   LOAD DATA (Dynamic Sheet):
========================= */
async function loadData(sheetName = "") {

    try {
        const url = sheetName
            ? `${API_URL}?sheet=${sheetName}`
            : API_URL;

        const response = await fetch(url);
        const result = await response.json();

        populateSheetDropdown(result.sheets, result.currentSheet);
        populateComparisonSprints(result.sheets);

        // ✅ Show Current Sprint Name
        document.getElementById("currentSprint").innerText = "Sprint: " + result.currentSheet;

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

function populateComparisonSprints(sheets){

    const s1 = document.getElementById("comparisonSprint1");
    const s2 = document.getElementById("comparisonSprint2");
    const s3 = document.getElementById("comparisonSprint3");

    [s1,s2,s3].forEach(select=>{
        select.innerHTML="";
        sheets.forEach(sheet=>{
            const opt=document.createElement("option");
            opt.value=sheet;
            opt.textContent=sheet;
            select.appendChild(opt);
        });
    });
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
            <td>${task.jiraLink ? `<a href="${task.jiraLink}" target="_blank">View</a>` : "-"}</td>
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

    document.getElementById("doneTasks").innerText =
        data.filter(t => t.status.toLowerCase() === "done").length;

    document.getElementById("pendingqaTasks").innerText =
        data.filter(t => t.status.toLowerCase() === "pending-qa").length;

    document.getElementById("uatTasks").innerText =
        data.filter(t => t.status.toLowerCase() === "uat").length;

    document.getElementById("notstartedTasks").innerText =
        data.filter(t => t.status.toLowerCase() === "not started").length;

    // // Count Production Bugs
    // const productionBugs = data.filter(t => t.type && t.type.toLowerCase() === "production-bug").length;

    // // Count UAT Bugs
    // const uatBugs = data.filter(t => t.type && t.type.toLowerCase() === "uat-bug").length;

    // // Show individual counts
    // document.getElementById("productionBugs").innerText = productionBugs;
    // document.getElementById("uatBugs").innerText = uatBugs;

    // // Calculate total
    // const totalBugs = productionBugs + uatBugs;

    // // Show total
    // document.getElementById("totalBugs").innerText = totalBugs;

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
        const bugSum = qaTasks.filter(t => {
            const type = t.type.toLowerCase();
            return (
                type === "production-bug" ||
                type === "uat-bug"
            );
        }
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
document.getElementById("applyFilterBtn").addEventListener("click", applyFilters);

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

    // ✅ Define CSV first
    let csv = "QA,Jira,Related Jira,Task Type,Status,QA ETA(Sujan),QA ETA(Assignee),Developer,Priority,Complexity,QA Release,Client Release,Build QA,Remarks\n";

    // ✅ Build rows
    filteredData.forEach(task => {

        const row = [
            task.qa || "",
            task.jira || "",
            task.relatedJira || "",
            task.type || "",
            task.status || "",
            task.etaSujan || "",
            task.etaAssignee || "",
            task.developer || "",
            task.priority || "",
            task.complexity || "",
            task.qaRelease || "",
            task.clientRelease || "",
            task.buildQA || "",
            task.remarks || ""
        ];

        csv += `"${row.join('","')}"\n`;
    });

    // ✅ Fix Excel UTF issue
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    // ✅ Get Sprint Name
    const sprintName = document.getElementById("sheetSelector").value || "Sprint";
    // ✅ Get Today Date
    const today = new Date();
    const formattedDate =
        String(today.getDate()).padStart(2, '0') + "-" +
        String(today.getMonth() + 1).padStart(2, '0') + "-" +
        today.getFullYear();
    a.download = `QA_Activity_${sprintName}_${formattedDate}.csv`;
    a.click();

    window.URL.revokeObjectURL(url);

});

// TAB SWITCHING
document.querySelectorAll(".tab-btn").forEach(btn=>{

    btn.addEventListener("click",()=>{

        document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");

        document.querySelectorAll(".chart-tab-content")
        .forEach(tab=>tab.classList.remove("active"));

        const tabName=btn.dataset.tab;

        if(tabName==="visualization"){
            document.getElementById("visualizationTab").classList.add("active");
        }
        else{
            document.getElementById("comparisonTab").classList.add("active");
        }

    });

});

let comparisonChart;

document.getElementById("compareBtn").addEventListener("click", async ()=>{

    const qa = document.getElementById("comparisonQA").value;

    const sprints = [
        document.getElementById("comparisonSprint1").value,
        document.getElementById("comparisonSprint2").value,
        document.getElementById("comparisonSprint3").value
    ].filter(Boolean);

    if(!sprints.length) return;

    const sprintTotals=[];

    for(const sprint of sprints){

        const response = await fetch(API_URL + "?sheet=" + sprint);
        const result = await response.json();

        let data=result.data;

        if(qa){
            data=data.filter(r=>r[0]===qa);
        }

        sprintTotals.push(data.length);
    }

    const ctx=document.getElementById("comparisonChart").getContext("2d");

    if(comparisonChart) comparisonChart.destroy();

    comparisonChart=new Chart(ctx,{
        type:"bar",
        data:{
            labels:sprints,
            datasets:[
                {
                    label: qa ? qa+" Tasks" : "Total Tasks",
                    data:sprintTotals,
                    backgroundColor:"#2563eb",
                    borderRadius:6
                }
            ]
        },
        options:{
            responsive:true,
            maintainAspectRatio:false,
            scales:{
                y:{beginAtZero:true}
            }
        }
    });

});

/* =========================
   SPRINT COMPARISON LOGIC
========================= */

const sprintDropdowns = [
    document.getElementById("sprint1"),
    document.getElementById("sprint2"),
    document.getElementById("sprint3")
];

const compareBtn = document.getElementById("compareBtn");
const compareLoader = document.getElementById("compareLoader");

let comparisonSprintChart;


/* =========================
   POPULATE SPRINT DROPDOWNS
========================= */

function populateComparisonSprints(sprints) {

    sprintDropdowns.forEach(dropdown => {

        dropdown.innerHTML = '<option value="">Select Sprint</option>';

        sprints.forEach(sprint => {

            const option = document.createElement("option");

            option.value = sprint;
            option.textContent = sprint;

            dropdown.appendChild(option);

        });

    });

}


/* =========================
   PREVENT DUPLICATE SPRINTS
========================= */

function updateSprintOptions() {

    const selected = sprintDropdowns.map(d => d.value);

    sprintDropdowns.forEach(dropdown => {

        const options = dropdown.querySelectorAll("option");

        options.forEach(opt => {

            if (opt.value === "") return;

            if (selected.includes(opt.value) && dropdown.value !== opt.value) {
                opt.disabled = true;
            } else {
                opt.disabled = false;
            }

        });

    });

}

sprintDropdowns.forEach(dropdown => {
    dropdown.addEventListener("change", updateSprintOptions);
});


/* =========================
   COMPARE BUTTON LOGIC
========================= */
document.getElementById("compareBtn").addEventListener("click", async function () {

    const button = document.getElementById("compareBtn");
    const overlay = document.getElementById("chartOverlay");

    const selectedSprints = sprintDropdowns
        .map(d => d.value)
        .filter(v => v !== "");

    if (selectedSprints.length === 0) {
        alert("Please select at least one sprint");
        return;
    }

    // disable button
    button.disabled = true;
    button.style.opacity = "0.6";
    button.style.cursor = "not-allowed";

    // show loader
    overlay.style.display = "block";

    try {
        await renderComparisonChart();
    } catch (error) {
        console.error(error);
        alert("Error loading comparison chart");
    }

    // hide loader
    overlay.style.display = "none";

    // enable button again
    button.disabled = false;
    button.style.opacity = "1";
    button.style.cursor = "pointer";

});

/* =========================
   BUILD CHART DATA
========================= */
async function renderComparisonChart() {

    const selectedQA = document.getElementById("comparisonQA").value;

    const selectedSprints = sprintDropdowns
        .map(d => d.value)
        .filter(v => v !== "");

    const labels = [];
    const totalTasks = [];
    const workItems = [];
    const bugs = [];

    for (const sprint of selectedSprints) {

        const response = await fetch(API_URL + "?sheet=" + sprint);
        const result = await response.json();

        let data = result.data.map(row => ({
            qa: row[0] || "",
            type: row[3] || ""
        }));

        if (selectedQA) {
            data = data.filter(d => d.qa === selectedQA);
        }

        const total = data.length;

        const featureCount = data.filter(d => {
            const type = d.type.toLowerCase();
            return (
                type === "enhancement" ||
                type === "task" ||
                type === "epic" ||
                type === "story" ||
                type === "new feature"
            );
        }).length;

        const bugCount = data.filter(d => {
            const type = d.type.toLowerCase();
            return (
                type === "production-bug" ||
                type === "uat-bug"
            );
        }).length;

        labels.push(sprint);
        totalTasks.push(total);
        workItems.push(featureCount);
        bugs.push(bugCount);
    }

    const ctx = document.getElementById("comparisonChart").getContext("2d");

    if (comparisonSprintChart) comparisonSprintChart.destroy();

    comparisonSprintChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Total Tasks",
                    data: totalTasks,
                    backgroundColor: "#374151"
                },
                {
                    label: "Enhancement+Task+Epic+Story+New Feature",
                    data: workItems,
                    backgroundColor: "#16a34a"
                },
                {
                    label: "Bug",
                    data: bugs,
                    backgroundColor: "#dc2626"
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

}      

/* =========================
   INITIAL LOAD
========================= */
loadData();