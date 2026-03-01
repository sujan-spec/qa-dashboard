const API_URL = "https://script.google.com/a/macros/sundewsolutions.com/s/AKfycbzMMP5pi0pPrz9TBh0tydu8uuEpaQJschTvm19MsLAptUvcDilwydUu9hlkVixx26J-eQ/exec";

async function addTask() {

  const data = {
    jiraId: document.getElementById("jiraId").value,
    qaName: document.getElementById("qaName").value,
    taskType: document.getElementById("taskType").value,
    developer: document.getElementById("developer").value,
    priority: document.getElementById("priority").value,
    complexity: document.getElementById("complexity").value,
    status: document.getElementById("status").value
  };

  await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(data)
  });

  loadData();
}

async function loadData() {
  const response = await fetch(API_URL);
  const data = await response.json();

  const tbody = document.querySelector("#taskTable tbody");
  tbody.innerHTML = "";

  data.forEach(row => {
    tbody.innerHTML += `
      <tr>
        <td>${row[1]}</td>
        <td>${row[2]}</td>
        <td>${row[3]}</td>
        <td>${row[4]}</td>
        <td>${row[5]}</td>
        <td>${row[6]}</td>
        <td>${row[7]}</td>
      </tr>
    `;
  });
}

window.onload = loadData;