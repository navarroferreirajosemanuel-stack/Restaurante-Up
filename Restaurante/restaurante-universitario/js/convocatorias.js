/* =========================================================
   CONVOCATORIAS.JS — Módulo 1: Gestión de convocatorias
   ========================================================= */

const ESTADO_PAGINA = {
  paginaActual: 1,
  porPagina: 6,
  filtroNombre: '',
  editandoId: null
};

const form = document.getElementById('form-convocatoria');
const campoNombre = document.getElementById('conv-nombre');
const campoDescripcion = document.getElementById('conv-descripcion');
const campoFechaInicio = document.getElementById('conv-fecha-inicio');
const campoFechaCierre = document.getElementById('conv-fecha-cierre');
const campoCupo = document.getElementById('conv-cupo');
const campoId = document.getElementById('conv-id');
const tituloFormulario = document.getElementById('titulo-formulario');
const btnCancelarEdicion = document.getElementById('btn-cancelar-edicion');
const btnGuardar = document.getElementById('btn-guardar');

/* ---------------- Validación ---------------- */
function limpiarErrores() {
  ['nombre', 'descripcion', 'fecha-inicio', 'fecha-cierre', 'cupo'].forEach(campo => {
    document.getElementById(`error-${campo}`).textContent = '';
    document.getElementById(`conv-${campo}`).classList.remove('error');
  });
}

function marcarError(campoId, mensaje) {
  document.getElementById(`error-${campoId}`).textContent = mensaje;
  document.getElementById(`conv-${campoId}`).classList.add('error');
}

function validarFormulario() {
  limpiarErrores();
  let valido = true;

  const nombre = campoNombre.value.trim();
  const descripcion = campoDescripcion.value.trim();
  const fechaInicio = campoFechaInicio.value;
  const fechaCierre = campoFechaCierre.value;
  const cupo = campoCupo.value;

  if (!nombre) {
    marcarError('nombre', 'El nombre de la convocatoria es obligatorio.');
    valido = false;
  }

  if (!descripcion) {
    marcarError('descripcion', 'La descripción es obligatoria.');
    valido = false;
  }

  if (!fechaInicio) {
    marcarError('fecha-inicio', 'La fecha de inicio es obligatoria.');
    valido = false;
  }

  if (!fechaCierre) {
    marcarError('fecha-cierre', 'La fecha de cierre es obligatoria.');
    valido = false;
  }

  if (fechaInicio && fechaCierre && fechaCierre <= fechaInicio) {
    marcarError('fecha-cierre', 'La fecha de cierre debe ser posterior a la fecha de inicio.');
    valido = false;
  }

  if (!cupo) {
    marcarError('cupo', 'El cupo máximo es obligatorio.');
    valido = false;
  } else {
    const cupoNum = Number(cupo);
    if (!Number.isInteger(cupoNum) || cupoNum < 1 || cupoNum > 500) {
      marcarError('cupo', 'El cupo máximo debe ser un número entre 1 y 500.');
      valido = false;
    }
  }

  return valido;
}

/* ---------------- Guardar / Editar ---------------- */
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!validarFormulario()) return;

  const lista = obtenerConvocatorias();

  if (ESTADO_PAGINA.editandoId) {
    // Edición: conservamos cupos ocupados y reajustamos disponibles
    const conv = lista.find(c => c.id === ESTADO_PAGINA.editandoId);
    if (conv) {
      const nuevoCupoMaximo = Number(campoCupo.value);
      const ocupados = conv.cupoMaximo - conv.cuposDisponibles;

      conv.nombre = campoNombre.value.trim();
      conv.descripcion = campoDescripcion.value.trim();
      conv.fechaInicio = campoFechaInicio.value;
      conv.fechaCierre = campoFechaCierre.value;
      conv.cupoMaximo = nuevoCupoMaximo;
      conv.cuposDisponibles = Math.max(nuevoCupoMaximo - ocupados, 0);
      recalcularEstadoConvocatoria(conv);

      guardarConvocatorias(lista);
      mostrarToast('Convocatoria actualizada correctamente.', 'exito');
    }
  } else {
    // Creación
    const cupoMaximo = Number(campoCupo.value);
    const nueva = {
      id: generarId('CONV'),
      nombre: campoNombre.value.trim(),
      descripcion: campoDescripcion.value.trim(),
      fechaInicio: campoFechaInicio.value,
      fechaCierre: campoFechaCierre.value,
      cupoMaximo: cupoMaximo,
      cuposDisponibles: cupoMaximo,
      estado: 'Desactivada',
      estadoManual: 'Desactivada'
    };
    lista.push(nueva);
    guardarConvocatorias(lista);
    mostrarToast('Convocatoria creada con éxito. Recuerda publicarla para activarla.', 'exito');
  }

  finalizarEdicion();
  renderTabla();
});

