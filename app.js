// ============================================================
//  APP.JS — Página pública Venezuela Unida
// ============================================================

const CATS = [
  { id: 'vivienda',     label: 'Vivienda',                cls: 'tag-vivienda' },
  { id: 'salud',        label: 'Gastos hospitalarios',    cls: 'tag-salud' },
  { id: 'funerarios',   label: 'Gastos funerarios',       cls: 'tag-funerarios' },
  { id: 'transporte',   label: 'Transporte / movilización', cls: 'tag-transporte' },
  { id: 'alimentacion', label: 'Alimentación',            cls: 'tag-alimentacion' },
  { id: 'ninos',        label: 'Bebés / niños',           cls: 'tag-ninos' },
  { id: 'mascotas',     label: 'Mascotas',                cls: 'tag-mascotas' },
  { id: 'bienes',       label: 'Pérdida de bienes',       cls: 'tag-bienes' },
  { id: 'otros',        label: 'Otros',                   cls: 'tag-otros' },
];

let allCases = [];
let activeCat = 'all';

// ---- INIT ----
document.addEventListener('DOMContentLoaded', async () => {
  await loadCases();
  updateStats();
});

async function loadCases() {
  const grid = document.getElementById('cards-grid');
  grid.innerHTML = '<div class="loading">Cargando causas...</div>';

  const { data, error } = await db
    .from('casos')
    .select('*')
    .eq('status', 'verificado')
    .order('created_at', { ascending: false });

  if (error) {
    grid.innerHTML = '<div class="empty-state"><div class="emoji">⚠️</div><p>Error al cargar las causas. Intenta recargar la página.</p></div>';
    return;
  }

  allCases = data || [];
  renderCards(allCases);
}

async function updateStats() {
  const { data } = await db.from('casos').select('status, zone');
  if (!data) return;

  const verificados = data.filter(c => c.status === 'verificado');
  const pendientes  = data.filter(c => c.status === 'pendiente');
  const estados     = new Set(verificados.map(c => c.zone)).size;

  document.getElementById('stat-total').textContent     = verificados.length;
  document.getElementById('stat-estados').textContent   = estados;
  document.getElementById('stat-pendientes').textContent = pendientes.length;
}

// ---- FILTERS ----
function setCat(btn, cat) {
  activeCat = cat;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  applyFilters();
}

