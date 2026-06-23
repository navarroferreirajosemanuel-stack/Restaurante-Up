/* =========================================================
   REGISTRO.JS — Módulo 3: Registro de estudiantes a convocatorias
   ========================================================= */

const selectConvocatoria = document.getElementById('select-convocatoria');
const inputCodigo = document.getElementById('input-codigo');
const formRegistro = document.getElementById('form-registro');
const contenedorResultado = document.getElementById('contenedor-resultado');

/* ---------------- Poblar select de convocatorias disponibles ---------------- */
function poblarConvocatoriasDisponibles() {
  const lista = obtenerConvocatorias().filter(c => c.estado === 'Disponible');
  if (!lista.length) {
    selectConvocatoria.innerHTML = `<option value="">No hay convocatorias disponibles</option>`;
    return;
  }
  selectConvocatoria.innerHTML =
    `<option value="">Selecciona una convocatoria...</option>` +
    lista.map(c => `<option value="${c.id}">${c.nombre} — ${c.cuposDisponibles} cupos disponibles</option>`).join('');
}

/* ---------------- Iconos de verificación ---------------- */
function itemVerificacion(texto, ok) {
  const iconoOk = `<svg viewBox="0 0 24 24" fill="none"><polyline points="5 13 9 17 19 7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const iconoFallo = `<svg viewBox="0 0 24 24" fill="none"><line x1="6" y1="6" x2="18" y2="18" stroke-width="2" stroke-linecap="round"/><line x1="18" y1="6" x2="6" y2="18" stroke-width="2" stroke-linecap="round"/></svg>`;
  return `<div class="lista-verificacion__item ${ok ? 'ok' : 'fallo'}">${ok ? iconoOk : iconoFallo}<span>${texto}</span></div>`;
}

/* ---------------- Limpiar errores ---------------- */
function limpiarErroresRegistro() {
  document.getElementById('error-convocatoria').textContent = '';
  document.getElementById('error-codigo').textContent = '';
  selectConvocatoria.classList.remove('error');
  inputCodigo.classList.remove('error');
}

/* ---------------- Proceso principal de validación y registro ---------------- */
formRegistro.addEventListener('submit', (e) => {
  e.preventDefault();
  limpiarErroresRegistro();
  contenedorResultado.innerHTML = '';

  const convId = selectConvocatoria.value;
  const codigo = inputCodigo.value.trim();

  let formularioValido = true;
  if (!convId) {
    document.getElementById('error-convocatoria').textContent = 'Selecciona una convocatoria.';
    selectConvocatoria.classList.add('error');
    formularioValido = false;
  }
  if (!codigo) {
    document.getElementById('error-codigo').textContent = 'Ingresa el código estudiantil.';
    inputCodigo.classList.add('error');
    formularioValido = false;
  }
  if (!formularioValido) return;

  // --- Validaciones secuenciales del módulo ---
  const estudiante = ESTUDIANTES.find(e => e.codigo === codigo);
  const existe = !!estudiante;
  const activo = existe ? estudiante.activo : false;

  const convocatorias = obtenerConvocatorias();
  const convocatoria = convocatorias.find(c => c.id === convId);
  const convocatoriaDisponible = convocatoria ? convocatoria.estado === 'Disponible' : false;
  const fechaValida = convocatoria ? !fechaActualMayorQue(convocatoria.fechaCierre) : false;
  const hayCupos = convocatoria ? convocatoria.cuposDisponibles > 0 : false;

  const registros = obtener(CLAVES.REGISTROS, []);
  const yaRegistrado = existe && convocatoria
    ? registros.some(r => r.codigo === codigo && r.convocatoriaId === convId)
    : false;

  const verificaciones = [
    { texto: '¿El estudiante existe?', ok: existe },
    { texto: '¿El estudiante está activo?', ok: existe && activo },
    { texto: '¿Aún no está registrado en esta convocatoria?', ok: existe && !yaRegistrado },
    { texto: '¿La convocatoria está disponible?', ok: convocatoriaDisponible },
    { texto: '¿La fecha actual no supera el cierre?', ok: fechaValida },
    { texto: '¿Hay cupos disponibles?', ok: hayCupos }
  ];

  const todoCorrecto = verificaciones.every(v => v.ok);

  let htmlResultado = `
    <div class="resultado-consulta">
      <div class="resultado-consulta__cabecera">
        <div class="resultado-consulta__avatar">${existe ? estudiante.nombre.charAt(0) : '?'}</div>
        <div>
          <div class="resultado-consulta__nombre">${existe ? estudiante.nombre : 'Estudiante no encontrado'}</div>
          <div class="resultado-consulta__detalle">${existe ? `Código ${estudiante.codigo} · ${estudiante.programa}` : `Código consultado: ${codigo}`}</div>
        </div>
      </div>
      <div class="lista-verificacion">
        ${verificaciones.map(v => itemVerificacion(v.texto, v.ok)).join('')}
      </div>
    </div>
  `;

  if (todoCorrecto) {
    // Registrar
    const ahora = new Date();
    const nuevoRegistro = {
      codigo: estudiante.codigo,
      nombre: estudiante.nombre,
      programa: estudiante.programa,
      convocatoriaId: convocatoria.id,
      convocatoriaNombre: convocatoria.nombre,
      fecha: hoyISO(),
      hora: ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      estado: 'Registrado'
    };
    registros.push(nuevoRegistro);
    guardar(CLAVES.REGISTROS, registros);

    convocatoria.cuposDisponibles -= 1;
    if (convocatoria.cuposDisponibles <= 0) {
      convocatoria.cuposDisponibles = 0;
      recalcularEstadoConvocatoria(convocatoria);
      mostrarToast('Cupos agotados: la convocatoria se desactivó automáticamente.', 'info');
    }
    guardarConvocatorias(convocatorias);

    htmlResultado += `
      <div class="resultado-final exito">
        <svg class="resultado-final__icono" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#1E9E6B" stroke-width="1.7"/><path d="M8.5 12.5l2.3 2.3 4.7-5" stroke="#1E9E6B" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <div class="resultado-final__titulo">Registro exitoso</div>
        <div class="resultado-final__detalle">${estudiante.nombre} fue registrado en "${convocatoria.nombre}".</div>
      </div>
    `;
    mostrarToast('Estudiante registrado correctamente.', 'exito');
    formRegistro.reset();
    poblarConvocatoriasDisponibles();
  } else {
    htmlResultado += `
      <div class="resultado-final error">
        <svg class="resultado-final__icono" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#C24B1F" stroke-width="1.7"/><path d="M9 9l6 6M15 9l-6 6" stroke="#C24B1F" stroke-width="1.7" stroke-linecap="round"/></svg>
        <div class="resultado-final__titulo">No se pudo completar el registro</div>
        <div class="resultado-final__detalle">Revisa las condiciones marcadas arriba en rojo.</div>
      </div>
    `;
    mostrarToast('El registro no cumple todas las condiciones requeridas.', 'error');
  }

  contenedorResultado.innerHTML = htmlResultado;
  renderTablaRegistros();
});

/* ---------------- Tabla de registros existentes ---------------- */
function renderTablaRegistros() {
  const registros = obtener(CLAVES.REGISTROS, []);
  const tbody = document.getElementById('tbody-registros');

  if (!registros.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="tabla-vacia">Aún no se han registrado estudiantes.</td></tr>`;
    return;
  }

  tbody.innerHTML = [...registros].reverse().map(r => `
    <tr>
      <td class="celda-id">${r.codigo}</td>
      <td>${r.nombre}</td>
      <td>${r.programa}</td>
      <td>${r.convocatoriaNombre}</td>
      <td><span class="badge badge-disponible">${r.estado}</span></td>
    </tr>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  poblarConvocatoriasDisponibles();
  renderTablaRegistros();
});
