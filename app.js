'use strict';

/* =========================================================
   CalculaTuRuta — lógica de la app (sin frameworks)
   ========================================================= */

const VERSION = '1.0.0';
const K = { jornadas: 'ctr.jornadas', ajustes: 'ctr.ajustes', ultimo: 'ctr.ultimo', aviso: 'ctr.avisoInstalar' };
const DEF = {
  rendimiento: 12,
  bencina: 1300,
  comision: 25,
  desgaste: { bajo: 30, medio: 50, alto: 80 },
  meta: 60000,
  margen: 40
};
const PLATAFORMAS = ['Uber', 'DiDi', 'Cabify', 'InDrive', 'Otra'];
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const NIVELES = { bajo: 'Bajo', medio: 'Medio', alto: 'Alto', mio: 'Mi valor' };

/* ---------- Almacenamiento ---------- */
function leer(clave, porDefecto) {
  try {
    const v = localStorage.getItem(clave);
    return v ? JSON.parse(v) : porDefecto;
  } catch (e) { return porDefecto; }
}
function escribir(clave, valor) {
  try { localStorage.setItem(clave, JSON.stringify(valor)); return true; }
  catch (e) { toast('No se pudo guardar en el teléfono', true); return false; }
}

let ajustes = normalizarAjustes(leer(K.ajustes, {}));
let jornadas = leer(K.jornadas, []);
let ultimo = leer(K.ultimo, null);

function normalizarAjustes(a) {
  a = a || {};
  return {
    rendimiento: num(a.rendimiento, DEF.rendimiento),
    bencina: num(a.bencina, DEF.bencina),
    comision: num(a.comision, DEF.comision),
    desgaste: {
      bajo: num(a.desgaste && a.desgaste.bajo, DEF.desgaste.bajo),
      medio: num(a.desgaste && a.desgaste.medio, DEF.desgaste.medio),
      alto: num(a.desgaste && a.desgaste.alto, DEF.desgaste.alto)
    },
    meta: num(a.meta, DEF.meta),
    margen: num(a.margen, DEF.margen)
  };
}
function num(v, def) { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : def; }

function guardarJornadas() {
  jornadas.sort((a, b) => (b.fecha.localeCompare(a.fecha)) || ((b.creado || 0) - (a.creado || 0)));
  return escribir(K.jornadas, jornadas);
}

