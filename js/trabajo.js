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
  const nombre = c.profiles && c.profiles.full_name ? c.profiles.full_name : 'Estudiante';
  return `
    <div class="comentario" id="comentario-${c.id}">
      <div class="d-flex align-items-start">
        ${avatarDe(nombre, 42)}
        <div class="flex-grow-1">
          <div class="d-flex justify-content-between align-items-center flex-wrap">
            <span class="autor">${escapeHtml(nombre)}</span>
            <span class="fecha"><i class="bi bi-clock me-1"></i>${formatDateTime(c.created_at)}</span>
          </div>
          <div class="texto">${escapeHtml(c.content)}</div>
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
            <button class="btn-borrar" onclick="borrarComentario(${c.id})">
              <i class="bi bi-trash me-1"></i>Borrar mi comentario
            </button>`;
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

function formComentario() {
  const sesionPromise = obtenerSesion();
  sesionPromise.then((sesion) => {
    const zona = document.getElementById('form-comentario');
    if (!sesion) {
      zona.innerHTML = `
        <div class="alert alert-info-unsm d-flex justify-content-between align-items-center flex-wrap gap-2 mb-0">
          <span class="small"><i class="bi bi-info-circle me-1"></i>Inicia sesión para dejar tu comentario.</span>
          <button class="btn btn-unsm btn-sm" data-bs-toggle="modal" data-bs-target="#modalAuth">Iniciar sesión</button>
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
    const respaldo = post.file_url
      ? `
      <div class="respaldo">
        <i class="bi bi-file-earmark-pdf-fill text-danger" style="font-size:1.8rem;"></i>
        <div class="flex-grow-1">
          <strong>${escapeHtml(post.file_name || 'Documento adjunto')}</strong>
          <div class="small text-secondary">Descarga el trabajo de la semana ${post.week}.</div>
        </div>
        <a class="btn btn-outline-unsm btn-sm" href="${escapeHtml(post.file_url)}" target="_blank" rel="noopener">
          <i class="bi bi-download me-1"></i>Descargar
        </a>
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
            <span class="estado estado-publicado"><i class="bi bi-check-circle-fill"></i> ${escapeHtml(unidadActual.nombre)} · Semana ${semana}</span>
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

    cont.innerHTML = '<ul>' + Array.from({ length: unidad.semanas }, (_, i) => {
      const s = i + 1;
      const post = porSemana[s];
      const activo = obtenerParams().semana === s ? ' active' : '';
      return `<li><a class="${activo}" href="${hlkSemana(unidad.numero, s)}">
        <i class="bi bi-calendar-week me-2"></i>Semana ${s}
        ${post ? '<span style="color:var(--verde);"><i class="bi bi-check-circle-fill ms-1"></i></span>' : ''}
      </a></li>`;
    }).join('') + '</ul>';
  } catch {
    cont.innerHTML = `<p class="small text-secondary">No disponible por ahora.</p>`;
  }
}

document.getElementById('anio').textContent = new Date().getFullYear();
iniciarComun(cargarEntrada);