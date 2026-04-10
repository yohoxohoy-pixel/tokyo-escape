// app.js
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwyXFT8i0NOCCI8hzDzWrD0QBkfVc4mHH3J6_4A9oQWpBdlB4oYWaSgAcGjBssuC80d/exec';

// Chart instances
let earnMoneyChart, earnDaysChart, use30DaysChart, useTotalChart;

// Tab Switching Logic
document.getElementById('tab-earn').addEventListener('click', (e) => {
  e.preventDefault();
  switchTab('earn');
});

document.getElementById('tab-use').addEventListener('click', (e) => {
  e.preventDefault();
  switchTab('use');
});

function switchTab(tab) {
  if (tab === 'earn') {
    document.getElementById('earn-section').classList.remove('d-none');
    document.getElementById('use-section').classList.add('d-none');
    document.getElementById('tab-earn').classList.add('active');
    document.getElementById('tab-use').classList.remove('active');
  } else {
    document.getElementById('use-section').classList.remove('d-none');
    document.getElementById('earn-section').classList.add('d-none');
    document.getElementById('tab-use').classList.add('active');
    document.getElementById('tab-earn').classList.remove('active');
  }
}

// Fetch Dashboard Data
async function loadDashboardData() {
  try {
    const response = await fetch(GAS_WEB_APP_URL);
    const data = await response.json();
    updateCharts(data);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// Update Charts and Texts
function updateCharts(data) {
  const targetMoney = 7000000;
  const targetDays = 365;

  // Texts
  document.getElementById('earn-money-text').innerText = `${data.totalIncome.toLocaleString()} / 7,000,000 JPY`;
  document.getElementById('earn-days-text').innerText = `${data.totalDays} / 365 Days`;
  document.getElementById('use-30days-text').innerText = `In: ${data.last30Income.toLocaleString()} / Out: ${data.last30Expense.toLocaleString()}`;
  document.getElementById('use-total-text').innerText = `Total In: ${data.totalIncome.toLocaleString()} / Out: ${data.totalExpense.toLocaleString()}`;

  // Chart configs
  createPieChart('earn-money-chart', earnMoneyChart, [data.totalIncome, Math.max(0, targetMoney - data.totalIncome)], ['Earned', 'Remaining'], ['#198754', '#e9ecef'], (c) => earnMoneyChart = c);
  createPieChart('earn-days-chart', earnDaysChart, [data.totalDays, Math.max(0, targetDays - data.totalDays)], ['Worked', 'Remaining'], ['#0d6efd', '#e9ecef'], (c) => earnDaysChart = c);
  createPieChart('use-30days-chart', use30DaysChart, [data.last30Income, data.last30Expense], ['Income 30D', 'Expense 30D'], ['#198754', '#ffc107'], (c) => use30DaysChart = c);
  createPieChart('use-total-chart', useTotalChart, [data.totalIncome, data.totalExpense], ['Total Income', 'Total Expense'], ['#198754', '#dc3545'], (c) => useTotalChart = c);
}

function createPieChart(canvasId, chartInstance, dataArray, labels, colors, assignCallback) {
  if (chartInstance) {
    chartInstance.destroy();
  }
  const ctx = document.getElementById(canvasId).getContext('2d');
  const newChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{ data: dataArray, backgroundColor: colors, borderWidth: 0 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      cutout: '70%'
    }
  });
  assignCallback(newChart);
}

// Form Submissions
document.getElementById('earn-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  handleFormSubmit('earn');
});

document.getElementById('use-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  handleFormSubmit('use');
});

async function handleFormSubmit(type) {
  const form = document.getElementById(`${type}-form`);
  const submitBtn = document.getElementById(`${type}-submit`);
  
  // Prevent double click by disabling UI
  submitBtn.disabled = true;
  const originalText = submitBtn.innerText;
  submitBtn.innerText = 'Sending... Please wait';
  submitBtn.classList.replace(type === 'earn' ? 'btn-success' : 'btn-danger', 'btn-secondary');

  let payload = { type: type };

  if (type === 'earn') {
    payload.date = document.getElementById('earn-date').value;
    payload.income = document.getElementById('earn-income').value;
    payload.online = document.getElementById('earn-online').value;
  } else {
    payload.name = document.getElementById('use-name').value;
    payload.price = document.getElementById('use-price').value;
  }

  try {
    // Note: no-cors is used to bypass CORS preflight errors from external domains to GAS POST
    await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors', 
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    });

    // Reset Form
    form.reset();
    if(type === 'earn') {
      document.getElementById('earn-date').valueAsDate = new Date(); // Reset to today
    }
    
    // Refresh Dashboard Data
    await loadDashboardData();

  } catch (error) {
    console.error('Submission Error:', error);
    alert('Failed to send data. Please check connection.');
  } finally {
    // Restore UI
    submitBtn.disabled = false;
    submitBtn.innerText = originalText;
    submitBtn.classList.replace('btn-secondary', type === 'earn' ? 'btn-success' : 'btn-danger');
  }
}

// Initializing
window.onload = () => {
  document.getElementById('earn-date').valueAsDate = new Date();
  loadDashboardData();
};