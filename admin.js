// ============================================================
//  ADMIN.JS — Panel de administración Venezuela Unida
// ============================================================

const CATS = [
  { id: 'vivienda',     label: 'Vivienda',                  cls: 'tag-vivienda' },
  { id: 'salud',        label: 'Gastos hospitalarios',      cls: 'tag-salud' },
  { id: 'funerarios',   label: 'Gastos funerarios',         cls: 'tag-funerarios' },
  { id: 'transporte',   label: 'Transporte / movilización', cls: 'tag-transporte' },
  { id: 'alimentacion', label: 'Alimentación',              cls: 'tag-alimentacion' },
  { id: 'ninos',        label: 'Bebés / niños',             cls: 'tag-ninos' },
  { id: 'mascotas',     label: 'Mascotas',                  cls: 'tag-mascotas' },
  { id: 'bienes',       label: 'Pérdida de bienes',         cls: 'tag-bienes' },
  { id: 'otros',        label: 'Otros',                     cls: 'tag-otros' },
];

let currentSession = null;
let currentTab = 'pendiente';
let allAdminCases = [];

document.addEventListener('DOMContentLoaded', async () => {
  const saved = sessionStorage.getItem('vu_admin_session');
  if (saved) {
    currentSession = JSON.parse(saved);
    showAdminPanel();
  }
});

// ---- LOGIN ----
async function doLogin() {
  const username = document.getElementById('login-user').value.trim();
  const password = document.getElementById('login-pass').value;
  const errEl = document.getElementById('login-error');
  errEl.classList.add('hidden');

  if (!username || !password) {
    errEl.textContent = 'Introduce usuario y contraseña.';
    errEl.classList.remove('hidden');
    return;
  }

  const { data, error } = await db
    .from('admins')
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .single();

  if (error || !data) {
    errEl.textContent = 'Usuario o contraseña incorrectos.';
    errEl.classList.remove('hidden');
    return;
  }

  currentSession = { username: data.username, name: data.name, role: data.role };
  sessionStorage.setItem('vu_admin_session', JSON.stringify(currentSession));
  showAdminPanel();
}

function doLogout() {
  sessionStorage.removeItem('vu_admin_session');
  currentSession = null;
  document.getElementById('admin-section').classList.add('hidden');
  document.getElementById('login-section').classList.remove('hidden');
}

// ---- SHOW ADMIN PANEL ----
async function showAdminPanel() {
  document.getElementById('login-section').classList.add('hidden');
  document.getElementById('admin-section').classList.remove('hidden');
  document.getElementById('session-info').textContent = `Sesión: ${currentSession.name} (${currentSession.role})`;

  if (currentSession.role === 'superadmin') {
    document.getElementById('btn-add-admin').style.display = '';
    document.getElementById('tab-admins').style.display = '';
  }

  const btnLogout = document.createElement('button');
  document.getElementById('admin-header-actions').appendChild(btnLogout);

  await loadAdminCases();
  setAdminTab(document.querySelector('.admin-tab'), 'pendiente');
}

async function loadAdminCases() {
  const { data } = await db.from('casos').select('*').order('created_at', { ascending: false });
  allAdminCases = data || [];
  updateTabCounts();
}

function updateTabCounts() {
  ['pendiente', 'verificado', 'rechazado'].forEach(s => {
    const el = document.getElementById('count-' + (s === 'pendiente' ? 'pendientes' : s));
    if (el) el.textContent = allAdminCases.filter(c => c.status === s).length;
  });
}

// ---- TABS ----
function setAdminTab(btn, tab) {
  currentTab = tab;
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderAdminTab();
}

function renderAdminTab() {
  const content = document.getElementById('admin-tab-content');
  if (currentTab === 'admins') {
    renderAdminsTab(content);
    return;
  }
  const cases = allAdminCases.filter(c => c.status === currentTab);
  if (!cases.length) {
    content.innerHTML = '<p style="padding:2rem;color:var(--muted);text-align:center;font-size:14px;">No hay casos en este estado.</p>';
    return;
  }
  renderCasesTable(content, cases);
}

