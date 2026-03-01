const SHEET_ID = "1B1cwUPkMjnDnH9LWM014qTcDG7-SdP3lnWViI9b05pY";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

async function loadData() {

    const response = await fetch(SHEET_URL);
    const text = await response.text();

    const json = JSON.parse(text.substr(47).slice(0, -2));
    const rows = json.table.rows;

    const tbody = document.querySelector("#taskTable tbody");
    tbody.innerHTML = "";

    const qaCount = {};

    rows.forEach(row => {

        const jira = row.c[1]?.v || "";
        const qa = row.c[2]?.v || "";
        const type = row.c[3]?.v || "";
        const dev = row.c[4]?.v || "";
        const priority = row.c[5]?.v || "";
        const complexity = row.c[6]?.v || "";
        const status = row.c[7]?.v || "";

        tbody.innerHTML += `
            <tr>
                <td>${jira}</td>
                <td>${qa}</td>
                <td>${type}</td>
                <td>${dev}</td>
                <td>${priority}</td>
                <td>${complexity}</td>
                <td>${status}</td>
            </tr>
        `;

        qaCount[qa] = (qaCount[qa] || 0) + 1;
    });

    updateChart(qaCount);
}

function updateChart(qaCount) {

    const ctx = document.getElementById("qaChart");

    new Chart(ctx, {
        type: "bar",
        data: {
            labels: Object.keys(qaCount),
            datasets: [{
                label: "Tasks per QA",
                data: Object.values(qaCount)
            }]
        }
    });
}

window.onload = loadData;