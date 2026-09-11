/* ============================================================
   Funciones compartidas: HTML, fechas, sesión y autenticación.
   ============================================================ */

function escapeHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto == null ? '' : String(texto);
  return div.innerHTML;
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

/* Convierte texto plano en párrafos HTML seguros (sin XSS) */
function renderText(texto) {
  const esc = escapeHtml(texto || '');
  const parrafos = esc
    .split(/\n{2,}/)
    .map((p) => '<p>' + p.replace(/\n/g, '<br>') + '</p>')
    .join('');
  return parrafos || '<p><em>Sin contenido todavía.</em></p>';
}

function inicial() {
  return 'X';
}

function avatarDe(nombre, size) {
  const letra = (nombre || 'U').trim().charAt(0).toUpperCase() || 'U';
  return `<span class="avatar" style="width:${size || 42}px;height:${size || 42}px;font-size:${Math.round((size || 42) * 0.42)}px">${escapeHtml(letra)}</span>`;
}

/* ============================================================
   Autenticación
   ============================================================ */

async function obtenerSesion() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

async function obtenerPerfil() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', sesion.user.id).maybeSingle();
  return data || { full_name: sesion.user.email, role: 'student' };
}

async function esAdmin() {
  const { data } = await supabase.rpc('is_admin');
  return data === true;
}

/* Inyecta el modal de inicio de sesión / registro en #auth-modal-root */
function inyectarModalAuth() {
  const root = document.getElementById('auth-modal-root');
  if (!root) return;

  root.innerHTML = `
  <div class="modal fade" id="modalAuth" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <form id="formAuth" novalidate>
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title" id="authTitulo">Iniciar sesión</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3 d-none" id="authNombreWrap">
              <label class="form-label">Nombres</label>
              <input class="form-control" id="authNombre" type="text" autocomplete="name">
            </div>
            <div class="mb-3">
              <label class="form-label">Correo institucional</label>
              <input class="form-control" id="authEmail" type="email" required autocomplete="email" placeholder="tucorreo@unsm.edu.pe">
            </div>
            <div class="mb-3">
              <label class="form-label">Contraseña</label>
              <input class="form-control" id="authPass" type="password" required autocomplete="current-password" placeholder="Mínimo 6 caracteres">
            </div>
            <div class="alert alert-danger d-none" id="authError" role="alert"></div>
            <div class="form-check form-switch mt-1">
              <input class="form-check-input" type="checkbox" id="authRegistro" role="switch">
              <label class="form-check-label" for="authRegistro" id="authRegistroLabel">¿Eres nuevo? Regístrate (el primer usuario registrado será el administrador)</label>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="submit" class="btn btn-unsm" id="authBoton">Iniciar sesión</button>
          </div>
        </form>
      </div>
    </div>
  </div>`;

  const form = document.getElementById('formAuth');
  const registro = document.getElementById('authRegistro');
  const nombreWrap = document.getElementById('authNombreWrap');
  const titulo = document.getElementById('authTitulo');
  const boton = document.getElementById('authBoton');
  const errorBox = document.getElementById('authError');

  registro.addEventListener('change', () => {
    nombreWrap.classList.toggle('d-none', !registro.checked);
    if (registro.checked) {
      titulo.textContent = 'Crear cuenta';
      boton.textContent = 'Registrarse';
    } else {
      titulo.textContent = 'Iniciar sesión';
      boton.textContent = 'Iniciar sesión';
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.classList.add('d-none');
    const email = document.getElementById('authEmail').value.trim();
    const pass = document.getElementById('authPass').value;
    const nombre = document.getElementById('authNombre').value.trim();
    const esRegistro = registro.checked;

    boton.disabled = true;
    boton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Espera...';

    try {
      if (esRegistro) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: { data: { full_name: nombre || email.split('@')[0] } }
        });
        if (error) throw error;
        if (data.session) {
          mostrarNotificacion('Cuenta creada e inicio de sesión realizado. ¡Bienvenido!');
        } else {
          mostrarNotificacion('Cuenta creada. Revisa tu correo para confirmar y poder iniciar sesión.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        mostrarNotificacion('Sesión iniciada correctamente.');
      }
      bootstrap.Modal.getInstance(document.getElementById('modalAuth')).hide();
      form.reset();
      registro.checked = false;
      nombreWrap.classList.add('d-none');
      titulo.textContent = 'Iniciar sesión';
      boton.textContent = 'Iniciar sesión';
      await actualizarNav();
    } catch (err) {
      errorBox.textContent = err.message || 'Error al iniciar sesión.';
      errorBox.classList.remove('d-none');
    } finally {
      boton.disabled = false;
      boton.textContent = esRegistro ? 'Registrarse' : 'Iniciar sesión';
    }
  });
}

