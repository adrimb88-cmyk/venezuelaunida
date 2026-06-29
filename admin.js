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
    errEl.textContent = 'Introduce usuario y contrasena.';
    errEl.classList.remove('hidden');
    return;
  }

  const { data, error } = await db
    .from('admins')
    .select('*')
    .eq('username', username)
    .eq('password', password);

  if (error || !data || data.length === 0) {
    errEl.textContent = 'Usuario o contrasena incorrectos.';
    errEl.classList.remove('hidden');
    return;
  }

  const admin = data[0];
  currentSession = { username: admin.username, name: admin.name, role: admin.role };
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
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('admin-section').style.display = 'block';
  document.getElementById('session-info').textContent = 'Sesion: ' + currentSession.name + ' (' + currentSession.role + ')';

  if (currentSession.role === 'superadmin') {
    document.getElementById('btn-add-admin').style.display = '';
    document.getElementById('tab-admins').style.display = '';
  }

  await loadAdminCases();
  setAdminTab(document.querySelector('.admin-tab'), 'pendiente');
}

async function loadAdminCases() {
  const { data } = await db.from('casos').select('*').order('created_at', { ascending: false });
  allAdminCases = data || [];
  updateTabCounts();
}

function updateTabCounts() {
  ['pendiente', 'verificado', 'rechazado'].forEach(function(s) {
    var el = document.getElementById('count-' + (s === 'pendiente' ? 'pendientes' : s));
    if (el) el.textContent = allAdminCases.filter(function(c) { return c.status === s; }).length;
  });
}

