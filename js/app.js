let allNotices = [];
let currentFilter = 'All';
let currentUrgency = 'All';
let searchText = '';
let isStaff = false;
let urgentNotice = null;

function loginAs(role) {
  isStaff = false;
  document.getElementById('login-box').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  document.getElementById('staff-form').style.display = 'none';
  loadNotices();
}

function loginStaff() {
  const pass = document.getElementById('staff-pass').value.trim();
  if (pass === getStaffPassword()) {
    isStaff = true;
    document.getElementById('login-box').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    document.getElementById('staff-form').style.display = 'block';
    loadNotices();
  } else {
    alert('Incorrect Password!');
  }
}

function logout() { location.reload(); }

function toggleSettings() {
  const panel = document.getElementById('settings-panel');
  const arrow = document.getElementById('settings-arrow');
  const isOpen = panel.style.display === 'block';
  panel.style.display = isOpen ? 'none' : 'block';
  arrow.innerText = isOpen ? '▼' : '▲';
}

function changePassword() {
  const oldPass = document.getElementById('old-pass').value.trim();
  const newPass = document.getElementById('new-pass').value.trim();
  const confirmPass = document.getElementById('confirm-pass').value.trim();
  if (oldPass !== getStaffPassword()) { alert('Current password is wrong!'); return; }
  if (!newPass || newPass.length < 4) { alert('New password must be at least 4 characters.'); return; }
  if (newPass !== confirmPass) { alert('Passwords do not match!'); return; }
  localStorage.setItem('staff_password', newPass);
  document.getElementById('old-pass').value = '';
  document.getElementById('new-pass').value = '';
  document.getElementById('confirm-pass').value = '';
  alert('Password updated successfully!');
  toggleSettings();
}

async function loadNotices() {
  const { data, error } = await supabaseClient.from('notices').select('*').order('created_at', { ascending: false });
  if (error) {
    document.getElementById('notices-list').innerHTML = `<p class="empty">Error: ${error.message}</p>`;
    return;
  }
  allNotices = data || [];
  updateStats();
  updateUrgentBanner();
  showNotices();
}

function updateStats() {
  document.getElementById('stat-total').innerText = allNotices.length;
  document.getElementById('stat-urgent').innerText = allNotices.filter(n => n.urgency === 'Urgent').length;
  document.getElementById('stat-today').innerText = allNotices.length > 0 ? '●' : '0';
}

function updateUrgentBanner() {
  urgentNotice = allNotices.find(n => n.urgency === 'Urgent');
  const banner = document.getElementById('urgent-banner');
  if (urgentNotice) {
    banner.style.display = 'flex';
    document.getElementById('urgent-title').innerText = urgentNotice.title;
    document.getElementById('urgent-sub').innerText = `${urgentNotice.circular} • ${urgentNotice.circular_no || 'No Circular No.'} • ${urgentNotice.date || ''}`;
  } else {
    banner.style.display = 'none';
  }
}

function openUrgentFromBanner() {
  if (urgentNotice) openModal(urgentNotice.id);
}

function getIcon(type) {
  if (type === 'Exams') return '📝';
  if (type === 'Fees') return '💰';
  if (type === 'Events') return '🎉';
  if (type === 'Placement') return '💼';
  return '🏫';
}

