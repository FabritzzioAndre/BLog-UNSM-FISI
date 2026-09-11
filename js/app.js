/* ============================================================
   Inicio: lista las 3 unidades con sus semanas.
   ============================================================ */

const romano = {
  1: 'I',
  2: 'II',
  3: 'III'
};

function cardPublicada(post) {
  const unidad = unidadPorNumero(post.unit);
  const tieneArchivo = post.file_url ? `<i class="bi bi-paperclip ms-1" title="Tiene archivo adjunto"></i>` : '';
  return `
    <div class="week-card">
      <div class="semana-tag">Semana ${post.week}</div>
      <h3><a href="trabajo.html?unidad=${post.unit}&semana=${post.week}">${escapeHtml(post.title)}</a> ${tieneArchivo}</h3>
      <p>${escapeHtml(post.description)}</p>
      <div class="meta">
        <span class="estado estado-publicado"><i class="bi bi-check-circle-fill"></i> Publicado</span>
        <span class="small text-secondary"><i class="bi bi-calendar3 me-1"></i>${formatDate(post.updated_at)} · ${escapeHtml(post.author_name || 'Docente')}</span>
      </div>
    </div>`;
}

function cardPendiente(unidad, semana) {
  return `
    <div class="week-card placeholder">
      <div class="semana-tag" style="color:var(--gris);">Semana ${semana}</div>
      <h3 class="placeholder-title">Trabajo de la semana ${semana}</h3>
      <p>El trabajo aún no ha sido publicado.</p>
      <div class="meta">
        <span class="estado estado-pendiente"><i class="bi bi-hourglass-split"></i> Pendiente</span>
      </div>
    </div>`;
}

function seccionUnidad(unidad, postsPorSemana) {
  const tarjetas = [];
  for (let semana = 1; semana <= unidad.semanas; semana++) {
    const post = postsPorSemana[semana];
    tarjetas.push(post ? cardPublicada(post) : cardPendiente(unidad, semana));
  }
  return `
    <div id="unidad-${unidad.numero}" class="mb-4">
      <div class="section-title">
        <span class="badge-icon">${romano[unidad.numero]}</span>
        <div>
          <h2>${escapeHtml(unidad.nombre)} <small class="text-muted fs-6">· ${unidad.semanas} semanas</small></h2>
          <p class="sub">${escapeHtml(unidad.descripcion)}</p>
        </div>
      </div>
      <div class="week-grid mt-3">${tarjetas.join('')}</div>
    </div>`;
}

async function cargarInicio() {
  const contenedor = document.getElementById('content');
  contenedor.innerHTML = spinnerHTML();

  try {
    const [{ data: posts, error: errPosts }, { count: nComentarios, error: errComent }] = await Promise.all([
      supabase.from('posts').select('*').order('unit').order('week'),
      supabase.from('comments').select('id', { count: 'exact', head: true })
    ]);

    if (errPosts) throw errPosts;
    if (errComent && errComent.code !== '42P01' && errComent.code !== 'PGRST205') throw errComent;

    const postsPorUnidad = {};
    (posts || []).forEach((p) => {
      if (!postsPorUnidad[p.unit]) postsPorUnidad[p.unit] = {};
      postsPorUnidad[p.unit][p.week] = p;
    });

    contenedor.innerHTML = UNIDADES
      .map((u) => seccionUnidad(u, postsPorUnidad[u.numero] || {}))
      .join('');

    document.getElementById('stat-trabajos').textContent = posts ? posts.length : 0;
    document.getElementById('stat-comentarios').textContent = nComentarios || 0;
    document.title = 'Blogdetareas · UNSM FISI';
  } catch (err) {
    const faltaTabla = /does not exist|PGRST205|42P01/.test(String(err.message));
    contenedor.innerHTML = `
      <div class="alert ${faltaTabla ? 'alert-warning' : 'alert-danger'}" role="alert">
        <h5 class="alert-heading"><i class="bi bi-database-x me-2"></i>${faltaTabla ? 'Base de datos en configuración' : 'Error al cargar'}</h5>
        <p class="mb-1">${escapeHtml(err.message)}</p>
        ${faltaTabla ? '<p class="small mb-0">Ejecuta el archivo <code>sql/schema.sql</code> en el SQL Editor de Supabase y vuelve a cargar la página.</p>' : ''}
      </div>`;
    document.getElementById('stat-trabajos').textContent = 0;
    document.getElementById('stat-comentarios').textContent = 0;
  }
}

document.getElementById('anio').textContent = new Date().getFullYear();
iniciarComun(cargarInicio);