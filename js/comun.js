/* =========================================================
   COMUN.JS — Utilidades compartidas por todo el sistema
   Restaurante Universitario · localStorage como persistencia
   ========================================================= */

const CLAVES = {
  CONVOCATORIAS: 'ru_convocatorias',
  REGISTROS: 'ru_registros',
  INGRESOS: 'ru_ingresos',
  SESION: 'ru_sesion',
  USUARIOS: 'ru_usuarios'
};

/* ---------------- Estudiantes (base institucional simulada) ---------------- */
const ESTUDIANTES = [
  { codigo: "1001", nombre: "Juan Perez",   programa: "Ingeniería de Sistemas", activo: true },
  { codigo: "1002", nombre: "Maria Gomez",  programa: "Administración",         activo: true },
  { codigo: "1003", nombre: "Carlos Diaz",  programa: "Contaduría",             activo: false },
  { codigo: "1004", nombre: "Laura Rincón", programa: "Ingeniería Industrial",  activo: true },
  { codigo: "1005", nombre: "Andrés Salas", programa: "Derecho",                activo: true }
];

/* ---------------- Persistencia genérica ---------------- */
function obtener(clave, porDefecto = []) {
  try {
    const datos = localStorage.getItem(clave);
    return datos ? JSON.parse(datos) : porDefecto;
  } catch (e) {
    console.error('Error leyendo localStorage:', clave, e);
    return porDefecto;
  }
}

function guardar(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
    return true;
  } catch (e) {
    console.error('Error guardando en localStorage:', clave, e);
    return false;
  }
}

/* ---------------- Inicialización de datos base ---------------- */
function inicializarDatos() {
  if (!localStorage.getItem(CLAVES.CONVOCATORIAS)) {
    guardar(CLAVES.CONVOCATORIAS, []);
  }
  if (!localStorage.getItem(CLAVES.REGISTROS)) {
    guardar(CLAVES.REGISTROS, []);
  }
  if (!localStorage.getItem(CLAVES.INGRESOS)) {
    guardar(CLAVES.INGRESOS, []);
  }
  if (!localStorage.getItem(CLAVES.USUARIOS)) {
    // Usuario administrador de ejemplo
    guardar(CLAVES.USUARIOS, [
      { usuario: 'admin', password: 'admin123', nombre: 'Administrador RU' }
    ]);
  }
}

/* ---------------- IDs automáticos ---------------- */
function generarId(prefijo) {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.floor(Math.random() * 900 + 100);
  return `${prefijo}-${ts}-${rnd}`;
}

/* ---------------- Fechas y horas ---------------- */
function hoyISO() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function fechaActualMayorQue(fechaISO) {
  // true si la fecha/hora actual ya pasó la fecha límite (fin del día)
  const limite = new Date(fechaISO + 'T23:59:59');
  return new Date() > limite;
}

function formatearFecha(fechaISO) {
  if (!fechaISO) return '—';
  const [a, m, d] = fechaISO.split('-');
  return `${d}/${m}/${a}`;
}

function formatearHora(horaStr) {
  return horaStr || '—';
}