function showNotices() {
  let list = allNotices;
  if (currentFilter !== 'All') list = list.filter(n => n.circular === currentFilter);
  if (currentUrgency !== 'All') list = list.filter(n => (n.urgency || 'Normal') === currentUrgency);
  if (searchText) {
    const q = searchText.toLowerCase();
    list = list.filter(n => ((n.title || '') + ' ' + (n.description || '') + ' ' + (n.circular_no || '') + ' ' + (n.department || '') + ' ' + (n.circular || '')).toLowerCase().includes(q));
  }

  if (list.length === 0) {
    document.getElementById('notices-list').innerHTML = `
      <div class="empty-state glass">
        <div class="empty-icon">📭</div>
        <h3>No notices found</h3>
        <p>Try a different category, priority or search term.</p>
      </div>`;
    return;
  }

  document.getElementById('notices-list').innerHTML = list.map((n, i) => `
    <article class="notice-card ${n.circular.toLowerCase()} ${n.urgency === 'Urgent' ? 'is-urgent' : ''}" style="animation-delay:${i * 60}ms" onclick="openModal('${n.id}')">
      <div class="card-top">
        <span class="tag tag-${n.circular.toLowerCase()}">${getIcon(n.circular)} ${n.circular}</span>
        <span class="urgency-pill ${n.urgency === 'Urgent' ? 'pill-urgent' : 'pill-normal'}">${n.urgency === 'Urgent' ? '🔴 URGENT' : '🟢 NORMAL'}</span>
      </div>
      <h3>${n.title}</h3>
      <p class="circular-no">Circular No: <b>${n.circular_no || '—'}</b> • ${n.department || 'All Departments'}</p>
      <p class="desc">${n.description ? n.description.substring(0, 105) : ''}...</p>
      <div class="card-bottom">
        <span class="date">📅 ${n.date || 'No date'}</span>
        <span class="read">View Details →</span>
      </div>
      ${n.doc_url ? `<div class="has-doc">📎 Document Attached</div>` : ''}
      ${isStaff ? `<button class="del" onclick="event.stopPropagation(); deleteNotice('${n.id}')">🗑 Delete</button>` : ''}
    </article>
  `).join('');
}

function handleSearch() { searchText = document.getElementById('search-input').value; showNotices(); }

function filterNotices(type, btn) {
  currentFilter = type;
  document.querySelectorAll('.filter-bar button').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  showNotices();
}

function filterUrgency(type) {
  currentUrgency = type;
  document.querySelectorAll('.u-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(type === 'All' ? 'btn-urg-all' : type === 'Urgent' ? 'btn-urg-urgent' : 'btn-urg-normal').classList.add('active');
  showNotices();
}

async function addNotice() {
  const title = document.getElementById('f-title').value.trim();
  const circular_no = document.getElementById('f-circular-no').value.trim();
  const circular = document.getElementById('f-circular').value;
  const department = document.getElementById('f-department').value;
  const urgency = document.getElementById('f-urgency').value;
  const description = document.getElementById('f-desc').value.trim();
  const date = document.getElementById('f-date').value;
  const doc_url = document.getElementById('f-doc').value.trim();

  if (!title || !description) { alert('Please fill Title and Details.'); return; }

  const { error } = await supabaseClient.from('notices').insert([
    { title, circular_no, circular, department, urgency, description, date, doc_url: doc_url || null }
  ]);

  if (error) alert('Error: ' + error.message);
  else {
    document.getElementById('f-title').value = '';
    document.getElementById('f-circular-no').value = '';
    document.getElementById('f-desc').value = '';
    document.getElementById('f-doc').value = '';
    loadNotices();
  }
}

async function deleteNotice(id) {
  if (!confirm('Delete this notice?')) return;
  await supabaseClient.from('notices').delete().eq('id', id);
  loadNotices();
}

function openModal(id) {
  const n = allNotices.find(x => x.id == id);
  if (!n) return;
  document.getElementById('modal-tag').innerText = `${getIcon(n.circular)} ${n.circular}`;
  document.getElementById('modal-tag').className = `tag tag-${n.circular.toLowerCase()}`;
  const urg = document.getElementById('modal-urgency');
  urg.innerText = n.urgency === 'Urgent' ? '🔴 URGENT • HIGH PRIORITY' : '🟢 NORMAL';
  urg.className = n.urgency === 'Urgent' ? 'urgency-pill pill-urgent' : 'urgency-pill pill-normal';
  document.getElementById('modal-title').innerText = n.title;
  document.getElementById('modal-meta').innerText = `Circular No: ${n.circular_no || '—'}  •  ${n.department || 'All Departments'}  •  📅 ${n.date || 'No date'}`;
  document.getElementById('modal-desc').innerText = n.description;
  const wrap = document.getElementById('modal-doc-wrap');
  if (n.doc_url) {
    wrap.style.display = 'block';
    document.getElementById('modal-doc').href = n.doc_url;
  } else wrap.style.display = 'none';
  document.getElementById('modal').style.display = 'flex';
}

function closeModal() { document.getElementById('modal').style.display = 'none'; }