function renderCasesTable(container, cases) {
  const wrapper = document.createElement('div');
  wrapper.style.overflowX = 'auto';

  const table = document.createElement('table');
  table.className = 'admin-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>Nombre / Estado</th>
        <th>Descripción</th>
        <th>Categorías</th>
        <th>Medios</th>
        <th>Enviado por</th>
        <th>Fecha</th>
        <th>Acciones</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement('tbody');
  cases.forEach(c => {
    const tr = document.createElement('tr');

    const cats = (c.categories || []).map(cat => {
      const info = CATS.find(x => x.id === cat) || { label: cat, cls: 'tag-otros' };
      return `<span class="tag ${info.cls}" style="display:inline-block;margin:2px 2px 2px 0;">${info.label}</span>`;
    }).join('');

    const medios = [
      c.gofundme    ? '💚 GoFundMe' : '',
      c.instagram   ? '📸 Reel'     : '',
      c.tiene_cuenta ? '🏦 Cuenta'  : '',
    ].filter(Boolean).join('<br>');

    tr.innerHTML = `
      <td style="min-width:140px;">
        <strong>${esc(c.name)}</strong><br>
        <small style="color:var(--muted);">📍 ${esc(c.zone)}</small>
      </td>
      <td style="max-width:200px;font-size:12px;color:var(--muted);">
        ${c.description ? esc(c.description).substring(0, 120) + (c.description.length > 120 ? '…' : '') : '—'}
      </td>
      <td style="min-width:150px;">${cats}</td>
      <td style="font-size:12px;min-width:90px;">${medios || '—'}</td>
      <td style="font-size:12px;color:var(--muted);min-width:120px;">
        ${esc(c.contacto_nombre || '—')}<br>
        <small>${esc(c.contacto_interno || '')}</small>
      </td>
      <td style="font-size:12px;white-space:nowrap;">${formatDate(c.created_at)}</td>
      <td style="min-width:180px;"></td>
    `;

    const tdActions = tr.querySelectorAll('td')[6];
    const actRow = document.createElement('div');
    actRow.className = 'action-row';

    if (c.gofundme) {
      const a = document.createElement('a');
      a.className = 'btn btn-sm';
      a.href = c.gofundme;
      a.target = '_blank';
      a.textContent = '🔗 Ver GFM';
      actRow.appendChild(a);
    }

    if (c.tiene_cuenta) {
      const btnCuenta = document.createElement('button');
      btnCuenta.className = 'btn btn-sm';
      btnCuenta.textContent = '🏦 Ver cuenta';
      btnCuenta.onclick = () => showCuentaAdmin(c);
      actRow.appendChild(btnCuenta);
    }

    if (currentTab !== 'verificado') {
      const btnOk = document.createElement('button');
      btnOk.className = 'btn btn-sm btn-success';
      btnOk.textContent = '✅ Verificar';
      btnOk.onclick = () => updateStatus(c.id, 'verificado', btnOk);
      actRow.appendChild(btnOk);
    }

    if (currentTab !== 'rechazado') {
      const btnR = document.createElement('button');
      btnR.className = 'btn btn-sm btn-danger';
      btnR.textContent = '❌ Rechazar';
      btnR.onclick = () => { if (confirm('¿Rechazar este caso?')) updateStatus(c.id, 'rechazado', btnR); };
      actRow.appendChild(btnR);
    }

    if (currentTab === 'rechazado') {
      const btnBack = document.createElement('button');
      btnBack.className = 'btn btn-sm';
      btnBack.textContent = '↩ Reabrir';
      btnBack.onclick = () => updateStatus(c.id, 'pendiente', btnBack);
      actRow.appendChild(btnBack);
    }

    const btnDel = document.createElement('button');
    btnDel.className = 'btn btn-sm btn-danger';
    btnDel.textContent = '🗑 Borrar';
    btnDel.onclick = () => { if (confirm('¿Borrar este caso definitivamente? Esta acción no se puede deshacer.')) deleteCase(c.id); };
    actRow.appendChild(btnDel);

    tdActions.appendChild(actRow);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  wrapper.appendChild(table);
  container.innerHTML = '';
  container.appendChild(wrapper);
}

async function updateStatus(id, status, btn) {
  btn.disabled = true;
  btn.textContent = '...';
  const { error } = await db.from('casos').update({ status }).eq('id', id);
  if (!error) {
    allAdminCases = allAdminCases.map(c => c.id === id ? { ...c, status } : c);
    updateTabCounts();
    renderAdminTab();
  } else {
    btn.disabled = false;
    btn.textContent = 'Error';
  }
}

async function deleteCase(id) {
  const { error } = await db.from('casos').delete().eq('id', id);
  if (!error) {
    allAdminCases = allAdminCases.filter(c => c.id !== id);
    updateTabCounts();
    renderAdminTab();
  }
}

// ---- CUENTA MODAL (admin) ----
function showCuentaAdmin(c) {
  const rows = [
    ['Banco', c.banco], ['N° cuenta', c.num_cuenta], ['Tipo', c.tipo_cuenta],
    ['Titular', c.titular], ['Cédula', c.cedula], ['Pago Móvil', c.pago_movil],
  ].filter(r => r[1]);

  document.getElementById('modal-content').innerHTML = `
    <h2>Datos bancarios</h2>
    <p style="font-size:13px;color:var(--muted);margin-bottom:1rem;">${esc(c.name)}</p>
    <div class="cuenta-data">
      ${rows.map(([k, v]) => `
        <div class="cuenta-row">
          <span class="cuenta-key">${k}</span>
          <span class="cuenta-val">${esc(v)}</span>
          <button class="copy-btn" onclick="copyText('${esc(v)}', this)">Copiar</button>
        </div>
      `).join('')}
    </div>
  `;
  openModal();
}

// ---- ADMINS TAB ----
async function renderAdminsTab(container) {
  const { data: admins } = await db.from('admins').select('username, name, role, created_at');
  if (!admins) { container.innerHTML = '<p>Error cargando admins.</p>'; return; }

  const wrapper = document.createElement('div');
  wrapper.style.overflowX = 'auto';
  const table = document.createElement('table');
  table.className = 'admin-table';
  table.innerHTML = `
    <thead><tr><th>Usuario</th><th>Nombre</th><th>Rol</th><th>Creado</th><th>Acciones</th></tr></thead>
  `;
  const tbody = document.createElement('tbody');
  admins.forEach(a => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${esc(a.username)}</td>
      <td>${esc(a.name)}</td>
      <td><span class="status-pill ${a.role === 'superadmin' ? 'pill-verificado' : 'pill-pendiente'}">${a.role}</span></td>
      <td style="font-size:12px;">${formatDate(a.created_at)}</td>
      <td></td>
    `;
    if (a.username !== currentSession.username) {
      const td = tr.querySelectorAll('td')[4];
      const btn = document.createElement('button');
      btn.className = 'btn btn-sm btn-danger';
      btn.textContent = 'Eliminar';
      btn.onclick = async () => {
        if (!confirm(`¿Eliminar el admin "${a.username}"?`)) return;
        await db.from('admins').delete().eq('username', a.username);
        renderAdminTab();
      };
      td.appendChild(btn);
    }
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrapper.appendChild(table);
  container.innerHTML = '';
  container.appendChild(wrapper);
}

function openAddAdmin() {
  document.getElementById('modal-content').innerHTML = `
    <h2>Agregar administrador</h2>
    <div id="aa-error" class="error-msg hidden"></div>
    <div class="form-group">
      <label>Usuario (sin espacios ni caracteres especiales)</label>
      <input type="text" id="aa-user" autocomplete="off">
    </div>
    <div class="form-group">
      <label>Nombre completo</label>
      <input type="text" id="aa-name">
    </div>
    <div class="form-group">
      <label>Contraseña inicial</label>
      <input type="password" id="aa-pass">
    </div>
    <div class="form-group">
      <label>Rol</label>
      <select id="aa-role">
        <option value="admin">admin — puede verificar y rechazar casos</option>
        <option value="superadmin">superadmin — acceso total, puede gestionar admins</option>
      </select>
    </div>
    <div style="display:flex;gap:8px;margin-top:1.25rem;">
      <button class="btn btn-primary" style="flex:1;" onclick="submitAddAdmin()">Agregar</button>
      <button class="btn" onclick="closeModal()">Cancelar</button>
    </div>
  `;
  openModal();
}

async function submitAddAdmin() {
  const username = document.getElementById('aa-user').value.trim().toLowerCase();
  const name     = document.getElementById('aa-name').value.trim();
  const password = document.getElementById('aa-pass').value;
  const role     = document.getElementById('aa-role').value;
  const errEl    = document.getElementById('aa-error');
  errEl.classList.add('hidden');

  if (!username || !name || !password) {
    errEl.textContent = 'Todos los campos son obligatorios.';
    errEl.classList.remove('hidden');
    return;
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    errEl.textContent = 'El usuario solo puede tener letras, números y guiones bajos.';
    errEl.classList.remove('hidden');
    return;
  }

  const { error } = await db.from('admins').insert([{ username, name, password, role }]);
  if (error) {
    errEl.textContent = error.code === '23505' ? 'Ese nombre de usuario ya existe.' : 'Error al crear el admin.';
    errEl.classList.remove('hidden');
    return;
  }
  closeModal();
  renderAdminTab();
}

// ---- MODAL ----
function openModal() { document.getElementById('overlay').classList.remove('hidden'); }
function closeModal() {
  document.getElementById('overlay').classList.add('hidden');
  document.getElementById('modal-content').innerHTML = '';
}
function overlayClick(e) {
  if (e.target === document.getElementById('overlay')) closeModal();
}

// ---- UTILS ----
function esc(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = '✓ Copiado';
    setTimeout(() => { btn.textContent = orig; }, 1600);
  });
}
