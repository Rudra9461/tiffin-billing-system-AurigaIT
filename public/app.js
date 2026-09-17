const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || 'null');

if (!token) window.location.href = 'login.html';
if (user) document.getElementById('ownerName') && (document.getElementById('ownerName').innerText = user.name);

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

async function api(url, options = {}) {
  options.headers = { ...options.headers, 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

let currentPage = 1;
let totalPages = 1;
let currentCustomerId = null;

async function loadSummary() {
  try {
    const data = await api('/api/customers-status/summary');
    document.getElementById('summary').innerHTML = `
      <span class="badge badge-active">Active: ${data.counts.active}</span>
      &nbsp;<span class="badge badge-paused">Paused: ${data.counts.paused}</span>
      &nbsp;<span class="badge badge-none">No Subscription: ${data.counts.noSubscription}</span>
    `;
  } catch (e) { console.error(e); }
}

async function loadCustomers(page = currentPage) {
  currentPage = page;
  const search = document.getElementById('searchBox').value;
  const sort = document.getElementById('sortSelect').value;
  const order = document.getElementById('orderSelect').value;

  try {
    const data = await api(`/api/customers?search=${encodeURIComponent(search)}&page=${page}&limit=10&sort=${sort}&order=${order}`);
    totalPages = data.totalPages || 1;
    document.getElementById('pageInfo').innerText = `Page ${data.page} of ${totalPages || 1} (${data.total} total)`;

    const rows = data.customers.map(c => {
      const badge = c.status === 'active' ? '<span class="badge badge-active">Active</span>'
        : c.status === 'paused' ? '<span class="badge badge-paused">Paused</span>'
        : '<span class="badge badge-none">No Plan</span>';
      return `
        <tr>
          <td data-label="Name">${c.name}</td>
          <td data-label="Phone">${c.phone}</td>
          <td data-label="Address">${c.address || '-'}</td>
          <td data-label="Status">${badge}</td>
          <td data-label="Actions"><button class="secondary" onclick="viewCustomer(${c.id})">View</button></td>
        </tr>
      `;
    }).join('');
    document.getElementById('customerTable').innerHTML = rows || '<tr><td colspan="5">No customers found</td></tr>';
  } catch (e) {
    document.getElementById('customerTable').innerHTML = `<tr><td colspan="5" class="error">${e.message}</td></tr>`;
  }
}

function nextPage() { if (currentPage < totalPages) loadCustomers(currentPage + 1); }
function prevPage() { if (currentPage > 1) loadCustomers(currentPage - 1); }

async function addCustomer() {
  const name = document.getElementById('custName').value;
  const phone = document.getElementById('custPhone').value;
  const address = document.getElementById('custAddress').value;
  const msg = document.getElementById('custMsg');
  try {
    await api('/api/customers', { method: 'POST', body: JSON.stringify({ name, phone, address }) });
    msg.innerHTML = '<p class="success">Customer added</p>';
    document.getElementById('custName').value = '';
    document.getElementById('custPhone').value = '';
    document.getElementById('custAddress').value = '';
    loadCustomers(1);
    loadSummary();
  } catch (e) {
    msg.innerHTML = `<p class="error">${e.message}</p>`;
  }
}

async function viewCustomer(id) {
  currentCustomerId = id;
  const card = document.getElementById('detailCard');
  const body = document.getElementById('detailBody');
  card.style.display = 'block';
  document.getElementById('detailTitle').innerText = 'Loading...';

  try {
    const c = await api(`/api/customers/${id}`);
    document.getElementById('detailTitle').innerText = `${c.name} — ${c.phone}`;

    let subHtml = '';
    if (!c.subscriptions.length) {
      subHtml = `
        <p>No subscription yet.</p>
        <div class="form-row">
          <input type="text" id="planName" placeholder="Plan name" value="Standard Lunch" />
          <input type="number" id="planPrice" placeholder="Price" value="3000" />
          <input type="date" id="planStart" />
          <button class="primary" onclick="subscribe(${id})">Subscribe</button>
        </div>
      `;
    } else {
      const sub = c.subscriptions[0];

      let pauseHtml = '<p class="pause-empty">No pauses logged yet.</p>';
      if (sub.pauses && sub.pauses.length) {
        pauseHtml = '<ul class="pause-history">' + sub.pauses.map(p => `
          <li>
            <span class="pause-dates">${p.start_date} &rarr; ${p.end_date || 'ongoing'}</span>
            ${!p.end_date ? '<span class="badge badge-paused">Ongoing</span>' : '<span class="badge badge-none">Closed</span>'}
          </li>
        `).join('') + '</ul>';
      }

      subHtml = `
        <p><strong>Plan:</strong> ${sub.plan_name} — ₹${sub.plan_price}/month, started ${sub.start_date}</p>
        <p><strong>Status:</strong> <span class="badge ${sub.status === 'paused' ? 'badge-paused' : 'badge-active'}">${sub.status}</span></p>
        <div class="form-row">
          <input type="date" id="pauseStart" title="Pause start" />
          <input type="date" id="pauseEnd" title="Pause end (optional)" />
          <button class="primary" onclick="pauseSub(${sub.id})">Pause</button>
          <input type="date" id="resumeDate" title="Resume date" />
          <button class="secondary" onclick="resumeSub(${sub.id})">Resume</button>
        </div>
        <h4 class="pause-history-title">Pause History</h4>
        ${pauseHtml}
        <div class="form-row">
          <input type="month" id="billMonth" />
          <button onclick="getBill(${sub.id})">Get Bill</button>
        </div>
        <div id="billResult"></div>
      `;
    }
    body.innerHTML = subHtml + `<div id="detailMsg"></div>`;
  } catch (e) {
    document.getElementById('detailTitle').innerText = 'Error';
    body.innerHTML = `<p class="error">${e.message}</p>`;
  }
}

async function subscribe(customerId) {
  const plan_name = document.getElementById('planName').value;
  const plan_price = parseFloat(document.getElementById('planPrice').value);
  const start_date = document.getElementById('planStart').value;
  const msg = document.getElementById('detailMsg');
  try {
    await api('/api/subscriptions', { method: 'POST', body: JSON.stringify({ customer_id: customerId, plan_name, plan_price, start_date }) });
    msg.innerHTML = '<p class="success">Subscribed</p>';
    viewCustomer(customerId);
    loadCustomers(currentPage);
    loadSummary();
  } catch (e) { msg.innerHTML = `<p class="error">${e.message}</p>`; }
}

async function pauseSub(subId) {
  const start_date = document.getElementById('pauseStart').value;
  const end_date = document.getElementById('pauseEnd').value;
  const msg = document.getElementById('detailMsg');
  if (!start_date) { msg.innerHTML = '<p class="error">Pause start date required</p>'; return; }
  try {
    await api(`/api/subscriptions/${subId}/pause`, { method: 'POST', body: JSON.stringify({ start_date, end_date: end_date || undefined }) });
    msg.innerHTML = '<p class="success">Paused</p>';
    loadCustomers(currentPage);
    loadSummary();
    if (currentCustomerId) viewCustomer(currentCustomerId);
  } catch (e) { msg.innerHTML = `<p class="error">${e.message}</p>`; }
}

async function resumeSub(subId) {
  const end_date = document.getElementById('resumeDate').value;
  const msg = document.getElementById('detailMsg');
  try {
    await api(`/api/subscriptions/${subId}/resume`, { method: 'POST', body: JSON.stringify({ end_date: end_date || undefined }) });
    msg.innerHTML = '<p class="success">Resumed</p>';
    loadCustomers(currentPage);
    loadSummary();
    if (currentCustomerId) viewCustomer(currentCustomerId);
  } catch (e) { msg.innerHTML = `<p class="error">${e.message}</p>`; }
}

async function getBill(subId) {
  const month = document.getElementById('billMonth').value;
  const result = document.getElementById('billResult');
  try {
    const data = await api(`/api/subscriptions/${subId}/bill?month=${month}`);
    result.innerHTML = `
      <div class="card" style="background:#f0f7f2">
        <p><strong>Month:</strong> ${data.month}</p>
        <p><strong>Eligible weekdays:</strong> ${data.eligibleWeekdays}</p>
        <p><strong>Paused weekdays:</strong> ${data.pausedWeekdays}</p>
        <p><strong>Served weekdays:</strong> ${data.servedWeekdays}</p>
        <p><strong>Daily rate:</strong> ₹${data.dailyRate}</p>
        <p><strong>Bill:</strong> ₹${data.bill}</p>
      </div>
    `;
  } catch (e) { result.innerHTML = `<p class="error">${e.message}</p>`; }
}

// init
loadSummary();
loadCustomers(1);