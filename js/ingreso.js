/* =========================================================
   INGRESO.JS — Módulo 4: Ingreso al restaurante universitario
   ========================================================= */

const formIngreso = document.getElementById('form-ingreso');
const inputCodigoIngreso = document.getElementById('input-codigo-ingreso');
const contenedorResultadoIngreso = document.getElementById('contenedor-resultado-ingreso');

function itemVerificacionIngreso(texto, ok) {
  const iconoOk = `<svg viewBox="0 0 24 24" fill="none"><polyline points="5 13 9 17 19 7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const iconoFallo = `<svg viewBox="0 0 24 24" fill="none"><line x1="6" y1="6" x2="18" y2="18" stroke-width="2" stroke-linecap="round"/><line x1="18" y1="6" x2="6" y2="18" stroke-width="2" stroke-linecap="round"/></svg>`;
  return `<div class="lista-verificacion__item ${ok ? 'ok' : 'fallo'}">${ok ? iconoOk : iconoFallo}<span>${texto}</span></div>`;
}

formIngreso.addEventListener('submit', (e) => {
  e.preventDefault();
  document.getElementById('error-codigo-ingreso').textContent = '';
  inputCodigoIngreso.classList.remove('error');
  contenedorResultadoIngreso.innerHTML = '';

  const codigo = inputCodigoIngreso.value.trim();
  if (!codigo) {
    document.getElementById('error-codigo-ingreso').textContent = 'Ingresa un código estudiantil.';
    inputCodigoIngreso.classList.add('error');
    return;
  }

  const estudiante = ESTUDIANTES.find(e => e.codigo === codigo);
  const existe = !!estudiante;

  const registros = obtener(CLAVES.REGISTROS, []);
  const registro = existe ? registros.find(r => r.codigo === codigo) : null;
  const tieneRegistro = !!registro;

  const convocatorias = obtenerConvocatorias();
  const convocatoria = registro ? convocatorias.find(c => c.id === registro.convocatoriaId) : null;
  const convocatoriaDisponible = convocatoria ? convocatoria.estado === 'Disponible' : false;

  const verificaciones = [
    { texto: '¿El estudiante existe?', ok: existe },
    { texto: '¿Está registrado en una convocatoria?', ok: tieneRegistro },
    { texto: '¿La convocatoria sigue disponible?', ok: convocatoriaDisponible }
  ];

  const accesoAutorizado = verificaciones.every(v => v.ok);
  const ahora = new Date();
  const fecha = hoyISO();
  const hora = ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const ingresos = obtener(CLAVES.INGRESOS, []);
  ingresos.push({
    codigo: codigo,
    nombre: existe ? estudiante.nombre : 'Desconocido',
    fecha: fecha,
    hora: hora,
    estado: accesoAutorizado ? 'Autorizado' : 'Denegado'
  });
  guardar(CLAVES.INGRESOS, ingresos);

  let html = `
    <div class="resultado-consulta">
      <div class="resultado-consulta__cabecera">
        <div class="resultado-consulta__avatar">${existe ? estudiante.nombre.charAt(0) : '?'}</div>
        <div>
          <div class="resultado-consulta__nombre">${existe ? estudiante.nombre : 'Estudiante no encontrado'}</div>
          <div class="resultado-consulta__detalle">${existe ? `Código ${estudiante.codigo} · ${estudiante.programa}` : `Código consultado: ${codigo}`}</div>
        </div>
      </div>
      <div class="lista-verificacion">
        ${verificaciones.map(v => itemVerificacion2(v.texto, v.ok)).join('')}
      </div>
    </div>
  `;

  if (accesoAutorizado) {
    html += `
      <div class="resultado-final exito">
        <svg class="resultado-final__icono" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#1E9E6B" stroke-width="1.7"/><path d="M8.5 12.5l2.3 2.3 4.7-5" stroke="#1E9E6B" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <div class="resultado-final__titulo">Acceso autorizado</div>
        <div class="resultado-final__detalle">${estudiante.nombre} puede ingresar al restaurante.</div>
      </div>
    `;
    mostrarToast('Acceso autorizado.', 'exito');
  } else {
    html += `
      <div class="resultado-final error">
        <svg class="resultado-final__icono" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#C24B1F" stroke-width="1.7"/><path d="M9 9l6 6M15 9l-6 6" stroke="#C24B1F" stroke-width="1.7" stroke-linecap="round"/></svg>
        <div class="resultado-final__titulo">Acceso denegado</div>
        <div class="resultado-final__detalle">El estudiante no cumple las condiciones de ingreso.</div>
      </div>
    `;
    mostrarToast('Acceso denegado.', 'error');
  }

  contenedorResultadoIngreso.innerHTML = html;
  formIngreso.reset();
  inputCodigoIngreso.focus();
  renderTablaIngresos();
});

function itemVerificacion2(texto, ok) {
  return itemVerificacionIngreso(texto, ok);
}

function renderTablaIngresos() {
  const ingresos = obtener(CLAVES.INGRESOS, []);
  const tbody = document.getElementById('tbody-ingresos');

  if (!ingresos.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="tabla-vacia">Aún no se han registrado ingresos.</td></tr>`;
    return;
  }

  tbody.innerHTML = [...ingresos].reverse().map(i => `
    <tr>
      <td class="celda-id">${i.codigo}</td>
      <td>${i.nombre}</td>
      <td>${formatearFecha(i.fecha)}</td>
      <td>${i.hora}</td>
      <td><span class="badge badge-${i.estado === 'Autorizado' ? 'autorizado' : 'denegado'}">${i.estado}</span></td>
    </tr>
  `).join('');
}

document.addEventListener('DOMContentLoaded', renderTablaIngresos);
