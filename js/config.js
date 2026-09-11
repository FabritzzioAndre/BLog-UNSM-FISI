/* ============================================================
   Configuración de Supabase y unidades del curso.
   La "publishable key" está diseñada para ir en el cliente.
   NUNCA coloques aquí la clave secreta (sb_secret_...).
   ============================================================ */

const SUPABASE_CONFIG = {
  url: 'https://acklcqhybovzsdbfbdki.supabase.co',
  publishableKey: 'sb_publishable_uyBB9D7WJdeNnroOzlq8BQ_S_UZpck3'
};

/* Estructura del curso: 3 unidades con su cantidad de semanas */
const UNIDADES = [
  { numero: 1, nombre: 'Unidad 1', semanas: 4, descripcion: 'Fundamentos de la asignatura' },
  { numero: 2, nombre: 'Unidad 2', semanas: 4, descripcion: 'Desarrollo práctico de contenidos' },
  { numero: 3, nombre: 'Unidad 3', semanas: 6, descripcion: 'Aplicación y trabajo final' }
];

function unidadPorNumero(numero) {
  return UNIDADES.find((u) => u.numero === Number(numero)) || UNIDADES[0];
}

function crearClienteSupabase() {
  return supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey);
}