function horaActual() {
  return new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/* ---------------- Reloj de navbar en vivo ---------------- */
function iniciarReloj(elementoId) {
  const el = document.getElementById(elementoId);
  if (!el) return;
  function tick() {
    const ahora = new Date();
    const fecha = ahora.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
    const hora = ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    el.textContent = `${fecha} · ${hora}`;
  }
  tick();
  setInterval(tick, 1000);
}

/* ---------------- Lógica de estado de convocatorias ---------------- */
function recalcularEstadoConvocatoria(conv) {
  // No reactivar automáticamente una desactivación manual;
  // solo forzamos a Desactivada cuando corresponde.
  if (conv.estadoManual === 'Desactivada') {
    conv.estado = 'Desactivada';
    return conv;
  }
  if (fechaActualMayorQue(conv.fechaCierre)) {
    conv.estado = 'Desactivada';
  } else if (conv.cuposDisponibles <= 0) {
    conv.estado = 'Desactivada';
  } else if (conv.estadoManual === 'Disponible') {
    conv.estado = 'Disponible';
  } else {
    conv.estado = conv.estado || 'Desactivada';
  }
  return conv;
}

function obtenerConvocatorias() {
  const lista = obtener(CLAVES.CONVOCATORIAS, []);
  let cambiado = false;
  lista.forEach(c => {
    const estadoPrevio = c.estado;
    recalcularEstadoConvocatoria(c);
    if (c.estado !== estadoPrevio) cambiado = true;
  });
  if (cambiado) guardar(CLAVES.CONVOCATORIAS, lista);
  return lista;
}

function guardarConvocatorias(lista) {
  return guardar(CLAVES.CONVOCATORIAS, lista);
}

/* ---------------- Toasts (alertas visuales flotantes) ---------------- */
function asegurarContenedorToast() {
  let cont = document.querySelector('.toast-contenedor');
  if (!cont) {
    cont = document.createElement('div');
    cont.className = 'toast-contenedor';
    document.body.appendChild(cont);
  }
  return cont;
}

const ICONOS_TOAST = {
  exito: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M8.5 12.5l2.3 2.3 4.7-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  error: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 11v5M12 8v.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`
};

function mostrarToast(mensaje, tipo = 'info', duracion = 3600) {
  const cont = asegurarContenedorToast();
  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  toast.innerHTML = `${ICONOS_TOAST[tipo] || ICONOS_TOAST.info}<span>${mensaje}</span>`;
  cont.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 250ms ease, transform 250ms ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 260);
  }, duracion);
}

/* ---------------- Modal de confirmación reutilizable ---------------- */
function pedirConfirmacion({ titulo, mensaje, tono = 'info', textoConfirmar = 'Confirmar', textoCancelar = 'Cancelar' }) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay abierto';

    const iconos = {
      alerta: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 9v4M12 16h.01M10.3 3.86l-8.2 14.2A1.5 1.5 0 003.4 20.4h17.2a1.5 1.5 0 001.3-2.34l-8.2-14.2a1.5 1.5 0 00-2.6 0z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      info: ICONOS_TOAST.info,
      exito: ICONOS_TOAST.exito
    };

    overlay.innerHTML = `
      <div class="modal">
        <div class="modal__icono tono-${tono}">${iconos[tono] || iconos.info}</div>
        <div class="modal__cuerpo">
          <h3>${titulo}</h3>
          <p>${mensaje}</p>
        </div>
        <div class="modal__acciones">
          <button class="btn btn-secundario" data-accion="cancelar">${textoCancelar}</button>
          <button class="btn ${tono === 'alerta' ? 'btn-peligro' : 'btn-primario'}" data-accion="confirmar">${textoConfirmar}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    function cerrar(resultado) {
      overlay.classList.remove('abierto');
      setTimeout(() => overlay.remove(), 150);
      resolve(resultado);
    }

    overlay.querySelector('[data-accion="confirmar"]').addEventListener('click', () => cerrar(true));
    overlay.querySelector('[data-accion="cancelar"]').addEventListener('click', () => cerrar(false));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) cerrar(false); });
  });
}

/* ---------------- Sidebar móvil (toggle) ---------------- */
function inicializarSidebarMovil() {
  const toggle = document.querySelector('.sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.overlay-movil');
  if (!toggle || !sidebar || !overlay) return;

  function abrir() {
    sidebar.classList.add('abierta');
    overlay.classList.add('activo');
  }
  function cerrar() {
    sidebar.classList.remove('abierta');
    overlay.classList.remove('activo');
  }

  toggle.addEventListener('click', () => {
    sidebar.classList.contains('abierta') ? cerrar() : abrir();
  });
  overlay.addEventListener('click', cerrar);
}

/* ---------------- Marcar enlace activo en sidebar ---------------- */
function marcarNavegacionActiva() {
  const actual = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.sidebar__link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === actual) {
      link.classList.add('activo');
    }
  });
}

/* ---------------- Sesión simple (registro / ingreso de administrador) ---------------- */
function iniciarSesion(usuario, password) {
  const usuarios = obtener(CLAVES.USUARIOS, []);
  const encontrado = usuarios.find(u => u.usuario === usuario && u.password === password);
  if (encontrado) {
    guardar(CLAVES.SESION, { usuario: encontrado.usuario, nombre: encontrado.nombre, ingresoEn: new Date().toISOString() });
    return true;
  }
  return false;
}

function sesionActiva() {
  return obtener(CLAVES.SESION, null);
}

function cerrarSesion() {
  localStorage.removeItem(CLAVES.SESION);
}

function registrarUsuario({ usuario, password, nombre }) {
  const usuarios = obtener(CLAVES.USUARIOS, []);
  if (usuarios.some(u => u.usuario === usuario)) {
    return { ok: false, mensaje: 'El nombre de usuario ya está registrado.' };
  }
  usuarios.push({ usuario, password, nombre });
  guardar(CLAVES.USUARIOS, usuarios);
  return { ok: true };
}

/* ---------------- Inicializar al cargar cualquier página ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  inicializarDatos();
  inicializarSidebarMovil();
  marcarNavegacionActiva();
  iniciarReloj('reloj-navbar');
});