function iniciarEdicion(id) {
  const lista = obtenerConvocatorias();
  const conv = lista.find(c => c.id === id);
  if (!conv) return;

  ESTADO_PAGINA.editandoId = id;
  campoId.value = id;
  campoNombre.value = conv.nombre;
  campoDescripcion.value = conv.descripcion;
  campoFechaInicio.value = conv.fechaInicio;
  campoFechaCierre.value = conv.fechaCierre;
  campoCupo.value = conv.cupoMaximo;

  tituloFormulario.textContent = `Editando convocatoria ${conv.id}`;
  btnGuardar.textContent = '';
  btnGuardar.innerHTML = `<svg viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Guardar cambios`;
  btnCancelarEdicion.classList.remove('oculto');
  limpiarErrores();

  document.querySelector('.panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function finalizarEdicion() {
  ESTADO_PAGINA.editandoId = null;
  form.reset();
  campoId.value = '';
  tituloFormulario.textContent = 'Nueva convocatoria';
  btnGuardar.innerHTML = `<svg viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Guardar convocatoria`;
  btnCancelarEdicion.classList.add('oculto');
  limpiarErrores();
}

btnCancelarEdicion.addEventListener('click', finalizarEdicion);

/* ---------------- Búsqueda ---------------- */
document.getElementById('buscar-nombre').addEventListener('input', (e) => {
  ESTADO_PAGINA.filtroNombre = e.target.value.trim().toLowerCase();
  ESTADO_PAGINA.paginaActual = 1;
  renderTabla();
});

/* ---------------- Render de tabla + paginación ---------------- */
function obtenerListaFiltrada() {
  const lista = obtenerConvocatorias();
  if (!ESTADO_PAGINA.filtroNombre) return lista;
  return lista.filter(c => c.nombre.toLowerCase().includes(ESTADO_PAGINA.filtroNombre));
}

function renderTabla() {
  const listaCompleta = obtenerListaFiltrada();
  const totalPaginas = Math.max(Math.ceil(listaCompleta.length / ESTADO_PAGINA.porPagina), 1);

  if (ESTADO_PAGINA.paginaActual > totalPaginas) ESTADO_PAGINA.paginaActual = totalPaginas;

  const inicio = (ESTADO_PAGINA.paginaActual - 1) * ESTADO_PAGINA.porPagina;
  const pagina = listaCompleta.slice(inicio, inicio + ESTADO_PAGINA.porPagina);

  const tbody = document.getElementById('tbody-convocatorias');

  if (!pagina.length) {
    tbody.innerHTML = `
      <tr><td colspan="8" class="tabla-vacia">
        <svg viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="2" stroke="#8893A6" stroke-width="1.4"/><path d="M8 8h8M8 12h8M8 16h5" stroke="#8893A6" stroke-width="1.4" stroke-linecap="round"/></svg>
        ${ESTADO_PAGINA.filtroNombre ? 'No se encontraron convocatorias con ese nombre.' : 'Aún no hay convocatorias. Crea la primera usando el formulario superior.'}
      </td></tr>`;
  } else {
    tbody.innerHTML = pagina.map(c => `
      <tr>
        <td class="celda-id">${c.id}</td>
        <td>${c.nombre}</td>
        <td>${formatearFecha(c.fechaInicio)}</td>
        <td>${formatearFecha(c.fechaCierre)}</td>
        <td>${c.cupoMaximo}</td>
        <td>${c.cuposDisponibles}</td>
        <td><span class="badge badge-${c.estado === 'Disponible' ? 'disponible' : 'desactivada'}">${c.estado}</span></td>
        <td>
          <button class="btn-icono" title="Editar convocatoria" onclick="iniciarEdicion('${c.id}')">
            <svg viewBox="0 0 24 24" fill="none"><path d="M4 20h4l11-11-4-4-11 11v4z" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </td>
      </tr>
    `).join('');
  }

  // Paginación
  document.getElementById('paginacion-info').textContent =
    listaCompleta.length ? `Mostrando ${inicio + 1}–${Math.min(inicio + ESTADO_PAGINA.porPagina, listaCompleta.length)} de ${listaCompleta.length} convocatorias` : 'Sin resultados';

  const botonesPag = document.getElementById('paginacion-botones');
  let htmlBotones = `<button class="paginacion__btn" ${ESTADO_PAGINA.paginaActual === 1 ? 'disabled' : ''} onclick="cambiarPagina(${ESTADO_PAGINA.paginaActual - 1})">‹</button>`;
  for (let i = 1; i <= totalPaginas; i++) {
    htmlBotones += `<button class="paginacion__btn ${i === ESTADO_PAGINA.paginaActual ? 'activo' : ''}" onclick="cambiarPagina(${i})">${i}</button>`;
  }
  htmlBotones += `<button class="paginacion__btn" ${ESTADO_PAGINA.paginaActual === totalPaginas ? 'disabled' : ''} onclick="cambiarPagina(${ESTADO_PAGINA.paginaActual + 1})">›</button>`;
  botonesPag.innerHTML = htmlBotones;
}

function cambiarPagina(n) {
  ESTADO_PAGINA.paginaActual = n;
  renderTabla();
}

document.addEventListener('DOMContentLoaded', renderTabla);
