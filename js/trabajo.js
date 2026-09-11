/* ============================================================
   Página de una semana: contenido del trabajo + comentarios.
   ============================================================ */

let postActual = null;
let unidadActual = null;

function obtenerParams() {
  const q = new URLSearchParams(window.location.search);
  return {
    unidad: Number(q.get('unidad')) || 1,
    semana: Number(q.get('semana')) || 1
  };
}

function hlkSemana(unidad, semana) {
  return `trabajo.html?unidad=${unidad}&semana=${semana}`;
}

function renderComentario(c) {
  const nombre = c.author_name || (c.profiles && c.profiles.full_name) || 'Estudiante';
  return `
    <div class="comentario" id="comentario-${c.id}">
      <div class="d-flex align-items-start">
        ${avatarDe(nombre, 42)}
        <div class="flex-grow-1">
          <div class="d-flex justify-content-between align-items-center flex-wrap">
            <span class="autor">${escapeHtml(nombre)}</span>
            <span class="fecha"><i class="bi bi-clock me-1"></i>${formatDateTime(c.created_at)}</span>
          </div>
          <div class="texto" id="texto-comentario-${c.id}">${escapeHtml(c.content)}</div>
        </div>
      </div>
      <div id="comentario-acciones-${c.id}"></div>
    </div>`;
}

async function cargarComentarios() {
  if (!postActual) return;
  const { data: comentarios, error } = await supabase
    .from('comments')
    .select('*, profiles(full_name)')
    .eq('post_id', postActual.id)
    .order('created_at', { ascending: true });

  if (error) {
    document.getElementById('lista-comentarios').innerHTML =
      `<div class="alert alert-danger py-2">Error al cargar los comentarios.</div>`;
    return;
  }

  const cont = document.getElementById('lista-comentarios');
  cont.innerHTML = comentarios.length
    ? comentarios.map(renderComentario).join('')
    : `<p class="text-secondary small"><i class="bi bi-chat-left-text me-1"></i>Aún no hay comentarios. ¡Sé el primero!</p>`;

  const sesion = await obtenerSesion();
  if (sesion) {
    comentarios.forEach((c) => {
      if (c.user_id === sesion.user.id) {
        const zona = document.getElementById(`comentario-acciones-${c.id}`);
        if (zona) {
          zona.innerHTML = `
            <div class="d-flex gap-2">
              <button class="btn-editar" onclick="editarComentario(${c.id})">
                <i class="bi bi-pencil me-1"></i>Editar
              </button>
              <button class="btn-borrar" onclick="borrarComentario(${c.id})">
                <i class="bi bi-trash me-1"></i>Borrar
              </button>
            </div>`;
        }
      }
    });
  }
}

async function borrarComentario(id) {
  if (!confirm('¿Seguro que deseas borrar tu comentario?')) return;
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) {
    mostrarNotificacion('No se pudo borrar el comentario.', true);
  } else {
    document.getElementById(`comentario-${id}`)?.remove();
    mostrarNotificacion('Comentario eliminado.');
  }
}

function editarComentario(id) {
  const texto = document.getElementById(`texto-comentario-${id}`);
  if (!texto) return;
  const actual = texto.textContent;
  texto.innerHTML = `
    <textarea id="editarea-${id}" class="form-control" rows="3" maxlength="1000">${escapeHtml(actual)}</textarea>
    <div class="d-flex gap-2 mt-2">
      <button class="btn btn-unsm btn-sm px-3" onclick="guardarComentario(${id})">
        <i class="bi bi-check-lg me-1"></i>Guardar
      </button>
      <button class="btn btn-secondary btn-sm px-3" onclick="cancelarEdicion(${id})">Cancelar</button>
    </div>`;
}

function cancelarEdicion(id) {
  cargarComentarios();
}

async function guardarComentario(id) {
  const area = document.getElementById(`editarea-${id}`);
  if (!area) return;
  const contenido = area.value.trim();
  if (!contenido) {
    mostrarNotificacion('El comentario no puede quedar vacío.', true);
    return;
  }
  const { error } = await supabase.from('comments').update({ content: contenido }).eq('id', id);
  if (error) {
    mostrarNotificacion('No se pudo editar el comentario.', true);
  } else {
    mostrarNotificacion('Comentario actualizado.');
    await cargarComentarios();
  }
}

