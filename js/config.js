/* ============================================================
   Configuración de Supabase y unidades del curso.
   La "publishable key" está diseñada para ir en el cliente.
   NUNCA coloques aquí la clave secreta (sb_secret_...).
   ============================================================ */

const SUPABASE_CONFIG = {
  url: 'https://acklcqhybovzsdbfbdki.supabase.co',
  publishableKey: 'sb_publishable_uyBB9D7WJdeNnroOzlq8BQ_S_UZpck3'
};

/* Estructura del curso: 3 unidades con sus semanas del semestre.
   Las semanas son números absolutos del semestre (2026-II).
   examenSemana indica qué semana es el examen de la unidad. */
const UNIDADES = [
  { numero: 1, nombre: 'Unidad 1', semanas: [1, 2, 3, 4, 5], examenSemana: 5, descripcion: 'Fundamentos de la asignatura' },
  { numero: 2, nombre: 'Unidad 2', semanas: [6, 7, 8, 9, 10], examenSemana: 10, descripcion: 'Desarrollo práctico de contenidos' },
  { numero: 3, nombre: 'Unidad 3', semanas: [11, 12, 13, 14, 15, 16], examenSemana: 16, descripcion: 'Aplicación y trabajo final' }
];

/* Retorna la lista de semanas de una unidad.
   Para los casos con semanas consecutivas etiqueta "Semanas 1-5", para una sola "Semana 16". */
function etiquetaSemanas(unidad) {
  return unidad.semanas.length === 1
    ? `Semana ${unidad.semanas[0]}`
    : `Semanas ${unidad.semanas[0]}-${unidad.semanas[unidad.semanas.length - 1]}`;
}

function esSemanaExamen(unidad, semana) {
  return Number(unidad.examenSemana) === Number(semana);
}

function unidadPorNumero(numero) {
  return UNIDADES.find((u) => u.numero === Number(numero)) || UNIDADES[0];
}

function crearClienteSupabase() {
  return supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey);
}