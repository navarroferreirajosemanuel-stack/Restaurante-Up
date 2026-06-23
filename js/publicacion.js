/* =========================================================
   PUBLICACION.JS — Módulo 2: Publicación de convocatorias
   ========================================================= */

const FILTROS = { nombre: '', estado: '', fechaInicio: '', fechaCierre: '' };

function iconoSvg(path) {
  return `<svg viewBox="0 0 24 24" fill="none">${path}</svg>`;
}

/* ---------------- Cards resumen ---------------- */
function renderResumen() {
  const lista = obtenerConvocatorias();
  const activas = lista.filter(c => c.estado === 'Disponible').length;
  const desactivadas = lista.filter(c => c.estado === 'Desactivada').length;

  const cards = [
    { valor: lista.length, etiqueta: 'Total de convocatorias', variante: 'variante-azul',
      icono: '<rect x="4" y="3" width="16" height="18" rx="2" stroke-width="1.6"/><path d="M8 8h8M8 12h8M8 16h5" stroke-width="1.6" stroke-linecap="round"/>' },
    { valor: activas, etiqueta: 'Convocatorias activas', variante: 'variante-exito',
      icono: '<circle cx="12" cy="12" r="9" stroke-width="1.6"/><path d="M8.5 12.5l2.3 2.3 4.7-5" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' },
    { valor: desactivadas, etiqueta: 'Convocatorias desactivadas', variante: 'variante-alerta',
      icono: '<circle cx="12" cy="12" r="9" stroke-width="1.6"/><path d="M9 9l6 6M15 9l-6 6" stroke-width="1.6" stroke-linecap="round"/>' }
  ];

  document.getElementById('grid-resumen').innerHTML = cards.map(c => `
    <div class="card-stat ${c.variante}">
      <div class="card-stat__top">
        <div class="card-stat__icono">${iconoSvg(c.icono)}</div>
      </div>
      <div class="card-stat__valor">${c.valor}</div>
      <div class="card-stat__etiqueta">${c.etiqueta}</div>
    </div>
  `).join('');
}

/* ---------------- Filtros ---------------- */
function aplicarFiltros(lista) {
  return lista.filter(c => {
    if (FILTROS.nombre && !c.nombre.toLowerCase().includes(FILTROS.nombre)) return false;
    if (FILTROS.estado && c.estado !== FILTROS.estado) return false;
    if (FILTROS.fechaInicio && c.fechaInicio < FILTROS.fechaInicio) return false;
    if (FILTROS.fechaCierre && c.fechaCierre > FILTROS.fechaCierre) return false;
    return true;
  });
}

document.getElementById('filtro-nombre').addEventListener('input', (e) => {
  FILTROS.nombre = e.target.value.trim().toLowerCase();
  renderTabla();
});
document.getElementById('filtro-estado').addEventListener('change', (e) => {
  FILTROS.estado = e.target.value;
  renderTabla();
});
document.getElementById('filtro-fecha-inicio').addEventListener('change', (e) => {
  FILTROS.fechaInicio = e.target.value;
  renderTabla();
});
document.getElementById('filtro-fecha-cierre').addEventListener('change', (e) => {
  FILTROS.fechaCierre = e.target.value;
  renderTabla();
});
document.getElementById('btn-limpiar-filtros').addEventListener('click', () => {
  FILTROS.nombre = ''; FILTROS.estado = ''; FILTROS.fechaInicio = ''; FILTROS.fechaCierre = '';
  document.getElementById('filtro-nombre').value = '';
  document.getElementById('filtro-estado').value = '';
  document.getElementById('filtro-fecha-inicio').value = '';
  document.getElementById('filtro-fecha-cierre').value = '';
  renderTabla();
});

/* ---------------- Acciones: publicar / desactivar ---------------- */
async function publicarConvocatoria(id) {
  const lista = obtenerConvocatorias();
  const conv = lista.find(c => c.id === id);
  if (!conv) return;

  if (fechaActualMayorQue(conv.fechaCierre)) {
    mostrarToast('No se puede publicar: la fecha de cierre ya pasó.', 'error');
    return;
  }
  if (conv.cuposDisponibles <= 0) {
    mostrarToast('No se puede publicar: no quedan cupos disponibles.', 'error');
    return;
  }

  const confirmado = await pedirConfirmacion({
    titulo: 'Publicar convocatoria',
    mensaje: `¿Deseas publicar "${conv.nombre}"? Los estudiantes podrán registrarse de inmediato.`,
    tono: 'info',
    textoConfirmar: 'Sí, publicar'
  });
  if (!confirmado) return;

  conv.estadoManual = 'Disponible';
  recalcularEstadoConvocatoria(conv);
  guardarConvocatorias(lista);
  mostrarToast(`"${conv.nombre}" ha sido publicada.`, 'exito');
  renderResumen();
  renderTabla();
}

async function desactivarConvocatoria(id) {
  const lista = obtenerConvocatorias();
  const conv = lista.find(c => c.id === id);
  if (!conv) return;

  const confirmado = await pedirConfirmacion({
    titulo: 'Desactivar convocatoria',
    mensaje: `¿Deseas desactivar "${conv.nombre}"? Los estudiantes no podrán registrarse mientras esté desactivada.`,
    tono: 'alerta',
    textoConfirmar: 'Sí, desactivar'
  });
  if (!confirmado) return;

  conv.estadoManual = 'Desactivada';
  recalcularEstadoConvocatoria(conv);
  guardarConvocatorias(lista);
  mostrarToast(`"${conv.nombre}" ha sido desactivada.`, 'info');
  renderResumen();
  renderTabla();
}

/* ---------------- Render de tabla ---------------- */
function renderTabla() {
  const lista = aplicarFiltros(obtenerConvocatorias());
  const tbody = document.getElementById('tbody-publicacion');

  if (!lista.length) {
    tbody.innerHTML = `
      <tr><td colspan="7" class="tabla-vacia">
        <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#8893A6" stroke-width="1.4"/><path d="M20 20l-3.5-3.5" stroke="#8893A6" stroke-width="1.4" stroke-linecap="round"/></svg>
        No hay convocatorias que coincidan con los filtros aplicados.
      </td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(c => `
    <tr>
      <td class="celda-id">${c.id}</td>
      <td>${c.nombre}</td>
      <td>${formatearFecha(c.fechaInicio)}</td>
      <td>${formatearFecha(c.fechaCierre)}</td>
      <td>${c.cuposDisponibles}/${c.cupoMaximo}</td>
      <td><span class="badge badge-${c.estado === 'Disponible' ? 'disponible' : 'desactivada'}">${c.estado}</span></td>
      <td>
        ${c.estado === 'Disponible'
          ? `<button class="btn btn-peligro" onclick="desactivarConvocatoria('${c.id}')">Desactivar</button>`
          : `<button class="btn btn-exito" onclick="publicarConvocatoria('${c.id}')" ${fechaActualMayorQue(c.fechaCierre) || c.cuposDisponibles <= 0 ? 'disabled title="No cumple condiciones para publicarse"' : ''}>Publicar</button>`
        }
      </td>
    </tr>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderResumen();
  renderTabla();
});