function formComentario() {
  const sesionPromise = obtenerSesion();
  sesionPromise.then((sesion) => {
    const zona = document.getElementById('form-comentario');
    if (!sesion) {
      zona.innerHTML = `
        <div class="alert alert-info-unsm d-flex justify-content-between align-items-center flex-wrap gap-2 mb-0">
          <span class="small"><i class="bi bi-info-circle me-1"></i>Inicia sesión para dejar tu comentario.</span>
          <button class="btn btn-unsm btn-sm" onclick="abrirModalSesion()">Iniciar sesión</button>
        </div>`;
      return;
    }
    zona.innerHTML = `
      <div class="d-flex align-items-start gap-2">
        <div class="flex-grow-1">
          <textarea id="nuevoComentario" class="form-control" rows="3"
            maxlength="1000" placeholder="Escribe un comentario respetuoso…"></textarea>
          <div class="d-flex justify-content-between align-items-center mt-2">
            <small class="text-secondary" id="contadorComentario">0 / 1000</small>
            <button class="btn btn-unsm btn-sm px-3" id="btnEnviarComentario">
              <i class="bi bi-send me-1"></i>Publicar comentario
            </button>
          </div>
        </div>
      </div>`;

    const area = document.getElementById('nuevoComentario');
    area.addEventListener('input', () => {
      document.getElementById('contadorComentario').textContent = `${area.value.length} / 1000`;
    });
    document.getElementById('btnEnviarComentario').addEventListener('click', async () => {
      const contenido = area.value.trim();
      if (!contenido) {
        mostrarNotificacion('Escribe un comentario primero.', true);
        return;
      }
      document.getElementById('btnEnviarComentario').disabled = true;
      const { error } = await supabase.from('comments').insert({
        post_id: postActual.id,
        user_id: sesion.user.id,
        author_name: (sesion.user.user_metadata && sesion.user.user_metadata.full_name) || sesion.user.email,
        content: contenido
      });
      document.getElementById('btnEnviarComentario').disabled = false;
      if (error) {
        mostrarNotificacion('No se pudo publicar el comentario: ' + error.message, true);
      } else {
        area.value = '';
        document.getElementById('contadorComentario').textContent = '0 / 1000';
        mostrarNotificacion('Comentario publicado.');
        cargarComentarios();
      }
    });
  });
}

