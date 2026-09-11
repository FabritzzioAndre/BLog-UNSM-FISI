/* ============================================================
   Panel de administración: subir / editar / borrar trabajos.
   Solo visible para el rol "admin".
   ============================================================ */

let postEditando = null;

function nombreSeguro(nombre) {
  const base = (nombre || 'archivo').replace(/\.[^.]+$/, '');
  return base
    .replace(/[^a-z0-9ñÑáéíóúÁÉÍÓÚ\s-]/gi, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

function extDe(nombre) {
  const m = (nombre || '').match(/\.([^.]+)$/);
  return m ? m[1].toLowerCase() : 'bin';
}

function semanaMax(unidad) {
  const u = unidadPorNumero(unidad);
  return u ? u.semanas : 6;
}

function renderErroresVinculacion(err) {
  const mensaje = String(err && err.message || '');
  const faltaTabla = /does not exist|PGRST205|42P01/.test(mensaje);
  return `
    <div class="alert ${faltaTabla ? 'alert-warning' : 'alert-danger'}" role="alert">
      <h5 class="alert-heading"><i class="bi bi-database-x me-2"></i>${faltaTabla ? 'Base de datos en configuración' : 'No se pudo conectar'}</h5>
      <p class="mb-1">${escapeHtml(mensaje)}</p>
      ${faltaTabla ? '<p class="small mb-0">Ejecuta el archivo <code>sql/schema.sql</code> en el SQL Editor de Supabase y vuelve a entrar.</p>' : ''}
    </div>`;
}

function opcionesSemanas(unidad, seleccionada) {
  const max = semanaMax(unidad);
  return Array.from({ length: max }, (_, i) => {
    const s = i + 1;
    return `<option value="${s}" ${s === Number(seleccionada) ? 'selected' : ''}>Semana ${s}</option>`;
  }).join('');
}

function renderFormulario() {
  const p = postEditando;
  const unidad = p ? p.unit : 1;
  const semana = p ? p.week : 1;

  return `
  <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
    <h1 class="h3 mb-0" style="font-weight:800;color:var(--verde-oscuro);">
      <i class="bi bi-cloud-arrow-up me-2"></i>${p ? 'Editar trabajo' : 'Publicar trabajo semanal'}
    </h1>
    <a class="btn btn-outline-unsm btn-sm" href="index.html"><i class="bi bi-eye me-1"></i>Ver página pública</a>
  </div>

  <form id="formTrabajo">
    <div class="row g-3">
      <div class="col-md-6">
        <label class="form-label">Unidad</label>
        <select class="form-select" id="campoUnidad" required>
          <option value="1" ${unidad === 1 ? 'selected' : ''}>Unidad 1</option>
          <option value="2" ${unidad === 2 ? 'selected' : ''}>Unidad 2</option>
          <option value="3" ${unidad === 3 ? 'selected' : ''}>Unidad 3</option>
        </select>
      </div>
      <div class="col-md-6">
        <label class="form-label">Semana</label>
        <select class="form-select" id="campoSemana" required>${opcionesSemanas(unidad, semana)}</select>
      </div>
      <div class="col-12">
        <label class="form-label">Título del trabajo</label>
        <input class="form-control" id="campoTitulo" type="text" required maxlength="200"
          value="${escapeHtml(p ? p.title : '')}" placeholder="Ej.: Semana 1 – Conceptos básicos de investigación">
      </div>
      <div class="col-12">
        <label class="form-label">Resumen (se muestra en la tarjeta del inicio)</label>
        <textarea class="form-control" id="campoDescripcion" rows="2" maxlength="300"
          placeholder="Una o dos frases que resuman el trabajo.">${escapeHtml(p ? p.description : '')}</textarea>
      </div>
      <div class="col-12">
        <label class="form-label">Contenido del trabajo</label>
        <textarea class="form-control" id="campoContenido" rows="8"
          placeholder="Escribe aquí el contenido del trabajo. Deja una línea en blanco para separar párrafos.">${escapeHtml(p ? p.content : '')}</textarea>
      </div>
      <div class="col-12">
        <label class="form-label">Archivo adjunto (PDF, Word o imagen)</label>
        <input class="form-control" type="file" id="campoArchivo" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg">
        <div class="form-text" id="archivoActual"></div>
      </div>
      <div class="col-12 d-flex gap-2 flex-wrap">
        <button type="submit" class="btn btn-unsm px-4"><i class="bi bi-save me-1"></i>${p ? 'Actualizar trabajo' : 'Publicar trabajo'}</button>
        <button type="button" class="btn btn-secondary" id="btnLimpiar">Limpiar</button>
      </div>
    </div>
  </form>
  <hr class="my-4">
  <h2 class="h5 mb-3" style="font-weight:700;color:var(--verde-oscuro);"><i class="bi bi-list-ul me-2"></i>Trabajos publicados</h2>
  <div id="tablaTrabajos"></div>`;
}

function renderTabla(posts) {
  const cont = document.getElementById('tablaTrabajos');
  if (!posts.length) {
    cont.innerHTML = `<p class="text-secondary small mb-0">Todavía no hay trabajos publicados.</p>`;
    return;
  }
  cont.innerHTML = `
    <div class="table-responsive">
      <table class="table table-hover align-middle tabla-trabajos">
        <thead>
          <tr><th>Unidad</th><th>Semana</th><th>Título</th><th>Archivo</th><th>Actualizado</th><th class="text-end">Acciones</th></tr>
        </thead>
        <tbody>
          ${posts.map((p) => `
            <tr>
              <td><span class="badge badge-unidad">U${p.unit}</span></td>
              <td>Semana ${p.week}</td>
              <td><a href="trabajo.html?unidad=${p.unit}&semana=${p.week}" target="_blank">${escapeHtml(p.title)}</a></td>
              <td>${p.file_name ? '<i class="bi bi-paperclip text-success" title="' + escapeHtml(p.file_name) + '"></i>' : '<span class="text-secondary">—</span>'}</td>
              <td class="small text-secondary">${formatDate(p.updated_at)}</td>
              <td class="text-end text-nowrap">
                <button class="btn btn-sm btn-outline-unsm" onclick="cargarEnFormulario(${p.id})" title="Editar"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="borrarTrabajo(${p.id})" title="Borrar"><i class="bi bi-trash"></i></button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

async function cargarTabla() {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .order('unit').order('week');
  if (error) throw error;
  renderTabla(posts || []);
}

async function cargarEnFormulario(id) {
  const { data: p, error } = await supabase.from('posts').select('*').eq('id', id).maybeSingle();
  if (error || !p) return mostrarNotificacion('No se encontró el trabajo.', true);
  postEditando = p;
  const zona = document.getElementById('contenido-admin');
  zona.innerHTML = renderFormulario();
  vincularFormulario();
  if (p.file_name) {
    document.getElementById('archivoActual').innerHTML =
      `Archivo actual: <strong>${escapeHtml(p.file_name)}</strong>. Si eliges otro archivo se reemplazará.`;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function borrarTrabajo(id) {
  const { data: p } = await supabase.from('posts').select('file_path').eq('id', id).maybeSingle();
  if (!confirm('¿Borrar este trabajo y su archivo?')) return;
  if (p && p.file_path) {
    await supabase.storage.from('trabajos').remove([p.file_path]);
  }
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) {
    mostrarNotificacion('No se pudo borrar: ' + error.message, true);
  } else {
    if (postEditando && postEditando.id === id) postEditando = null;
    try { await cargarTabla(); } catch { /* sin cambios */ }
    document.getElementById('contenido-admin').querySelector('#formTrabajo') &&
      (document.getElementById('contenido-admin').innerHTML = renderFormulario(), vincularFormulario());
    mostrarNotificacion('Trabajo eliminado.');
  }
}

function vincularFormulario() {
  const selectUnidad = document.getElementById('campoUnidad');
  const selectSemana = document.getElementById('campoSemana');

  selectUnidad.addEventListener('change', () => {
    selectSemana.innerHTML = opcionesSemanas(selectUnidad.value, 1);
  });

  document.getElementById('btnLimpiar').addEventListener('click', () => {
    postEditando = null;
    document.getElementById('contenido-admin').innerHTML = renderFormulario();
    vincularFormulario();
  });

  document.getElementById('formTrabajo').addEventListener('submit', guardarTrabajo);
}

async function guardarTrabajo(e) {
  e.preventDefault();
  const botonEnviar = e.target.querySelector('button[type="submit"]');
  const si = document.getElementById('campoUnidad').value;
  const semana = document.getElementById('campoSemana').value;
  const titulo = document.getElementById('campoTitulo').value.trim();
  const descripcion = document.getElementById('campoDescripcion').value.trim();
  const contenido = document.getElementById('campoContenido').value.trim();
  const archivo = document.getElementById('campoArchivo').files[0];

  if (!titulo) return mostrarNotificacion('Escribe un título.', true);

  const sesion = await obtenerSesion();
  const perfil = await obtenerPerfil();

  botonEnviar.disabled = true;
  botonEnviar.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando…';

  try {
    const datos = {
      unit: Number(si),
      week: Number(semana),
      title: titulo,
      description: descripcion,
      content: contenido,
      author_id: sesion.user.id,
      author_name: perfil.full_name || sesion.user.email,
      updated_at: new Date().toISOString()
    };
    if (postEditando) datos.id = postEditando.id;

    /* Archivo adjunto */
    if (archivo) {
      const nombreNuevo = nombreSeguro(archivo.name) + '-' + Date.now() + '.' + extDe(archivo.name);
      const ruta = `u${si}/s${semana}/${nombreNuevo}`;

      if (postEditando && postEditando.file_path) {
        await supabase.storage.from('trabajos').remove([postEditando.file_path]);
      }

      const { error: errUpload } = await supabase.storage
        .from('trabajos')
        .upload(ruta, archivo, { upsert: true });

      if (errUpload) throw new Error('No se pudo subir el archivo: ' + errUpload.message);

      const { data: pub } = supabase.storage.from('trabajos').getPublicUrl(ruta);
      datos.file_url = pub.publicUrl;
      datos.file_path = ruta;
      datos.file_name = archivo.name;
    } else if (postEditando) {
      if (postEditando.file_url) datos.file_url = postEditando.file_url;
      if (postEditando.file_path) datos.file_path = postEditando.file_path;
      if (postEditando.file_name) datos.file_name = postEditando.file_name;
    }

    const { error: errPost } = await supabase
      .from('posts')
      .upsert(datos, { onConflict: 'unit,week' });

    if (errPost) throw errPost;

    postEditando = null;
    document.getElementById('contenido-admin').innerHTML = renderFormulario();
    vincularFormulario();
    await cargarTabla();
    mostrarNotificacion('Trabajo guardado correctamente.');
  } catch (err) {
    mostrarNotificacion(err.message || 'Error al guardar.', true);
  } finally {
    botonEnviar.disabled = false;
    botonEnviar.innerHTML = '<i class="bi bi-save me-1"></i>Guardar';
  }
}

async function cargarPanel() {
  const zona = document.getElementById('contenido-admin');
  zona.innerHTML = spinnerHTML();

  try {
    const sesion = await obtenerSesion();
    if (!sesion) {
      zona.innerHTML = `
        <div class="text-center py-4">
          <i class="bi bi-person-lock" style="font-size:3rem;color:var(--verde);"></i>
          <h1 class="h4 mt-3" style="font-weight:700;">Debes iniciar sesión</h1>
          <p class="text-secondary">Solo el administrador puede publicar los trabajos semanales.</p>
          <button class="btn btn-unsm" data-bs-toggle="modal" data-bs-target="#modalAuth"><i class="bi bi-box-arrow-in-right me-1"></i>Iniciar sesión</button>
        </div>`;
      return;
    }

    const admin = await esAdmin();
    if (!admin) {
      zona.innerHTML = `
        <div class="text-center py-4">
          <i class="bi bi-shield-lock" style="font-size:3rem;color:#dc3545;"></i>
          <h1 class="h4 mt-3" style="font-weight:700;">Acceso denegado</h1>
          <p class="text-secondary">Tu cuenta no tiene permisos de administrador.<br>
          Si registraste tu cuenta después de otra persona, pídele al administrador que te asigne el rol en Supabase.</p>
          <a class="btn btn-outline-unsm" href="index.html"><i class="bi bi-house-door me-1"></i>Volver al inicio</a>
        </div>`;
      return;
    }

    zona.innerHTML = renderFormulario();
    vincularFormulario();
    await cargarTabla();
  } catch (err) {
    zona.innerHTML = renderErroresVinculacion(err);
  }
}

document.getElementById('anio').textContent = new Date().getFullYear();
iniciarComun(cargarPanel);
window.cargarEnFormulario = cargarEnFormulario;
window.borrarTrabajo = borrarTrabajo;