function applyFilters() {
  const search = document.getElementById('search').value.toLowerCase().trim();
  const zone   = document.getElementById('zone-select').value;

  const filtered = allCases.filter(c => {
    if (activeCat !== 'all' && !(c.categories || []).includes(activeCat)) return false;
    if (zone !== 'all' && c.zone !== zone) return false;
    if (search) {
      const hay = (c.name + ' ' + c.zone + ' ' + (c.description || '')).toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  renderCards(filtered);
}

// ---- RENDER CARDS ----
function renderCards(cases) {
  const grid = document.getElementById('cards-grid');
  grid.innerHTML = '';

  if (!cases.length) {
    grid.innerHTML = '<div class="empty-state"><div class="emoji">🇻🇪</div><p>No se encontraron causas con esos filtros.</p></div>';
    return;
  }

  cases.forEach(c => grid.appendChild(buildCard(c)));
}

function buildCard(c) {
  const div = document.createElement('div');
  div.className = 'case-card';

  const av = initials(c.name);
  const cats = (c.categories || []).map(cat => {
    const info = CATS.find(x => x.id === cat) || { label: cat, cls: 'tag-otros' };
    return `<span class="tag ${info.cls}">${info.label}</span>`;
  }).join('');

  const links = [
    c.gofundme   ? `<a class="case-link gofundme" href="${esc(c.gofundme)}" target="_blank" rel="noopener">💚 GoFundMe</a>` : '',
    c.instagram  ? `<a class="case-link instagram" href="${esc(c.instagram)}" target="_blank" rel="noopener">📸 Reel</a>` : '',
    c.tiene_cuenta ? `<button class="case-link cuenta" onclick="showCuenta('${c.id}')">🏦 Datos bancarios</button>` : '',
  ].filter(Boolean).join('');

  div.innerHTML = `
    <div class="case-card-top">
      <div class="case-avatar">${esc(av)}</div>
      <div style="flex:1;min-width:0;">
        <div class="case-name">${esc(c.name)}</div>
        <div class="case-zone">📍 ${esc(c.zone)}</div>
      </div>
    </div>
    ${c.description ? `<div class="case-desc">${esc(c.description)}</div>` : ''}
    <div class="case-tags">${cats}</div>
    <div class="case-actions">${links}</div>
    <div class="case-card-footer">
      <span class="verified-badge"><span class="verified-dot"></span>Verificado</span>
      <span class="case-date">${timeAgo(c.created_at)}</span>
    </div>
  `;
  return div;
}

// ---- CUENTA MODAL ----
async function showCuenta(id) {
  const c = allCases.find(x => x.id === id);
  if (!c) return;

  const rows = [
    ['Banco',           c.banco],
    ['Número de cuenta', c.num_cuenta],
    ['Tipo de cuenta',  c.tipo_cuenta],
    ['Titular',         c.titular],
    ['Cédula',          c.cedula],
  ].filter(r => r[1]);

  const rowsHtml = rows.map(([k, v]) => `
    <div class="cuenta-row">
      <span class="cuenta-key">${k}</span>
      <span class="cuenta-val">${esc(v)}</span>
      <button class="copy-btn" onclick="copyText('${esc(v)}', this)">Copiar</button>
    </div>
  `).join('');

  const pagoMovilHtml = c.pago_movil ? `
    <div class="pago-movil-section">
      <div class="pago-movil-title">📱 Pago Móvil</div>
      <div class="pago-movil-row">
        <span class="cuenta-key">Teléfono</span>
        <span class="cuenta-val">${esc(c.pago_movil)}</span>
        <button class="copy-btn" onclick="copyText('${esc(c.pago_movil)}', this)">Copiar</button>
      </div>
      <div class="qr-placeholder">QR<br>Pago Móvil<br><small>próximamente</small></div>
    </div>
  ` : '';

  const allText = rows.map(([k, v]) => `${k}: ${v}`).join('\n') + (c.pago_movil ? `\nPago Móvil: ${c.pago_movil}` : '');

  document.getElementById('modal-content').innerHTML = `
    <h2>Datos bancarios</h2>
    <p style="font-size:13px;color:var(--muted);margin-bottom:1rem;">${esc(c.name)} · ${esc(c.zone)}</p>
    <div class="cuenta-data">${rowsHtml}</div>
    ${pagoMovilHtml}
    <button class="btn btn-full" style="margin-top:1rem;" onclick="copyText(\`${allText.replace(/`/g,'\\`')}\`, this)">
      📋 Copiar todos los datos
    </button>
  `;
  openModal();
}

// ---- REGISTER MODAL ----
function openModal(type) {
  if (type === 'register') renderRegisterForm();
  document.getElementById('overlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('overlay').classList.add('hidden');
  document.getElementById('modal-content').innerHTML = '';
}

function overlayClick(e) {
  if (e.target === document.getElementById('overlay')) closeModal();
}

function renderRegisterForm() {
  const catsCheckboxes = CATS.map(c => `
    <label class="checkbox-item">
      <input type="checkbox" name="cat" value="${c.id}"> ${c.label}
    </label>
  `).join('');

  const zonesOptions = [
    'Amazonas','Anzoátegui','Apure','Aragua','Barinas','Bolívar',
    'Carabobo','Caracas (D.C.)','Cojedes','Delta Amacuro','Falcón',
    'Guárico','Lara','Mérida','Miranda','Monagas','Nueva Esparta',
    'Portuguesa','Sucre','Táchira','Trujillo','Vargas (La Guaira)',
    'Yaracuy','Zulia','Otra'
  ].map(z => `<option>${z}</option>`).join('');

  document.getElementById('modal-content').innerHTML = `
    <h2>Agregar una causa</h2>
    <div class="notice">⏳ Tu solicitud será revisada antes de publicarse. Asegúrate de que toda la información sea real y verificable.</div>
    <div id="reg-error" class="error-msg hidden"></div>
    <div id="reg-success" class="success-msg hidden"></div>

    <div class="form-group">
      <label>Nombre completo o familia *</label>
      <input type="text" id="r-name" placeholder="Ej: Familia Rodríguez Pérez">
    </div>
    <div class="form-group">
      <label>Estado del país *</label>
      <select id="r-zone"><option value="">— Selecciona —</option>${zonesOptions}</select>
    </div>
    <div class="form-group">
      <label>Descripción breve *</label>
      <textarea id="r-desc" placeholder="Qué pasó y qué necesitan (máx. 300 caracteres)" maxlength="300"></textarea>
    </div>
    <div class="form-group">
      <label>Categorías * (elige las que apliquen)</label>
      <div class="checkbox-group">${catsCheckboxes}</div>
    </div>

    <div class="form-section">
      <div class="form-section-title">Formas de donación</div>
      <div class="form-group">
        <label>Enlace GoFundMe <span style="color:var(--muted);font-weight:400;">(opcional)</span></label>
        <input type="url" id="r-gofundme" placeholder="https://gofundme.com/...">
      </div>
      <div class="form-group">
        <label>Enlace Reel de Instagram <span style="color:var(--muted);font-weight:400;">(opcional)</span></label>
        <input type="url" id="r-instagram" placeholder="https://www.instagram.com/reel/...">
      </div>
      <label class="checkbox-item" style="margin-bottom:12px;font-weight:500;">
        <input type="checkbox" id="r-tiene-cuenta" onchange="toggleCuenta()">
        Tiene cuenta bancaria en Venezuela
      </label>
      <div id="cuenta-fields" style="display:none;">
        <div class="form-row">
          <div class="form-group">
            <label>Banco</label>
            <input type="text" id="r-banco" placeholder="Ej: Banesco">
          </div>
          <div class="form-group">
            <label>Tipo de cuenta</label>
            <input type="text" id="r-tipo" placeholder="Ahorro / Corriente">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Número de cuenta</label>
            <input type="text" id="r-numcuenta" placeholder="0000-0000-00-0000000000">
          </div>
          <div class="form-group">
            <label>Cédula del titular</label>
            <input type="text" id="r-cedula" placeholder="V-00.000.000">
          </div>
        </div>
        <div class="form-group">
          <label>Nombre del titular</label>
          <input type="text" id="r-titular">
        </div>
        <div class="form-group">
          <label>Número Pago Móvil <span style="color:var(--muted);font-weight:400;">(opcional)</span></label>
          <input type="text" id="r-pagomovil" placeholder="04XX-XXXXXXX">
        </div>
      </div>
    </div>

    <div class="form-section">
      <div class="form-section-title">Tu información — no se publica, solo para verificación</div>
      <div class="form-group">
        <label>Tu nombre</label>
        <input type="text" id="r-contactnombre">
      </div>
      <div class="form-group">
        <label>Tu email o teléfono de contacto</label>
        <input type="text" id="r-contacto">
      </div>
    </div>

    <div style="display:flex;gap:8px;margin-top:1.5rem;">
      <button class="btn btn-primary btn-full" onclick="submitRegister()">Enviar solicitud</button>
      <button class="btn" style="padding:10px 16px;" onclick="closeModal()">Cancelar</button>
    </div>
  `;
}

function toggleCuenta() {
  const show = document.getElementById('r-tiene-cuenta').checked;
  document.getElementById('cuenta-fields').style.display = show ? '' : 'none';
}

async function submitRegister() {
  const name   = (document.getElementById('r-name')?.value || '').trim();
  const zone   = document.getElementById('r-zone')?.value || '';
  const desc   = (document.getElementById('r-desc')?.value || '').trim();
  const cats   = Array.from(document.querySelectorAll('input[name=cat]:checked')).map(x => x.value);
  const gofundme  = (document.getElementById('r-gofundme')?.value || '').trim();
  const instagram = (document.getElementById('r-instagram')?.value || '').trim();
  const tieneCuenta = document.getElementById('r-tiene-cuenta')?.checked;
  const contacto    = (document.getElementById('r-contacto')?.value || '').trim();
  const contactnombre = (document.getElementById('r-contactnombre')?.value || '').trim();

  const errEl = document.getElementById('reg-error');
  errEl.classList.add('hidden');

  if (!name || !zone || !desc || !cats.length) {
    errEl.textContent = 'Completa los campos obligatorios: nombre, estado, descripción y al menos una categoría.';
    errEl.classList.remove('hidden');
    return;
  }
  if (!gofundme && !tieneCuenta) {
    errEl.textContent = 'Indica al menos un GoFundMe o una cuenta bancaria.';
    errEl.classList.remove('hidden');
    return;
  }

  const payload = {
    name, zone, description: desc, categories: cats,
    gofundme: gofundme || null,
    instagram: instagram || null,
    tiene_cuenta: tieneCuenta || false,
    banco:      tieneCuenta ? (document.getElementById('r-banco')?.value || null) : null,
    num_cuenta: tieneCuenta ? (document.getElementById('r-numcuenta')?.value || null) : null,
    cedula:     tieneCuenta ? (document.getElementById('r-cedula')?.value || null) : null,
    titular:    tieneCuenta ? (document.getElementById('r-titular')?.value || null) : null,
    tipo_cuenta:tieneCuenta ? (document.getElementById('r-tipo')?.value || null) : null,
    pago_movil: tieneCuenta ? (document.getElementById('r-pagomovil')?.value || null) : null,
    status: 'pendiente',
    contacto_interno: contacto || null,
    contacto_nombre: contactnombre || null,
  };

  const { error } = await db.from('casos').insert([payload]);

  if (error) {
    errEl.textContent = 'Error al enviar. Intenta de nuevo.';
    errEl.classList.remove('hidden');
    return;
  }

  document.getElementById('reg-success').textContent = '✅ Solicitud enviada. La revisaremos pronto y, si todo está en orden, la publicaremos.';
  document.getElementById('reg-success').classList.remove('hidden');
  document.getElementById('reg-error').classList.add('hidden');

  setTimeout(() => closeModal(), 4000);
}

// ---- UTILS ----
function initials(name) {
  return (name || '').split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase();
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (diff === 0) return 'hoy';
  if (diff === 1) return 'ayer';
  return `hace ${diff} días`;
}

function esc(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = '✓ Copiado';
    setTimeout(() => { btn.textContent = orig; }, 1600);
  });
}