async function cargarEntrada() {
  const { unidad, semana } = obtenerParams();
  unidadActual = unidadPorNumero(unidad);
  const cont = document.getElementById('content');
  cont.innerHTML = spinnerHTML();

  try {
    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('unit', unidad)
      .eq('week', semana)
      .maybeSingle();

    if (error) throw error;

    if (!post) {
      cont.innerHTML = `
        <nav class="breadcrumb-unsm mb-3"><a href="index.html">Inicio</a> / ${escapeHtml(unidadActual.nombre)} / Semana ${semana}</nav>
        <div class="post-full">
          <h1><i class="bi bi-hourglass-split me-2"></i>Trabajo de la semana ${semana} aún no publicado</h1>
          <p class="text-secondary mt-3">El docente aún no sube el material de esta semana. Vuelve pronto o revisa <a href="index.html">el inicio</a> para ver los trabajos disponibles.</p>
        </div>`;
      document.title = `Semana ${semana} · Blogdetareas`;
      cargarListaSemanas();
      return;
    }

    postActual = post;
    const adjuntos = (post.archivos && post.archivos.length)
      ? post.archivos
      : (post.file_url
        ? [{ name: post.file_name || 'Documento adjunto', url: post.file_url }]
        : []);
    const respaldo = adjuntos.length ? `
      <div class="respaldo">
        <i class="bi bi-folder2-open text-success" style="font-size:1.8rem;"></i>
        <div class="flex-grow-1">
          <strong>${adjuntos.length === 1 ? 'Archivo adjunto' : adjuntos.length + ' archivos adjuntos'}</strong>
          <div class="small text-secondary"><i class="bi bi-eye me-1"></i>Ver abre el archivo en otra pestaña para leerlo o descargarlo.</div>
        </div>
        <div class="d-flex flex-column gap-1">
          ${adjuntos.map((a) => `
            <div class="d-flex align-items-center gap-1 justify-content-end">
              <span class="small text-secondary text-truncate adjunto-nombre" title="${escapeHtml(a.name || '')}">${escapeHtml(a.name || 'Ver archivo')}</span>
              <a class="btn btn-outline-unsm btn-sm text-nowrap" href="${escapeHtml(a.url)}" target="_blank" rel="noopener" title="Abrir en otra pestaña">
                <i class="bi bi-eye me-1"></i>Ver
              </a>
              <a class="btn btn-unsm btn-sm text-nowrap" href="${escapeHtml(a.url)}" download title="Descargar">
                <i class="bi bi-download me-1"></i>Descargar
              </a>
            </div>`).join('')}
        </div>
      </div>`
      : '';

    cont.innerHTML = `
      <nav class="breadcrumb-unsm mb-3"><a href="index.html">Inicio</a> / <a href="index.html#unidad-${unidad}">${escapeHtml(unidadActual.nombre)}</a> / Semana ${semana}</nav>
      <article class="post-full">
        <div class="post-head">
          <h1>${escapeHtml(post.title)}</h1>
          <div class="post-meta mt-2">
            <span><i class="bi bi-calendar3 me-1"></i>${formatDate(post.updated_at)}</span>
            <span><i class="bi bi-person me-1"></i>${escapeHtml(post.author_name || 'Docente')}</span>
            ${post.asignatura ? `<span><i class="bi bi-book me-1"></i>${escapeHtml(post.asignatura)}${post.periodo ? ' · ' + escapeHtml(post.periodo) : ''}</span>` : ''}
            <span class="estado ${esSemanaExamen(unidadActual, semana) ? 'estado-examen' : 'estado-publicado'}"><i class="bi ${esSemanaExamen(unidadActual, semana) ? 'bi-pencil-square' : 'bi-check-circle-fill'}"></i> ${escapeHtml(unidadActual.nombre)} · Semana ${semana}${esSemanaExamen(unidadActual, semana) ? ' · Examen' : ''}</span>
          </div>
        </div>
        ${respaldo}
        <div class="post-body">${renderText(post.content)}</div>
      </article>

      <section class="mt-4 pt-3" id="seccion-comentarios">
        <div class="section-title">
          <span class="badge-icon"><i class="bi bi-chat-left-text"></i></span>
          <div>
            <h2>Comentarios</h2>
            <p class="sub">Comparte tus dudas o aportes sobre esta semana</p>
          </div>
        </div>
        <div id="lista-comentarios" class="mt-3"></div>
        <div class="mt-3" id="form-comentario"></div>
      </section>`;

    document.title = `${post.title} · Blogdetareas`;
    await cargarComentarios();
    formComentario();
    cargarListaSemanas();
  } catch (err) {
    cont.innerHTML = `
      <div class="alert alert-danger" role="alert">
        <h5 class="alert-heading"><i class="bi bi-exclamation-triangle me-2"></i>Error</h5>
        <p class="mb-0">${escapeHtml(err.message)}</p>
      </div>`;
  }
}

async function cargarListaSemanas() {
  const cont = document.getElementById('lista-semanas');
  const unidad = unidadActual || unidadPorNumero(1);
  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select('week, title, unit')
      .eq('unit', unidad.numero)
      .order('week');

    if (error) throw error;

    const porSemana = {};
    (posts || []).forEach((p) => { porSemana[p.week] = p; });

    cont.innerHTML = '<ul>' + unidad.semanas.map((s) => {
      const post = porSemana[s];
      const activo = obtenerParams().semana === s ? ' active' : '';
      const examen = esSemanaExamen(unidad, s) ? ' <span class="small" style="color:var(--dorado);"><i class="bi bi-pencil-square ms-1"></i></span>' : '';
      const publicado = post ? '<span style="color:var(--verde);"><i class="bi bi-check-circle-fill ms-1"></i></span>' : '';
      return `<li><a class="${activo}" href="${hlkSemana(unidad.numero, s)}">
        <i class="bi bi-calendar-week me-2"></i>Semana ${s}${examen}${publicado}
      </a></li>`;
    }).join('') + '</ul>';
  } catch {
    cont.innerHTML = `<p class="small text-secondary">No disponible por ahora.</p>`;
  }
}

document.getElementById('anio').textContent = new Date().getFullYear();
iniciarComun(cargarEntrada);
window.editarComentario = editarComentario;
window.cancelarEdicion = cancelarEdicion;
window.guardarComentario = guardarComentario;