/* Abre el modal de autenticación en el modo deseado (registro o inicio de sesión) */
function configurarModalAuth(esRegistro) {
  const registro = document.getElementById('authRegistro');
  if (!registro) return;
  const nombreWrap = document.getElementById('authNombreWrap');
  const titulo = document.getElementById('authTitulo');
  const boton = document.getElementById('authBoton');
  registro.checked = !!esRegistro;
  nombreWrap.classList.toggle('d-none', !esRegistro);
  titulo.textContent = esRegistro ? 'Crear cuenta' : 'Iniciar sesión';
  boton.textContent = esRegistro ? 'Registrarse' : 'Iniciar sesión';
}

function abrirModalRegistro() {
  configurarModalAuth(true);
  bootstrap.Modal.getOrCreateInstance(document.getElementById('modalAuth')).show();
}

function abrirModalSesion() {
  configurarModalAuth(false);
  bootstrap.Modal.getOrCreateInstance(document.getElementById('modalAuth')).show();
}

/* Renders el estado de sesión dentro de #nav-session */
async function renderNavSesion() {
  const cont = document.getElementById('nav-session');
  if (!cont) return;
  const sesion = await obtenerSesion();

  if (!sesion) {
    cont.innerHTML = `
      <button class="btn btn-outline-unsm btn-sm px-3" onclick="abrirModalRegistro()">
        <i class="bi bi-person-plus me-1"></i>Registrarse
      </button>
      <button class="btn btn-unsm btn-sm px-3" onclick="abrirModalSesion()">
        <i class="bi bi-box-arrow-in-right me-1"></i>Iniciar sesión
      </button>`;
    return;
  }

  const perfil = await obtenerPerfil();
  const admin = await esAdmin();
  let link = '';
  if (admin) {
    link = `<a class="btn btn-unsm btn-sm px-3" href="admin.html"><i class="bi bi-cloud-arrow-up me-1"></i>Subir trabajo</a>`;
  }
  const nombre = (perfil && perfil.full_name) ||
    (sesion.user.user_metadata && sesion.user.user_metadata.full_name) ||
    sesion.user.email;

  cont.innerHTML = `
    <div class="d-flex align-items-center gap-3">
      ${link}
      <span class="navbar-session-name">${escapeHtml(nombre)}</span>
      <button class="btn btn-outline-unsm btn-sm px-3" id="btnSalir">
        <i class="bi bi-box-arrow-right me-1"></i>Salir
      </button>
    </div>`;

  document.getElementById('btnSalir').addEventListener('click', async () => {
    await supabase.auth.signOut();
    mostrarNotificacion('Sesión cerrada.');
    await actualizarNav();
  });
}

async function actualizarNav() {
  await renderNavSesion();
  const callback = window.__onSessionChange;
  if (typeof callback === 'function') callback();
}

function mostrarNotificacion(mensaje, esError) {
  const old = document.getElementById('toastNotif');
  if (old) old.remove();
  const div = document.createElement('div');
  div.id = 'toastNotif';
  div.className = 'position-fixed top-0 end-0 m-3 p-3 text-white rounded-3 shadow toast-notif';
  div.style.zIndex = '9999';
  div.style.background = esError ? '#dc3545' : '#0c7a3e';
  div.textContent = mensaje;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 4000);
}

function spinnerHTML() {
  return `<div class="spinner-box"><div class="spinner-border text-success" role="status"></div></div>`;
}

async function iniciarComun(callback) {
  supabase = crearClienteSupabase();
  inyectarModalAuth();
  await renderNavSesion();
  if (callback) await callback();
}