// ---- TABS ----
function setAdminTab(btn, tab) {
  currentTab = tab;
  document.querySelectorAll('.admin-tab').forEach(function(t) { t.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  renderAdminTab();
}

function renderAdminTab() {
  var content = document.getElementById('admin-tab-content');
  if (currentTab === 'admins') {
    renderAdminsTab(content);
    return;
  }
  var cases = allAdminCases.filter(function(c) { return c.status === currentTab; });
  if (!cases.length) {
    content.innerHTML = '<p style="padding:2rem;color:var(--muted);text-align:center;font-size:14px;">No hay casos en este estado.</p>';
    return;
  }
  renderCasesTable(content, cases);
}

function renderCasesTable(container, cases) {
  var wrapper = document.createElement('div');
  wrapper.style.overflowX = 'auto';

  var table = document.createElement('table');
  table.className = 'admin-table';
  table.innerHTML = '<thead><tr><th>Nombre / Estado</th><th>Descripcion</th><th>Categorias</th><th>Medios</th><th>Enviado por</th><th>Fecha</th><th>Acciones</th></tr></thead>';

  var tbody = document.createElement('tbody');
  cases.forEach(function(c) {
    var tr = document.createElement('tr');

    var cats = (c.categories || []).map(function(cat) {
      var info = CATS.find(function(x) { return x.id === cat; }) || { label: cat, cls: 'tag-otros' };
      return '<span class="tag ' + info.cls + '" style="display:inline-block;margin:2px 2px 2px 0;">' + info.label + '</span>';
    }).join('');

    var medios = [
      c.gofundme     ? 'GoFundMe' : '',
      c.instagram    ? 'Reel'     : '',
      c.tiene_cuenta ? 'Cuenta'   : '',
    ].filter(Boolean).join(' / ');

    tr.innerHTML =
      '<td style="min-width:140px;"><strong>' + esc(c.name) + '</strong><br><small style="color:var(--muted);">' + esc(c.zone) + '</small></td>' +
      '<td style="max-width:200px;font-size:12px;color:var(--muted);">' + (c.description ? esc(c.description).substring(0, 120) : '—') + '</td>' +
      '<td style="min-width:150px;">' + cats + '</td>' +
      '<td style="font-size:12px;min-width:90px;">' + (medios || '—') + '</td>' +
      '<td style="font-size:12px;color:var(--muted);min-width:120px;">' + esc(c.contacto_nombre || '—') + '<br><small>' + esc(c.contacto_interno || '') + '</small></td>' +
      '<td style="font-size:12px;white-space:nowrap;">' + formatDate(c.created_at) + '</td>' +
      '<td style="min-width:180px;"></td>';

    var tdActions = tr.querySelectorAll('td')[6];
    var actRow = document.createElement('div');
    actRow.className = 'action-row';

    if (c.gofundme) {
      var a = document.createElement('a');
      a.className = 'btn btn-sm';
      a.href = c.gofundme;
      a.target = '_blank';
      a.textContent = 'Ver GFM';
      actRow.appendChild(a);
    }

    if (c.tiene_cuenta) {
      var btnCuenta = document.createElement('button');
      btnCuenta.className = 'btn btn-sm';
      btnCuenta.textContent = 'Ver cuenta';
      btnCuenta.onclick = (function(caso) { return function() { showCuentaAdmin(caso); }; })(c);
      actRow.appendChild(btnCuenta);
    }

    if (currentTab !== 'verificado') {
      var btnOk = document.createElement('button');
      btnOk.className = 'btn btn-sm btn-success';
      btnOk.textContent = 'Verificar';
      btnOk.onclick = (function(id, btn) { return function() { updateStatus(id, 'verificado', btn); }; })(c.id, btnOk);
      actRow.appendChild(btnOk);
    }

    if (currentTab !== 'rechazado') {
      var btnR = document.createElement('button');
      btnR.className = 'btn btn-sm btn-danger';
      btnR.textContent = 'Rechazar';
      btnR.onclick = (function(id, btn) { return function() { if (confirm('Rechazar este caso?')) updateStatus(id, 'rechazado', btn); }; })(c.id, btnR);
      actRow.appendChild(btnR);
    }

    if (currentTab === 'rechazado') {
      var btnBack = document.createElement('button');
      btnBack.className = 'btn btn-sm';
      btnBack.textContent = 'Reabrir';
      btnBack.onclick = (function(id, btn) { return function() { updateStatus(id, 'pendiente', btn); }; })(c.id, btnBack);
      actRow.appendChild(btnBack);
    }

    var btnDel = document.createElement('button');
    btnDel.className = 'btn btn-sm btn-danger';
    btnDel.textContent = 'Borrar';
    btnDel.onclick = (function(id) { return function() { if (confirm('Borrar este caso? No se puede deshacer.')) deleteCase(id); }; })(c.id);
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
  var result = await db.from('casos').update({ status: status }).eq('id', id);
  if (!result.error) {
    allAdminCases = allAdminCases.map(function(c) { return c.id === id ? Object.assign({}, c, { status: status }) : c; });
    updateTabCounts();
    renderAdminTab();
  } else {
    btn.disabled = false;
    btn.textContent = 'Error';
  }
}

async function deleteCase(id) {
  var result = await db.from('casos').delete().eq('id', id);
  if (!result.error) {
    allAdminCases = allAdminCases.filter(function(c) { return c.id !== id; });
    updateTabCounts();
    renderAdminTab();
  }
}

// ---- CUENTA MODAL (admin) ----
function showCuentaAdmin(c) {
  var rows = [
    ['Banco', c.banco],
    ['N cuenta', c.num_cuenta],
    ['Tipo', c.tipo_cuenta],
    ['Titular', c.titular],
    ['Cedula', c.cedula],
    ['Pago Movil', c.pago_movil],
  ].filter(function(r) { return r[1]; });

  var html = '<h2>Datos bancarios</h2><p style="font-size:13px;color:var(--muted);margin-bottom:1rem;">' + esc(c.name) + '</p><div class="cuenta-data">';
  rows.forEach(function(row) {
    html += '<div class="cuenta-row"><span class="cuenta-key">' + row[0] + '</span><span class="cuenta-val">' + esc(row[1]) + '</span><button class="copy-btn" onclick="copyText(\'' + esc(row[1]) + '\', this)">Copiar</button></div>';
  });
  html += '</div>';

  document.getElementById('modal-content').innerHTML = html;
  openModal();
}

// ---- ADMINS TAB ----
async function renderAdminsTab(container) {
  var result = await db.from('admins').select('username, name, role, created_at');
  var admins = result.data;
  if (!admins) { container.innerHTML = '<p>Error cargando admins.</p>'; return; }

  var wrapper = document.createElement('div');
  wrapper.style.overflowX = 'auto';
  var table = document.createElement('table');
  table.className = 'admin-table';
  table.innerHTML = '<thead><tr><th>Usuario</th><th>Nombre</th><th>Rol</th><th>Creado</th><th>Acciones</th></tr></thead>';
  var tbody = document.createElement('tbody');

  admins.forEach(function(a) {
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + esc(a.username) + '</td>' +
      '<td>' + esc(a.name) + '</td>' +
      '<td><span class="status-pill ' + (a.role === 'superadmin' ? 'pill-verificado' : 'pill-pendiente') + '">' + a.role + '</span></td>' +
      '<td style="font-size:12px;">' + formatDate(a.created_at) + '</td>' +
      '<td></td>';

    if (a.username !== currentSession.username) {
      var td = tr.querySelectorAll('td')[4];
      var btn = document.createElement('button');
      btn.className = 'btn btn-sm btn-danger';
      btn.textContent = 'Eliminar';
      btn.onclick = (function(uname) {
        return async function() {
          if (!confirm('Eliminar el admin ' + uname + '?')) return;
          await db.from('admins').delete().eq('username', uname);
          renderAdminTab();
        };
      })(a.username);
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
  document.getElementById('modal-content').innerHTML =
    '<h2>Agregar administrador</h2>' +
    '<div id="aa-error" class="error-msg hidden"></div>' +
    '<div class="form-group"><label>Usuario</label><input type="text" id="aa-user" autocomplete="off"></div>' +
    '<div class="form-group"><label>Nombre completo</label><input type="text" id="aa-name"></div>' +
    '<div class="form-group"><label>Contrasena inicial</label><input type="password" id="aa-pass"></div>' +
    '<div class="form-group"><label>Rol</label><select id="aa-role"><option value="admin">admin</option><option value="superadmin">superadmin</option></select></div>' +
    '<div style="display:flex;gap:8px;margin-top:1.25rem;"><button class="btn btn-primary" style="flex:1;" onclick="submitAddAdmin()">Agregar</button><button class="btn" onclick="closeModal()">Cancelar</button></div>';
  openModal();
}

async function submitAddAdmin() {
  var username = document.getElementById('aa-user').value.trim().toLowerCase();
  var name     = document.getElementById('aa-name').value.trim();
  var password = document.getElementById('aa-pass').value;
  var role     = document.getElementById('aa-role').value;
  var errEl    = document.getElementById('aa-error');
  errEl.classList.add('hidden');

  if (!username || !name || !password) {
    errEl.textContent = 'Todos los campos son obligatorios.';
    errEl.classList.remove('hidden');
    return;
  }

  var result = await db.from('admins').insert([{ username: username, name: name, password: password, role: role }]);
  if (result.error) {
    errEl.textContent = result.error.code === '23505' ? 'Ese usuario ya existe.' : 'Error al crear el admin.';
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
  navigator.clipboard.writeText(text).then(function() {
    var orig = btn.textContent;
    btn.textContent = 'Copiado';
    setTimeout(function() { btn.textContent = orig; }, 1600);
  });
}