/* ---------- Formato ---------- */
function miles(entero) { return String(entero).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function clp(n) {
  n = Math.round(Number(n) || 0);
  if (Object.is(n, -0)) n = 0;
  return (n < 0 ? '-' : '') + '$' + miles(Math.abs(n));
}
function dec(n, d = 1) {
  n = Number(n) || 0;
  const [e, f] = Math.abs(n).toFixed(d).split('.');
  const neg = n < 0 && Number(Math.abs(n).toFixed(d)) !== 0;
  return (neg ? '-' : '') + miles(e) + (f ? ',' + f : '');
}
function km(n) { return dec(n, 1) + ' km'; }
function horasTxt(min) {
  min = Math.round(min || 0);
  const h = Math.floor(min / 60), m = min % 60;
  return h + ' h' + (m ? ' ' + m + ' min' : '');
}
function clpCorto(n) {
  const a = Math.abs(n);
  if (a >= 1e6) return (n < 0 ? '-' : '') + dec(a / 1e6, 1) + 'M';
  if (a >= 1000) return (n < 0 ? '-' : '') + Math.round(a / 1000) + 'k';
  return String(Math.round(n));
}
function claseSigno(n) { return n < 0 ? 'rojo' : 'verde'; }
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

/* ---------- Lectura de números ---------- */
// Decimales: acepta "12,5" o "12.5". Vacío => NaN.
function leerDecimal(valor) {
  let s = String(valor == null ? '' : valor).trim().replace(/\s/g, '');
  if (!s) return NaN;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  if (!/^-?\d*\.?\d+$/.test(s)) return NaN;
  return Number(s);
}
// Pesos: solo dígitos (los puntos son separador de miles).
function leerPesos(valor) {
  const s = String(valor == null ? '' : valor).trim();
  if (!s) return NaN;
  if (/^-/.test(s)) return -1;
  const d = s.replace(/\D/g, '');
  return d ? Number(d) : NaN;
}
function ponerPesos(input, n) { input.value = (n === '' || n == null || isNaN(n)) ? '' : miles(Math.round(n)); }
function ponerDecimal(input, n) { input.value = (n === '' || n == null || isNaN(n)) ? '' : String(n).replace('.', ','); }

/* ---------- Fechas ---------- */
function pad(n) { return String(n).padStart(2, '0'); }
function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function hoyISO() { return iso(new Date()); }
function deISO(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function inicioSemana(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
function sumarDias(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function fechaLarga(s) {
  const d = deISO(s);
  return DIAS[d.getDay()] + ' ' + d.getDate() + ' ' + MESES[d.getMonth()].slice(0, 3) + ' ' + d.getFullYear();
}
function esFechaValida(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(deISO(s).getTime()); }

/* ---------- Cálculos ---------- */
function desgastePorKm(nivel, valorPropio) {
  return nivel === 'mio' ? Number(valorPropio) || 0 : ajustes.desgaste[nivel] ?? ajustes.desgaste.medio;
}
function calcular(j) {
  const litros = j.km / j.rendimiento;
  const gastoBencina = litros * j.bencina;
  const desgaste = j.km * j.desgastePorKm;
  const arriendo = j.tipoAuto === 'arrendado' ? j.arriendo : 0;
  const comision = j.descontada ? 0 : j.generado * j.comisionPct / 100;
  const neta = j.generado - gastoBencina - desgaste - arriendo - comision;
  const horas = j.minutos / 60;
  return {
    litros, gastoBencina, desgaste, arriendo, comision, neta, horas,
    porKm: j.km > 0 ? neta / j.km : 0,
    porHora: horas > 0 ? neta / horas : 0
  };
}
function agregar(lista) {
  const t = { neta: 0, km: 0, minutos: 0, generado: 0, comision: 0, n: lista.length };
  lista.forEach(j => {
    const c = calcular(j);
    t.neta += c.neta; t.km += j.km; t.minutos += j.minutos; t.generado += j.generado; t.comision += c.comision;
  });
  t.porKm = t.km > 0 ? t.neta / t.km : 0;
  t.porHora = t.minutos > 0 ? t.neta / (t.minutos / 60) : 0;
  return t;
}
// Últimos valores usados (o los de Ajustes si aún no hay)
function valoresRecordados() {
  const u = ultimo || {};
  return {
    plataforma: u.plataforma || 'Uber',
    tipoAuto: u.tipoAuto || 'propio',
    arriendo: u.arriendo ?? '',
    rendimiento: u.rendimiento ?? ajustes.rendimiento,
    bencina: u.bencina ?? ajustes.bencina,
    desgasteNivel: u.desgasteNivel || 'medio',
    desgasteValor: u.desgasteValor ?? '',
    descontada: u.descontada ?? true,
    comisionPct: u.comisionPct ?? ajustes.comision
  };
}
function costoPorKm() {
  const v = valoresRecordados();
  const bencinaKm = v.bencina / v.rendimiento;
  const desg = desgastePorKm(v.desgasteNivel, v.desgasteValor);
  return { total: bencinaKm + desg, bencinaKm, desgaste: desg, v };
}

/* ---------- Utilidades de UI ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

let toastTimer;
function toast(msg, error) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.toggle('error', !!error);
  t.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('visible'), 2600);
}

function abrirModal({ titulo, html, botones = [] }) {
  $('#modal-titulo').textContent = titulo;
  $('#modal-cuerpo').innerHTML = html || '';
  const cont = $('#modal-botones');
  cont.innerHTML = '';
  botones.forEach(b => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'btn ' + (b.clase || 'btn-ghost');
    el.textContent = b.texto;
    el.addEventListener('click', () => { if (b.accion && b.accion() === false) return; cerrarModal(); });
    cont.appendChild(el);
  });
  $('#modal').hidden = false;
}
function cerrarModal() { $('#modal').hidden = true; }
function confirmar(titulo, texto, textoOk, peligro) {
  return new Promise(res => abrirModal({
    titulo, html: '<p>' + texto + '</p>',
    botones: [
      { texto: textoOk, clase: peligro ? 'btn-danger solido' : 'btn-primary', accion: () => res(true) },
      { texto: 'Cancelar', accion: () => res(false) }
    ]
  }));
}

function marcarError(el, msg) {
  const f = el.closest('.field');
  if (!f) return;
  f.classList.add('invalid');
  const err = el.matches && el.matches('.err') ? el : f.querySelector('.err');
  if (err) err.textContent = msg;
}
function limpiarError(el) {
  const f = el.closest('.field');
  if (!f) return;
  f.classList.remove('invalid');
  $$('.err', f).forEach(e => (e.textContent = ''));
}
function limpiarErrores(cont) { $$('.field', cont).forEach(limpiarError); }

// Chips (botones de opción)
function grupo(nombre) { return $(`.chips[data-group="${nombre}"]`); }
function valorChip(nombre) { const b = $('button.activo', grupo(nombre)); return b ? b.dataset.v : null; }
function marcarChip(nombre, v) {
  $$('button', grupo(nombre)).forEach(b => b.classList.toggle('activo', b.dataset.v === String(v)));
}
const alCambiarChip = {};

document.addEventListener('click', e => {
  const b = e.target.closest('.chips button');
  if (!b) return;
  const g = b.parentElement.dataset.group;
  marcarChip(g, b.dataset.v);
  limpiarError(b);
  if (alCambiarChip[g]) alCambiarChip[g](b.dataset.v);
});

// Formato automático de pesos mientras se escribe
document.addEventListener('input', e => {
  const el = e.target;
  if (el.matches('[data-money]')) {
    const d = el.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    el.value = d ? miles(d) : '';
  }
  if (el.closest('.field')) limpiarError(el);
});

/* =========================================================
   Navegación
   ========================================================= */
let vistaActual = 'inicio';
function mostrar(vista) {
  vistaActual = vista;
  $$('.view').forEach(v => (v.hidden = v.id !== 'view-' + vista));
  $$('.tabbar button').forEach(b => b.classList.toggle('activo', b.dataset.view === vista));
  $('#btn-ajustes').classList.toggle('activo', vista === 'ajustes');
  $('#titulo').textContent = $('#view-' + vista).dataset.titulo;
  window.scrollTo(0, 0);
  if (vista === 'inicio') renderInicio();
  if (vista === 'registrar' && !wz.iniciado) nuevaJornada();
  if (vista === 'conviene') prepararConviene();
  if (vista === 'historial') renderHistorial();
  if (vista === 'ajustes') cargarAjustes();
}
$$('.tabbar button').forEach(b => b.addEventListener('click', () => mostrar(b.dataset.view)));
$('#btn-ajustes').addEventListener('click', () => mostrar(vistaActual === 'ajustes' ? 'inicio' : 'ajustes'));

/* =========================================================
   1) INICIO
   ========================================================= */
function tarjetaPeriodo(etiqueta, t, conMeta) {
  let meta = '';
  if (conMeta) {
    const pct = ajustes.meta > 0 ? Math.max(0, Math.min(1, t.neta / ajustes.meta)) : 0;
    const cumplida = ajustes.meta > 0 && t.neta >= ajustes.meta;
    meta = `<div class="progreso">
      <div class="barra" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct * 100)}"><div style="width:${pct * 100}%"></div></div>
      <p><span>${cumplida ? '¡Meta cumplida!' : 'Meta diaria: ' + clp(ajustes.meta)}</span><span>${Math.round(pct * 100)}%</span></p>
    </div>`;
  }
  const grande = conMeta ? 'monto-xl' : 'monto-l';
  return `<div class="card periodo-card">
    <div class="cabecera"><span class="etiqueta">${etiqueta}</span><span class="muted small">${t.n} ${t.n === 1 ? 'jornada' : 'jornadas'}</span></div>
    <div class="${grande} ${t.n ? claseSigno(t.neta) : ''}">${clp(t.neta)}</div>
    <div class="muted small">ganancia neta</div>
    ${meta}
    <div class="metricas">
      <div class="metrica"><small>$/km neto</small><strong>${clp(t.porKm)}</strong></div>
      <div class="metrica"><small>$/hora neto</small><strong>${clp(t.porHora)}</strong></div>
      <div class="metrica"><small>Km</small><strong>${dec(t.km, 1)}</strong></div>
    </div>
  </div>`;
}
function renderInicio() {
  const hoy = new Date();
  const hoyS = iso(hoy);
  const ini = iso(inicioSemana(hoy));
  const fin = iso(sumarDias(inicioSemana(hoy), 6));
  const mes = hoyS.slice(0, 7);
  const tHoy = agregar(jornadas.filter(j => j.fecha === hoyS));
  const tSem = agregar(jornadas.filter(j => j.fecha >= ini && j.fecha <= fin));
  const tMes = agregar(jornadas.filter(j => j.fecha.startsWith(mes)));
  $('#panel').innerHTML =
    tarjetaPeriodo('Hoy', tHoy, true) +
    tarjetaPeriodo('Esta semana', tSem) +
    tarjetaPeriodo('Este mes · ' + MESES[hoy.getMonth()], tMes);
}
$('#btn-terminar').addEventListener('click', () => { nuevaJornada(); mostrar('registrar'); });

// Aviso para instalar en iPhone
(function avisoInstalar() {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const instalada = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  if (ios && !instalada && !leer(K.aviso, false)) $('#aviso-instalar').hidden = false;
  $('#cerrar-aviso').addEventListener('click', () => { $('#aviso-instalar').hidden = true; escribir(K.aviso, true); });
})();

/* =========================================================
   2) REGISTRAR JORNADA (asistente)
   ========================================================= */
const wz = { iniciado: false, paso: 1, editId: null, d: {} };

function actualizarEtiquetasDesgaste() {
  ['bajo', 'medio', 'alto'].forEach(n => {
    const el = $(`[data-desg="${n}"]`);
    if (el) el.textContent = clp(ajustes.desgaste[n]) + '/km';
  });
}

function cargarWizard(d) {
  limpiarErrores($('#view-registrar'));
  actualizarEtiquetasDesgaste();
  $('#w-fecha').value = d.fecha;
  marcarChip('plataforma', d.plataforma);
  ponerPesos($('#w-generado'), d.generado);
  ponerDecimal($('#w-km'), d.km);
  if (d.minutos == null || d.minutos === '') { $('#w-horas').value = ''; $('#w-min').value = ''; }
  else { $('#w-horas').value = Math.floor(d.minutos / 60); $('#w-min').value = d.minutos % 60; }

  marcarChip('tipoAuto', d.tipoAuto);
  ponerPesos($('#w-arriendo'), d.arriendo);
  ponerDecimal($('#w-rend'), d.rendimiento);
  ponerPesos($('#w-bencina'), d.bencina);
  marcarChip('desgaste', d.desgasteNivel);
  ponerPesos($('#w-desgaste'), d.desgasteNivel === 'mio' ? d.desgasteValor : '');

  marcarChip('descontada', d.descontada ? 'si' : 'no');
  const pct = Number(d.comisionPct);
  if ([10, 15, 20, 25].includes(pct)) { marcarChip('comision', pct); $('#w-comision').value = ''; }
  else { marcarChip('comision', 'otro'); ponerDecimal($('#w-comision'), pct); }
  visibilidadWizard();
}

function visibilidadWizard() {
  $('#wrap-arriendo').hidden = valorChip('tipoAuto') !== 'arrendado';
  $('#wrap-desgaste').hidden = valorChip('desgaste') !== 'mio';
  $('#wrap-comision').hidden = valorChip('descontada') !== 'no';
  $('#wrap-comision-otro').hidden = valorChip('comision') !== 'otro';
}
alCambiarChip.tipoAuto = visibilidadWizard;
alCambiarChip.desgaste = visibilidadWizard;
alCambiarChip.descontada = visibilidadWizard;
alCambiarChip.comision = v => { visibilidadWizard(); if (v === 'otro') setTimeout(() => $('#w-comision').focus(), 50); };

function nuevaJornada() {
  const v = valoresRecordados();
  wz.iniciado = true;
  wz.editId = null;
  wz.d = {};
  $('#banner-edicion').hidden = true;
  cargarWizard(Object.assign({ fecha: hoyISO(), generado: '', km: '', minutos: null }, v));
  irPaso(1);
}

function editarJornada(id) {
  const j = jornadas.find(x => x.id === id);
  if (!j) return;
  wz.iniciado = true;
  wz.editId = id;
  wz.d = {};
  $('#edicion-fecha').textContent = fechaLarga(j.fecha);
  $('#banner-edicion').hidden = false;
  cargarWizard(Object.assign({}, j, { desgasteValor: j.desgasteNivel === 'mio' ? j.desgastePorKm : '' }));
  mostrar('registrar');
  irPaso(1);
}
$('#cancelar-edicion').addEventListener('click', () => { nuevaJornada(); mostrar('historial'); });

function validarPaso(n) {
  const d = wz.d;
  let ok = true;
  const error = (el, msg) => { marcarError(el, msg); ok = false; };

  if (n === 1) {
    const fecha = $('#w-fecha').value;
    if (!esFechaValida(fecha)) error($('#w-fecha'), 'Elige una fecha.');
    const plat = valorChip('plataforma');
    if (!plat) error($('[data-err="plataforma"]'), 'Elige una plataforma.');
    const gen = leerPesos($('#w-generado').value);
    if (isNaN(gen)) error($('#w-generado'), 'Ingresa cuánto generaste.');
    else if (gen <= 0) error($('#w-generado'), 'El monto debe ser mayor a $0.');
    const k = leerDecimal($('#w-km').value);
    if (isNaN(k)) error($('#w-km'), 'Ingresa los km recorridos.');
    else if (k <= 0) error($('#w-km'), 'Los km deben ser mayores a 0.');
    const hTxt = $('#w-horas').value.trim(), mTxt = $('#w-min').value.trim();
    const h = hTxt === '' ? 0 : leerDecimal(hTxt), m = mTxt === '' ? 0 : leerDecimal(mTxt);
    const errT = $('[data-err="tiempo"]');
    if (hTxt === '' && mTxt === '') error(errT, 'Ingresa el tiempo trabajado.');
    else if (isNaN(h) || isNaN(m) || h < 0 || m < 0 || !Number.isInteger(h) || !Number.isInteger(m)) error(errT, 'Usa números enteros, sin signos negativos.');
    else if (m > 59) error(errT, 'Los minutos van de 0 a 59.');
    else if (h > 24) error(errT, 'Una jornada no puede superar 24 horas.');
    else if (h * 60 + m <= 0) error(errT, 'El tiempo debe ser mayor a 0.');
    if (ok) Object.assign(d, { fecha, plataforma: plat, generado: gen, km: k, minutos: h * 60 + m });
  }

  if (n === 2) {
    const tipo = valorChip('tipoAuto') || 'propio';
    let arr = 0;
    if (tipo === 'arrendado') {
      arr = leerPesos($('#w-arriendo').value);
      if (isNaN(arr)) error($('#w-arriendo'), 'Ingresa el costo del arriendo diario.');
      else if (arr <= 0) error($('#w-arriendo'), 'El arriendo debe ser mayor a $0.');
    }
    const r = leerDecimal($('#w-rend').value);
    if (isNaN(r)) error($('#w-rend'), 'Ingresa el rendimiento de tu auto.');
    else if (r <= 0) error($('#w-rend'), 'El rendimiento debe ser mayor a 0.');
    else if (r > 100) error($('#w-rend'), 'Revisa el valor: parece muy alto.');
    const b = leerPesos($('#w-bencina').value);
    if (isNaN(b)) error($('#w-bencina'), 'Ingresa el precio de la bencina.');
    else if (b <= 0) error($('#w-bencina'), 'El precio debe ser mayor a $0.');
    const nivel = valorChip('desgaste') || 'medio';
    let dv = 0;
    if (nivel === 'mio') {
      dv = leerPesos($('#w-desgaste').value);
      if (isNaN(dv)) error($('#w-desgaste'), 'Ingresa tu desgaste por km (puede ser 0).');
      else if (dv < 0) error($('#w-desgaste'), 'No puede ser negativo.');
    }
    if (ok) Object.assign(d, {
      tipoAuto: tipo, arriendo: tipo === 'arrendado' ? arr : 0, rendimiento: r, bencina: b,
      desgasteNivel: nivel, desgastePorKm: desgastePorKm(nivel, dv), desgasteValor: nivel === 'mio' ? dv : ''
    });
  }

  if (n === 3) {
    const desc = valorChip('descontada') !== 'no';
    let pct = 0;
    if (!desc) {
      const c = valorChip('comision');
      if (c === 'otro' || !c) {
        pct = leerDecimal($('#w-comision').value);
        if (isNaN(pct)) error($('#w-comision'), 'Ingresa el % de comisión.');
        else if (pct <= 0 || pct >= 100) error($('#w-comision'), 'Debe ser mayor a 0% y menor a 100%.');
      } else pct = Number(c);
    } else {
      // Se guarda el % elegido para recordarlo, aunque no se aplique
      const c = valorChip('comision'), otro = leerDecimal($('#w-comision').value);
      pct = c && c !== 'otro' ? Number(c) : (otro > 0 && otro < 100 ? otro : valoresRecordados().comisionPct);
    }
    if (ok) Object.assign(d, { descontada: desc, comisionPct: pct });
  }
  return ok;
}

function irPaso(n) {
  wz.paso = n;
  $$('#view-registrar .paso').forEach(p => (p.hidden = Number(p.dataset.paso) !== n));
  $$('#stepper li').forEach(li => {
    const p = Number(li.dataset.paso);
    li.classList.toggle('actual', p === n);
    li.classList.toggle('hecho', p < n);
  });
  $('#w-atras').hidden = n === 1;
  $('.wizard-nav').classList.toggle('solo', n === 1);
  const sig = $('#w-sig');
  sig.textContent = n === 3 ? 'Ver resultado' : n === 4 ? (wz.editId ? 'Guardar cambios' : 'Guardar jornada') : 'Siguiente';
  if (n === 4) renderResultado();
  window.scrollTo(0, 0);
}

$('#w-sig').addEventListener('click', () => {
  if (wz.paso < 4) {
    if (!validarPaso(wz.paso)) {
      const f = $('#view-registrar .field.invalid');
      if (f) f.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    irPaso(wz.paso + 1);
  } else guardarJornada();
});
$('#w-atras').addEventListener('click', () => { if (wz.paso > 1) irPaso(wz.paso - 1); });
$$('#stepper li').forEach(li => li.addEventListener('click', () => {
  const p = Number(li.dataset.paso);
  if (p < wz.paso) irPaso(p);
}));

function filaDesglose(etq, valor, clase = '') { return `<li class="${clase}"><span>${etq}</span><span>${valor}</span></li>`; }

function renderResultado() {
  const d = wz.d;
  const c = calcular(d);
  const pos = c.neta >= 0;
  const filas = [
    filaDesglose('Monto generado', clp(d.generado)),
    filaDesglose('Km recorridos', km(d.km)),
    filaDesglose('Tiempo trabajado', horasTxt(d.minutos)),
    filaDesglose('Litros usados', dec(c.litros, 1) + ' L'),
    filaDesglose('Gasto en bencina', '−' + clp(c.gastoBencina)),
    filaDesglose(`Desgaste (${clp(d.desgastePorKm)}/km)`, '−' + clp(c.desgaste)),
    d.tipoAuto === 'arrendado' ? filaDesglose('Arriendo', '−' + clp(c.arriendo)) : '',
    filaDesglose(d.descontada ? 'Comisión (ya descontada)' : `Comisión (${dec(d.comisionPct, d.comisionPct % 1 ? 1 : 0)}%)`, d.descontada ? clp(0) : '−' + clp(c.comision)),
    filaDesglose('Ganancia neta', `<span class="${claseSigno(c.neta)}">${clp(c.neta)}</span>`, 'total')
  ].join('');
  $('#resultado').innerHTML = `
    <div class="card resultado-neto ${pos ? 'pos' : 'neg'}">
      <div class="etiqueta muted">${pos ? 'Ganancia neta' : 'Pérdida'} · ${esc(d.plataforma)} · ${fechaLarga(d.fecha)}</div>
      <div class="monto-xl ${claseSigno(c.neta)}">${clp(c.neta)}</div>
      <div class="metricas">
        <div class="metrica"><small>$/km neto</small><strong class="${claseSigno(c.porKm)}">${clp(c.porKm)}</strong></div>
        <div class="metrica"><small>$/hora neto</small><strong class="${claseSigno(c.porHora)}">${clp(c.porHora)}</strong></div>
      </div>
    </div>
    <div class="card"><h2>Detalle</h2><ul class="desglose">${filas}</ul></div>`;
}

function guardarJornada() {
  const d = wz.d;
  const j = {
    id: wz.editId || ('j' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)),
    fecha: d.fecha, plataforma: d.plataforma,
    generado: d.generado, km: d.km, minutos: d.minutos,
    tipoAuto: d.tipoAuto, arriendo: d.arriendo,
    rendimiento: d.rendimiento, bencina: d.bencina,
    desgasteNivel: d.desgasteNivel, desgastePorKm: d.desgastePorKm,
    descontada: d.descontada, comisionPct: d.comisionPct,
    creado: Date.now()
  };
  if (wz.editId) {
    const i = jornadas.findIndex(x => x.id === wz.editId);
    if (i >= 0) { j.creado = jornadas[i].creado || j.creado; jornadas[i] = j; }
  } else {
    jornadas.push(j);
  }
  if (!guardarJornadas()) return;

  // Recordar datos del auto, comisión y bencina para la próxima vez
  if (!wz.editId) {
    ultimo = {
      plataforma: d.plataforma, tipoAuto: d.tipoAuto, arriendo: d.tipoAuto === 'arrendado' ? d.arriendo : (ultimo && ultimo.arriendo) || '',
      rendimiento: d.rendimiento, bencina: d.bencina,
      desgasteNivel: d.desgasteNivel, desgasteValor: d.desgasteNivel === 'mio' ? d.desgastePorKm : (ultimo && ultimo.desgasteValor) || '',
      descontada: d.descontada, comisionPct: d.comisionPct
    };
    escribir(K.ultimo, ultimo);
  }
  const editado = !!wz.editId;
  wz.iniciado = false;
  toast(editado ? 'Cambios guardados' : 'Jornada guardada');
  mostrar(editado ? 'historial' : 'inicio');
}

/* =========================================================
   3) ¿CONVIENE ESTE VIAJE?
   ========================================================= */
function prepararConviene() {
  const v = valoresRecordados();
  if (!valorChip('cComision')) marcarChip('cComision', v.descontada ? 'no' : 'si');
  $('#c-com-si').textContent = 'Sí, ' + dec(v.comisionPct, v.comisionPct % 1 ? 1 : 0) + '%';
  renderConviene();
}
['#c-precio', '#c-recoger', '#c-viaje'].forEach(s => $(s).addEventListener('input', renderConviene));
alCambiarChip.cComision = renderConviene;

function renderConviene() {
  const ck = costoPorKm();
  const v = ck.v;
  const pctCom = valorChip('cComision') === 'si' ? v.comisionPct / 100 : 0;
  const precioTxt = $('#c-precio').value, recTxt = $('#c-recoger').value, viaTxt = $('#c-viaje').value;
  const precio = leerPesos(precioTxt);
  const kmRec = recTxt.trim() === '' ? 0 : leerDecimal(recTxt);
  const kmVia = leerDecimal(viaTxt);

  // Validación suave (solo si el campo tiene algo escrito)
  limpiarError($('#c-precio')); limpiarError($('#c-recoger')); limpiarError($('#c-viaje'));
  let listo = true;
  if (precioTxt && (isNaN(precio) || precio <= 0)) { marcarError($('#c-precio'), 'Ingresa un precio mayor a $0.'); listo = false; }
  if (recTxt && (isNaN(kmRec) || kmRec < 0)) { marcarError($('#c-recoger'), 'Valor no válido.'); listo = false; }
  if (viaTxt && (isNaN(kmVia) || kmVia <= 0)) { marcarError($('#c-viaje'), 'Debe ser mayor a 0.'); listo = false; }
  if (!precioTxt || !viaTxt) listo = false;

  const margen = ajustes.margen / 100;
  let html;
  if (!listo) {
    html = `<div class="card vacio">Ingresa el precio y los km para ver si te conviene.</div>`;
  } else {
    const kmTotal = kmRec + kmVia;
    const equilibrio = ck.total * kmTotal;
    const comision = precio * pctCom;
    const recibes = precio - comision;
    const neta = recibes - equilibrio;
    const ratio = equilibrio > 0 ? recibes / equilibrio : Infinity;
    let clase, sello, texto;
    if (neta <= 0) { clase = 'no'; sello = 'No conviene'; texto = 'Con este precio pierdes plata.'; }
    else if (ratio < 1 + margen) { clase = 'justo'; sello = 'Justo'; texto = `Cubres tus costos, pero ganas menos del ${dec(ajustes.margen, 0)}% sobre ellos.`; }
    else { clase = 'conviene'; sello = 'Conviene'; texto = `Ganas ${equilibrio > 0 ? Math.round((ratio - 1) * 100) + '%' : 'bastante'} sobre tus costos.`; }
    const minNoPerder = pctCom < 1 ? equilibrio / (1 - pctCom) : 0;
    const minConviene = pctCom < 1 ? equilibrio * (1 + margen) / (1 - pctCom) : 0;
    html = `
      <div class="card veredicto ${clase}">
        <div class="sello">${sello}</div>
        <p>${texto}</p>
        <div class="monto-l ${claseSigno(neta)}">${clp(neta)}</div>
        <div class="muted small">ganancia neta del viaje</div>
      </div>
      <div class="card"><ul class="desglose">
        ${filaDesglose('Km totales (recoger + viaje)', km(kmTotal))}
        ${filaDesglose('Precio ofrecido', clp(precio))}
        ${pctCom ? filaDesglose('Comisión de la app', '−' + clp(comision)) : ''}
        ${filaDesglose('Punto de equilibrio del viaje', '−' + clp(equilibrio))}
        ${filaDesglose('Ganancia por km recorrido', `<span class="${claseSigno(neta)}">${clp(neta / kmTotal)}</span>`)}
        ${filaDesglose('Precio mínimo para no perder', clp(Math.ceil(minNoPerder)))}
        ${filaDesglose('Precio mínimo para “Conviene”', clp(Math.ceil(minConviene)))}
      </ul></div>`;
  }
  $('#veredicto').innerHTML = html;

  // Punto de equilibrio y km diarios para la meta
  const arriendoDiario = v.tipoAuto === 'arrendado' ? Number(v.arriendo) || 0 : 0;
  let metaHtml;
  const conKm = jornadas.filter(j => j.km > 0);
  if (!conKm.length) {
    metaHtml = `<p class="muted">Registra al menos una jornada para calcular cuántos km necesitas al día.</p>`;
  } else {
    const kmHist = conKm.reduce((s, j) => s + j.km, 0);
    const ingresoHist = conKm.reduce((s, j) => s + j.generado - calcular(j).comision, 0);
    const ingresoKm = ingresoHist / kmHist;
    const margenKm = ingresoKm - ck.total;
    if (margenKm <= 0) {
      metaHtml = `<p class="rojo"><strong>Con tu promedio actual (${clp(ingresoKm)}/km) no alcanzas a cubrir tus costos por km.</strong></p>`;
    } else {
      const kmDia = (ajustes.meta + arriendoDiario) / margenKm;
      metaHtml = `<div class="monto-l">${km(kmDia)}</div>
        <div class="muted small">al día para ganar ${clp(ajustes.meta)} netos</div>
        <ul class="desglose" style="margin-top:10px">
          ${filaDesglose('Tu ingreso promedio por km', clp(ingresoKm))}
          ${filaDesglose('Menos tu costo por km', '−' + clp(ck.total))}
          ${filaDesglose('Te queda por km', clp(margenKm))}
          ${arriendoDiario ? filaDesglose('Arriendo diario a cubrir', clp(arriendoDiario)) : ''}
        </ul>`;
    }
  }
  $('#equilibrio').innerHTML = `
    <div class="card">
      <div class="etiqueta muted small">TU PUNTO DE EQUILIBRIO</div>
      <div class="monto-l">${clp(ck.total)}<span class="muted" style="font-size:18px;font-weight:600"> / km</span></div>
      <ul class="desglose">
        ${filaDesglose(`Bencina (${clp(v.bencina)}/L ÷ ${dec(v.rendimiento, v.rendimiento % 1 ? 1 : 0)} km/L)`, clp(ck.bencinaKm) + '/km')}
        ${filaDesglose(`Desgaste (${NIVELES[v.desgasteNivel] || 'Medio'})`, clp(ck.desgaste) + '/km')}
      </ul>
      <p class="muted small">Usa los datos de tu última jornada. Cámbialos en Ajustes o al registrar.</p>
    </div>
    <div class="card">
      <div class="etiqueta muted small">KM DIARIOS PARA TU META</div>
      ${metaHtml}
    </div>`;
}

/* =========================================================
   4) HISTORIAL
   ========================================================= */
const hist = { modo: 'semana', offset: 0 };
marcarChip('histModo', 'semana');
alCambiarChip.histModo = v => { hist.modo = v; hist.offset = 0; renderHistorial(); };
$('#h-prev').addEventListener('click', () => { hist.offset--; renderHistorial(); });
$('#h-next').addEventListener('click', () => { if (hist.offset < 0) { hist.offset++; renderHistorial(); } });

function rangoPeriodo() {
  const hoy = new Date();
  if (hist.modo === 'semana') {
    const ini = sumarDias(inicioSemana(hoy), 7 * hist.offset);
    const fin = sumarDias(ini, 6);
    const titulo = ini.getMonth() === fin.getMonth()
      ? `${ini.getDate()} al ${fin.getDate()} de ${MESES[fin.getMonth()]}`
      : `${ini.getDate()} ${MESES[ini.getMonth()].slice(0, 3)} al ${fin.getDate()} ${MESES[fin.getMonth()].slice(0, 3)}`;
    return { ini, dias: 7, titulo: (hist.offset === 0 ? 'Esta semana · ' : '') + titulo };
  }
  const ini = new Date(hoy.getFullYear(), hoy.getMonth() + hist.offset, 1);
  const dias = new Date(ini.getFullYear(), ini.getMonth() + 1, 0).getDate();
  const nombre = MESES[ini.getMonth()];
  return { ini, dias, titulo: nombre[0].toUpperCase() + nombre.slice(1) + ' ' + ini.getFullYear() };
}

function renderHistorial() {
  const r = rangoPeriodo();
  const desde = iso(r.ini), hasta = iso(sumarDias(r.ini, r.dias - 1));
  const enPeriodo = jornadas.filter(j => j.fecha >= desde && j.fecha <= hasta);
  const t = agregar(enPeriodo);
  $('#h-titulo').textContent = r.titulo;
  $('#h-next').disabled = hist.offset >= 0;
  $('#h-resumen').innerHTML = `
    <div class="monto-l ${t.n ? claseSigno(t.neta) : ''}">${clp(t.neta)}</div>
    <div class="muted small">ganancia neta · ${t.n} ${t.n === 1 ? 'jornada' : 'jornadas'} · ${horasTxt(t.minutos)}</div>
    <div class="metricas">
      <div class="metrica"><small>$/km neto</small><strong>${clp(t.porKm)}</strong></div>
      <div class="metrica"><small>$/hora neto</small><strong>${clp(t.porHora)}</strong></div>
      <div class="metrica"><small>Km</small><strong>${dec(t.km, 1)}</strong></div>
    </div>`;

  // Ganancia neta por día
  const porDia = {};
  enPeriodo.forEach(j => { porDia[j.fecha] = (porDia[j.fecha] || 0) + calcular(j).neta; });
  const dias = [];
  for (let i = 0; i < r.dias; i++) {
    const d = sumarDias(r.ini, i);
    dias.push({ fecha: d, valor: porDia[iso(d)] || 0 });
  }
  $('#h-grafico').innerHTML = graficoBarras(dias, hist.modo === 'semana');

  // Lista completa
  const lista = $('#h-lista');
  if (!jornadas.length) {
    lista.innerHTML = `<li class="vacio" style="cursor:default;justify-content:center">Aún no registras jornadas.</li>`;
    return;
  }
  lista.innerHTML = jornadas.map(j => {
    const c = calcular(j);
    return `<li data-id="${esc(j.id)}">
      <div class="info"><strong>${fechaLarga(j.fecha)}<span class="badge">${esc(j.plataforma)}</span></strong>
      <small>${km(j.km)} · ${horasTxt(j.minutos)} · ${clp(c.porKm)}/km</small></div>
      <div class="neta ${claseSigno(c.neta)}">${clp(c.neta)}</div>
    </li>`;
  }).join('');
}
$('#h-lista').addEventListener('click', e => {
  const li = e.target.closest('li[data-id]');
  if (li) verDetalle(li.dataset.id);
});

function graficoBarras(dias, semana) {
  const W = 340, H = 170, top = 18, bottom = 22, izq = 2;
  const altoUtil = H - top - bottom;
  const valores = dias.map(d => d.valor);
  const max = Math.max(0, ...valores), min = Math.min(0, ...valores);
  const rango = (max - min) || 1;
  const y0 = top + altoUtil * (max / rango);
  const ancho = (W - izq * 2) / dias.length;
  const bw = Math.max(3, ancho * (semana ? 0.6 : 0.7));
  const hoyS = hoyISO();
  let barras = '', etiquetas = '';
  dias.forEach((d, i) => {
    const x = izq + i * ancho + (ancho - bw) / 2;
    const h = Math.abs(d.valor) / rango * altoUtil;
    const y = d.valor >= 0 ? y0 - h : y0;
    const color = d.valor >= 0 ? 'var(--verde)' : 'var(--rojo)';
    const fs = iso(d.fecha);
    if (d.valor !== 0) {
      barras += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(2, h).toFixed(1)}" rx="3" fill="${color}"><title>${fechaLarga(fs)}: ${clp(d.valor)}</title></rect>`;
      if (semana) {
        const ty = d.valor >= 0 ? y - 4 : y + h + 12;
        barras += `<text x="${(x + bw / 2).toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle" font-size="10" font-weight="700" fill="${color}">${clpCorto(d.valor)}</text>`;
      }
    }
    const dia = d.fecha.getDate();
    const mostrar = semana || dia === 1 || dia % 5 === 0;
    if (mostrar) {
      const lbl = semana ? DIAS[d.fecha.getDay()] : dia;
      const esHoy = fs === hoyS;
      etiquetas += `<text x="${(izq + i * ancho + ancho / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="11" fill="${esHoy ? 'var(--verde)' : 'var(--muted)'}" font-weight="${esHoy ? 700 : 400}">${lbl}</text>`;
    }
  });
  const sinDatos = valores.every(v => v === 0)
    ? `<text x="${W / 2}" y="${top + altoUtil / 2}" text-anchor="middle" font-size="13" fill="var(--muted)">Sin jornadas en este período</text>` : '';
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Ganancia neta por día">
    <line x1="0" x2="${W}" y1="${y0.toFixed(1)}" y2="${y0.toFixed(1)}" stroke="var(--borde)" stroke-width="1"/>
    ${barras}${etiquetas}${sinDatos}
  </svg>`;
}

function verDetalle(id) {
  const j = jornadas.find(x => x.id === id);
  if (!j) return;
  const c = calcular(j);
  const html = `
    <div class="monto-l ${claseSigno(c.neta)}">${clp(c.neta)}</div>
    <p class="muted small">${esc(j.plataforma)} · ${clp(c.porKm)}/km · ${clp(c.porHora)}/hora</p>
    <ul class="desglose">
      ${filaDesglose('Monto generado', clp(j.generado))}
      ${filaDesglose('Km recorridos', km(j.km))}
      ${filaDesglose('Tiempo trabajado', horasTxt(j.minutos))}
      ${filaDesglose('Auto', j.tipoAuto === 'arrendado' ? 'Arrendado' : 'Propio')}
      ${filaDesglose('Rendimiento', dec(j.rendimiento, 1) + ' km/L')}
      ${filaDesglose('Precio bencina', clp(j.bencina) + '/L')}
      ${filaDesglose('Litros usados', dec(c.litros, 1) + ' L')}
      ${filaDesglose('Gasto en bencina', '−' + clp(c.gastoBencina))}
      ${filaDesglose(`Desgaste ${NIVELES[j.desgasteNivel] ? '· ' + NIVELES[j.desgasteNivel] : ''} (${clp(j.desgastePorKm)}/km)`, '−' + clp(c.desgaste))}
      ${j.tipoAuto === 'arrendado' ? filaDesglose('Arriendo', '−' + clp(c.arriendo)) : ''}
      ${filaDesglose(j.descontada ? 'Comisión (ya descontada)' : `Comisión (${dec(j.comisionPct, j.comisionPct % 1 ? 1 : 0)}%)`, j.descontada ? clp(0) : '−' + clp(c.comision))}
      ${filaDesglose('Ganancia neta', `<span class="${claseSigno(c.neta)}">${clp(c.neta)}</span>`, 'total')}
    </ul>`;
  abrirModal({
    titulo: fechaLarga(j.fecha), html,
    botones: [
      { texto: 'Editar', clase: 'btn-primary', accion: () => editarJornada(id) },
      {
        texto: 'Borrar', clase: 'btn-danger', accion: () => {
          setTimeout(async () => {
            if (await confirmar('¿Borrar esta jornada?', `Se eliminará la jornada del ${fechaLarga(j.fecha)}. No se puede deshacer.`, 'Sí, borrar', true)) {
              jornadas = jornadas.filter(x => x.id !== id);
              guardarJornadas();
              if (wz.editId === id) wz.iniciado = false;
              renderHistorial();
              toast('Jornada borrada');
            }
          }, 0);
        }
      },
      { texto: 'Cerrar' }
    ]
  });
}

/* =========================================================
   AJUSTES
   ========================================================= */
function cargarAjustes() {
  limpiarErrores($('#view-ajustes'));
  ponerDecimal($('#a-rend'), ajustes.rendimiento);
  ponerPesos($('#a-bencina'), ajustes.bencina);
  ponerDecimal($('#a-comision'), ajustes.comision);
  ponerPesos($('#a-bajo'), ajustes.desgaste.bajo);
  ponerPesos($('#a-medio'), ajustes.desgaste.medio);
  ponerPesos($('#a-alto'), ajustes.desgaste.alto);
  ponerPesos($('#a-meta'), ajustes.meta);
  ponerDecimal($('#a-margen'), ajustes.margen);
  $('#version').textContent = `CalculaTuRuta v${VERSION} · ${jornadas.length} jornadas guardadas en este teléfono`;
}

$('#a-guardar').addEventListener('click', () => {
  limpiarErrores($('#view-ajustes'));
  let ok = true;
  const error = (el, msg) => { marcarError(el, msg); ok = false; };
  const r = leerDecimal($('#a-rend').value);
  if (isNaN(r) || r <= 0 || r > 100) error($('#a-rend'), 'Ingresa un rendimiento mayor a 0.');
  const b = leerPesos($('#a-bencina').value);
  if (isNaN(b) || b <= 0) error($('#a-bencina'), 'Ingresa un precio mayor a $0.');
  const c = leerDecimal($('#a-comision').value);
  if (isNaN(c) || c < 0 || c >= 100) error($('#a-comision'), 'Entre 0% y 99%.');
  const bajo = leerPesos($('#a-bajo').value), medio = leerPesos($('#a-medio').value), alto = leerPesos($('#a-alto').value);
  if ([bajo, medio, alto].some(v => isNaN(v) || v < 0)) error($('[data-err="desgaste"]'), 'Completa los tres valores (pueden ser 0, pero no negativos).');
  const meta = leerPesos($('#a-meta').value);
  if (isNaN(meta) || meta <= 0) error($('#a-meta'), 'Ingresa una meta mayor a $0.');
  const m = leerDecimal($('#a-margen').value);
  if (isNaN(m) || m < 0 || m > 500) error($('#a-margen'), 'Entre 0% y 500%.');
  if (!ok) { const f = $('#view-ajustes .field.invalid'); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }

  ajustes = { rendimiento: r, bencina: b, comision: c, desgaste: { bajo, medio, alto }, meta, margen: m };
  escribir(K.ajustes, ajustes);
  // Los nuevos valores por defecto se usan desde la próxima jornada
  if (ultimo) {
    Object.assign(ultimo, { rendimiento: r, bencina: b, comisionPct: c });
    escribir(K.ultimo, ultimo);
  }
  if (!wz.editId) wz.iniciado = false;
  actualizarEtiquetasDesgaste();
  toast('Ajustes guardados');
});

/* ---------- CSV ---------- */
const COLUMNAS = ['id', 'fecha', 'plataforma', 'generado', 'km', 'minutos', 'tipo_auto', 'arriendo', 'rendimiento', 'precio_bencina',
  'desgaste_nivel', 'desgaste_por_km', 'comision_descontada', 'comision_pct', 'litros', 'gasto_bencina', 'desgaste', 'comision', 'ganancia_neta'];

function celda(v) {
  const s = String(v ?? '');
  return /[";\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function numCSV(n, d) { return d ? Number(n).toFixed(d).replace('.', ',') : String(Math.round(n)); }

function generarCSV() {
  const lineas = [COLUMNAS.join(';')];
  jornadas.forEach(j => {
    const c = calcular(j);
    lineas.push([
      j.id, j.fecha, j.plataforma, numCSV(j.generado), numCSV(j.km, 1), numCSV(j.minutos), j.tipoAuto, numCSV(j.arriendo || 0),
      String(j.rendimiento).replace('.', ','), numCSV(j.bencina), j.desgasteNivel, numCSV(j.desgastePorKm),
      j.descontada ? 'si' : 'no', String(j.comisionPct).replace('.', ','),
      numCSV(c.litros, 2), numCSV(c.gastoBencina), numCSV(c.desgaste), numCSV(c.comision), numCSV(c.neta)
    ].map(celda).join(';'));
  });
  lineas.push('', 'AJUSTES', 'clave;valor');
  lineas.push('rendimiento;' + String(ajustes.rendimiento).replace('.', ','));
  lineas.push('precio_bencina;' + ajustes.bencina);
  lineas.push('comision;' + String(ajustes.comision).replace('.', ','));
  lineas.push('desgaste_bajo;' + ajustes.desgaste.bajo);
  lineas.push('desgaste_medio;' + ajustes.desgaste.medio);
  lineas.push('desgaste_alto;' + ajustes.desgaste.alto);
  lineas.push('meta_diaria;' + ajustes.meta);
  lineas.push('margen_conviene;' + String(ajustes.margen).replace('.', ','));
  return lineas.join('\r\n');
}

$('#a-exportar').addEventListener('click', async () => {
  const csv = '﻿' + generarCSV();
  const nombre = `calculaturuta-respaldo-${hoyISO()}.csv`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  try {
    const archivo = new File([blob], nombre, { type: 'text/csv' });
    if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
      await navigator.share({ files: [archivo], title: 'Respaldo CalculaTuRuta' });
      toast('Respaldo listo');
      return;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  toast('Respaldo descargado');
});

function parsearLineaCSV(linea, sep) {
  const out = [];
  let cur = '', q = false;
  for (let i = 0; i < linea.length; i++) {
    const ch = linea[i];
    if (q) {
      if (ch === '"' && linea[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === sep) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out.map(s => s.trim());
}

function importarCSV(texto) {
  texto = texto.replace(/^﻿/, '');
  const lineas = texto.split(/\r?\n/);
  const cab = lineas[0] || '';
  const sep = cab.split(';').length >= cab.split(',').length ? ';' : ',';
  const cols = parsearLineaCSV(cab, sep).map(c => c.toLowerCase());
  const idx = n => cols.indexOf(n);
  if (idx('fecha') < 0 || idx('generado') < 0 || idx('km') < 0) throw new Error('El archivo no tiene el formato de CalculaTuRuta.');

  const nuevas = [];
  let errores = 0, i = 1;
  for (; i < lineas.length; i++) {
    const l = lineas[i];
    if (!l.trim()) { if (/^ajustes/i.test((lineas[i + 1] || '').trim())) break; continue; }
    if (/^ajustes/i.test(l.trim())) break;
    const f = parsearLineaCSV(l, sep);
    const g = n => (idx(n) >= 0 ? f[idx(n)] : '');
    const nivel = (g('desgaste_nivel') || 'medio').toLowerCase();
    const plat = PLATAFORMAS.find(p => p.toLowerCase() === (g('plataforma') || '').toLowerCase()) || (g('plataforma') ? 'Otra' : 'Otra');
    const j = {
      id: g('id') || ('j' + Date.now().toString(36) + i),
      fecha: g('fecha'),
      plataforma: plat,
      generado: leerDecimal(g('generado')),
      km: leerDecimal(g('km')),
      minutos: leerDecimal(g('minutos')),
      tipoAuto: g('tipo_auto') === 'arrendado' ? 'arrendado' : 'propio',
      arriendo: leerDecimal(g('arriendo')) || 0,
      rendimiento: leerDecimal(g('rendimiento')),
      bencina: leerDecimal(g('precio_bencina')),
      desgasteNivel: NIVELES[nivel] ? nivel : 'medio',
      desgastePorKm: leerDecimal(g('desgaste_por_km')),
      descontada: !/^(no|false|0)$/i.test(g('comision_descontada')),
      comisionPct: leerDecimal(g('comision_pct')) || 0,
      creado: Date.now() - i
    };
    if (isNaN(j.desgastePorKm)) j.desgastePorKm = ajustes.desgaste[j.desgasteNivel] ?? ajustes.desgaste.medio;
    const valida = esFechaValida(j.fecha) && j.generado > 0 && j.km > 0 && j.minutos > 0 && j.rendimiento > 0 && j.bencina > 0 &&
      j.desgastePorKm >= 0 && j.arriendo >= 0 && j.comisionPct >= 0 && j.comisionPct < 100;
    if (valida) nuevas.push(j); else errores++;
  }

  // Sección de ajustes (opcional)
  let nuevosAjustes = null;
  const ini = lineas.findIndex(l => /^ajustes\s*;?\s*$/i.test(l.trim()));
  if (ini >= 0) {
    const kv = {};
    lineas.slice(ini + 1).forEach(l => {
      const [k, v] = parsearLineaCSV(l, sep);
      if (k && v !== undefined && k !== 'clave') kv[k.toLowerCase()] = leerDecimal(v);
    });
    nuevosAjustes = normalizarAjustes({
      rendimiento: kv.rendimiento, bencina: kv.precio_bencina, comision: kv.comision,
      desgaste: { bajo: kv.desgaste_bajo, medio: kv.desgaste_medio, alto: kv.desgaste_alto },
      meta: kv.meta_diaria, margen: kv.margen_conviene
    });
  }
  return { nuevas, errores, nuevosAjustes };
}

$('#a-importar').addEventListener('click', () => { $('#a-archivo').value = ''; $('#a-archivo').click(); });
$('#a-archivo').addEventListener('change', e => {
  const archivo = e.target.files && e.target.files[0];
  if (!archivo) return;
  const lector = new FileReader();
  lector.onload = () => {
    let res;
    try { res = importarCSV(String(lector.result)); }
    catch (err) { toast(err.message || 'No se pudo leer el archivo', true); return; }
    if (!res.nuevas.length && !res.nuevosAjustes) { toast('No se encontraron jornadas válidas', true); return; }
    const aplicar = reemplazar => {
      if (reemplazar) jornadas = res.nuevas;
      else {
        const mapa = new Map(jornadas.map(j => [j.id, j]));
        res.nuevas.forEach(j => mapa.set(j.id, j));
        jornadas = Array.from(mapa.values());
      }
      guardarJornadas();
      if (res.nuevosAjustes) { ajustes = res.nuevosAjustes; escribir(K.ajustes, ajustes); }
      wz.iniciado = false;
      cargarAjustes();
      toast(`${res.nuevas.length} jornadas importadas`);
    };
    abrirModal({
      titulo: 'Importar respaldo',
      html: `<p>Se encontraron <strong>${res.nuevas.length}</strong> jornadas válidas${res.errores ? ` (${res.errores} filas con errores se omitirán)` : ''}${res.nuevosAjustes ? ' y tus ajustes' : ''}.</p>
             <p class="muted">¿Qué quieres hacer con tus ${jornadas.length} jornadas actuales?</p>`,
      botones: [
        { texto: 'Agregar a las actuales', clase: 'btn-primary', accion: () => aplicar(false) },
        { texto: 'Reemplazar todo', clase: 'btn-danger', accion: () => aplicar(true) },
        { texto: 'Cancelar' }
      ]
    });
  };
  lector.onerror = () => toast('No se pudo leer el archivo', true);
  lector.readAsText(archivo, 'utf-8');
});

$('#a-borrar').addEventListener('click', async () => {
  if (!await confirmar('¿Borrar todos los datos?', `Se eliminarán tus <strong>${jornadas.length} jornadas</strong> y tus ajustes de este teléfono. Te recomendamos exportar un respaldo antes. No se puede deshacer.`, 'Sí, borrar todo', true)) return;
  [K.jornadas, K.ajustes, K.ultimo].forEach(k => { try { localStorage.removeItem(k); } catch (e) { } });
  jornadas = [];
  ajustes = normalizarAjustes({});
  ultimo = null;
  wz.iniciado = false;
  wz.editId = null;
  cargarAjustes();
  actualizarEtiquetasDesgaste();
  toast('Datos borrados');
});

/* ---------- Modal: cerrar tocando el fondo ---------- */
$('#modal').addEventListener('click', e => { if (e.target.hasAttribute('data-cerrar')) cerrarModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarModal(); });

/* ---------- Inicio de la app ---------- */
actualizarEtiquetasDesgaste();
mostrar('inicio');

// Al volver a la app (p. ej. al día siguiente), refrescar el panel
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && vistaActual === 'inicio') renderInicio();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => { });
  });
}
