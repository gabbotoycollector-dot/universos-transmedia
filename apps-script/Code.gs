/**
 * UNIVERSOS TRANSMEDIA · Portal de estudiantes · Semana C 2026C
 * Backend en Google Apps Script + Google Sheets.
 *
 * Pasos (ver README.md):
 *  1. Pega este archivo y appsscript.json en un proyecto nuevo de Apps Script.
 *  2. Ajusta CFG.SITE_URL con la URL de Cloudflare.
 *  3. Ejecuta setup() una vez (crea la hoja, la carpeta y la plantilla del certificado).
 *  4. Implementar → Nueva implementación → Aplicación web
 *     Ejecutar como: Yo · Quién tiene acceso: Cualquier persona.
 *  5. Copia la URL /exec en public/config.js (API_URL).
 */

const CFG = {
  APP_NAME: 'Universos Transmedia · Semana C 2026C',
  ALLOWED_DOMAINS: ['cun.edu.co'],          // correos permitidos
  SITE_URL: 'https://universos-transmedia.pages.dev', // ← cambia por tu URL de Cloudflare (sin / final)
  SESSION_DAYS: 7,
  SENDER_NAME: 'Profe Gabbo · Universos Transmedia',
  MAX_CERT_SENDS: 3,
  TZ: 'America/Bogota'
};

const SH = { USERS: 'Usuarios', SESS: 'Sesiones', PROG: 'Progreso', RESP: 'Respuestas', CERT: 'Certificados' };
const HEAD = {
  Usuarios: ['id', 'registro', 'nombre', 'usuario', 'correo', 'salt', 'hash', 'ultimo_acceso', 'reset_en'],
  Sesiones: ['token', 'user_id', 'creado', 'expira'],
  Progreso: ['user_id', 'usuario', 'nombre', 'correo', 'actualizado', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'avance', 'datos_json'],
  Respuestas: ['user_id', 'nombre', 'correo', 'equipo', 'tipo_semilla', 'idea', 'universo', 'logline', 'plataformas', 'prototipos', 'entradas_bitacora', 'mecanismo', 'reflexion', 'actualizado'],
  Certificados: ['codigo', 'emitido', 'user_id', 'nombre', 'correo', 'universo', 'envios', 'pdf_id']
};
const MISSIONS = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/* ======================= HTTP ======================= */
function doGet() { return json_({ ok: true, app: CFG.APP_NAME }); }

function doPost(e) {
  let req = {};
  try { req = JSON.parse((e && e.postData && e.postData.contents) || '{}'); }
  catch (err) { return json_({ ok: false, error: 'Solicitud inválida.' }); }
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const A = { register: register_, login: login_, me: me_, save: save_, certificate: certificate_, reset: reset_, logout: logout_ };
    const fn = A[req.action];
    if (!fn) return json_({ ok: false, error: 'Acción desconocida.' });
    return json_(fn(req));
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: err && err.userMsg ? err.userMsg : 'Error del servidor. Intenta de nuevo.' });
  } finally { try { lock.releaseLock(); } catch (_) {} }
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function fail_(msg) { const e = new Error(msg); e.userMsg = msg; throw e; }

/* ======================= SETUP ======================= */
function setup() {
  const P = PropertiesService.getScriptProperties();
  let ss;
  if (P.getProperty('SS_ID')) ss = SpreadsheetApp.openById(P.getProperty('SS_ID'));
  else { ss = SpreadsheetApp.create('Universos Transmedia · Registro 2026C'); P.setProperty('SS_ID', ss.getId()); }
  Object.keys(HEAD).forEach(name => {
    let sh = ss.getSheetByName(name) || ss.insertSheet(name);
    sh.getRange(1, 1, 1, HEAD[name].length).setValues([HEAD[name]]).setFontWeight('bold').setBackground('#16171B').setFontColor('#00FFA3');
    sh.setFrozenRows(1);
  });
  const def = ss.getSheetByName('Sheet1') || ss.getSheetByName('Hoja 1') || ss.getSheetByName('Hoja1');
  if (def && ss.getSheets().length > 1) ss.deleteSheet(def);
  ['salt', 'hash'].forEach(c => { const sh = ss.getSheetByName(SH.USERS); sh.hideColumns(HEAD.Usuarios.indexOf(c) + 1); });
  if (!P.getProperty('PEPPER')) P.setProperty('PEPPER', Utilities.getUuid() + Utilities.getUuid());
  let folder;
  if (P.getProperty('FOLDER_ID')) folder = DriveApp.getFolderById(P.getProperty('FOLDER_ID'));
  else { folder = DriveApp.createFolder('Universos Transmedia · Certificados 2026C'); P.setProperty('FOLDER_ID', folder.getId()); }
  DriveApp.getFileById(ss.getId()).moveTo(folder);
  if (!P.getProperty('TPL_ID')) {
    const id = buildTemplate_();
    DriveApp.getFileById(id).moveTo(folder);
    P.setProperty('TPL_ID', id);
  }
  console.log('Hoja: ' + ss.getUrl());
  console.log('Carpeta: ' + folder.getUrl());
  console.log('Plantilla del certificado: https://docs.google.com/presentation/d/' + P.getProperty('TPL_ID') + '/edit');
}

/** Vuelve a crear la plantilla del certificado (si la borraste o quieres empezar de nuevo). */
function rebuildTemplate() {
  const P = PropertiesService.getScriptProperties();
  const id = buildTemplate_();
  if (P.getProperty('FOLDER_ID')) DriveApp.getFileById(id).moveTo(DriveApp.getFolderById(P.getProperty('FOLDER_ID')));
  P.setProperty('TPL_ID', id);
  console.log('Nueva plantilla: https://docs.google.com/presentation/d/' + id + '/edit');
}

/** Envía un certificado de prueba a tu propio correo. */
function testCertificate() {
  const me = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();
  const pdf = buildPdf_('Nombre de Prueba Estudiante', 'Universo de prueba', 'UT26C-PRUEBA', fechaLarga_(new Date()));
  sendCertMail_(me, 'Nombre de Prueba', pdf, 'UT26C-PRUEBA');
  console.log('Enviado a ' + me + ' · PDF: ' + pdf.getUrl());
}

/* ======================= DATA HELPERS ======================= */
function ss_() { return SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SS_ID')); }
function rows_(name) {
  const sh = ss_().getSheetByName(name), v = sh.getDataRange().getValues(), h = v.shift();
  return { sh, h, v };
}
function find_(name, col, val) {
  const { sh, h, v } = rows_(name), c = h.indexOf(col), want = String(val).toLowerCase();
  for (let i = 0; i < v.length; i++) if (String(v[i][c]).toLowerCase() === want) return { sh, h, row: i + 2, obj: toObj_(h, v[i]) };
  return { sh, h, row: 0, obj: null };
}
function toObj_(h, r) { const o = {}; h.forEach((k, i) => o[k] = r[i]); return o; }
function upsert_(name, keyCol, obj) {
  const f = find_(name, keyCol, obj[keyCol]);
  const vals = f.h.map(k => obj[k] !== undefined ? obj[k] : (f.obj ? f.obj[k] : ''));
  if (f.row) f.sh.getRange(f.row, 1, 1, vals.length).setValues([vals]);
  else f.sh.appendRow(vals);
}
function clip_(s, n) { return String(s == null ? '' : s).slice(0, n || 3000); }
function now_() { return new Date(); }
function fechaLarga_(d) { return d.getDate() + ' de ' + MESES[d.getMonth()] + ' de ' + d.getFullYear(); }

/* ======================= AUTH ======================= */
function pepper_() { return PropertiesService.getScriptProperties().getProperty('PEPPER') || ''; }
function hash_(pw, salt) {
  let h = salt + '|' + pw + '|' + pepper_();
  for (let i = 0; i < 200; i++) h = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, h, Utilities.Charset.UTF_8));
  return h;
}
function domainOk_(mail) { const d = String(mail).split('@')[1] || ''; return CFG.ALLOWED_DOMAINS.indexOf(d.toLowerCase()) >= 0; }
function newSession_(uid) {
  const token = Utilities.getUuid() + Utilities.getUuid().slice(0, 8);
  const exp = new Date(Date.now() + CFG.SESSION_DAYS * 864e5);
  ss_().getSheetByName(SH.SESS).appendRow([token, uid, now_(), exp]);
  return token;
}
function auth_(token) {
  if (!token) fail_('Tu sesión expiró. Vuelve a ingresar.');
  const s = find_(SH.SESS, 'token', token);
  if (!s.obj || new Date(s.obj.expira) < now_()) fail_('Tu sesión expiró. Vuelve a ingresar.');
  const u = find_(SH.USERS, 'id', s.obj.user_id);
  if (!u.obj) fail_('Usuario no encontrado.');
  return u.obj;
}
function pubUser_(u) { return { id: u.id, nombre: u.nombre, usuario: u.usuario, correo: u.correo }; }

function register_(r) {
  const nombre = clip_(r.nombre, 80).trim().replace(/\s+/g, ' ');
  const usuario = clip_(r.usuario, 30).trim().toLowerCase();
  const correo = clip_(r.correo, 120).trim().toLowerCase();
  const pw = String(r.password || '');
  if (nombre.split(' ').length < 2 || nombre.length < 5) fail_('Escribe tu nombre completo (nombre y apellido), como debe aparecer en el certificado.');
  if (!/^[a-z0-9._-]{3,20}$/.test(usuario)) fail_('El usuario debe tener entre 3 y 20 caracteres: letras, números, punto, guion o guion bajo.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo) || !domainOk_(correo)) fail_('Usa tu correo institucional (@' + CFG.ALLOWED_DOMAINS.join(', @') + ').');
  if (pw.length < 6) fail_('La contraseña debe tener al menos 6 caracteres.');
  if (!r.acepta) fail_('Debes autorizar el tratamiento de tus datos para registrarte.');
  if (find_(SH.USERS, 'usuario', usuario).obj) fail_('Ese nombre de usuario ya existe. Prueba otro.');
  if (find_(SH.USERS, 'correo', correo).obj) fail_('Ese correo ya está registrado. Ingresa o recupera tu contraseña.');
  const id = Utilities.getUuid().slice(0, 8), salt = Utilities.getUuid();
  ss_().getSheetByName(SH.USERS).appendRow([id, now_(), nombre, usuario, correo, salt, hash_(pw, salt), now_(), '']);
  const u = { id, nombre, usuario, correo };
  return { ok: true, token: newSession_(id), user: u, progress: {}, status: statusOf_({}), cert: null };
}

function login_(r) {
  const idf = clip_(r.usuario, 120).trim().toLowerCase();
  const f = find_(SH.USERS, idf.indexOf('@') > 0 ? 'correo' : 'usuario', idf);
  if (!f.obj || hash_(String(r.password || ''), f.obj.salt) !== f.obj.hash) fail_('Usuario o contraseña incorrectos.');
  f.sh.getRange(f.row, f.h.indexOf('ultimo_acceso') + 1).setValue(now_());
  return Object.assign({ ok: true, token: newSession_(f.obj.id) }, payload_(f.obj));
}
function logout_(r) { const s = find_(SH.SESS, 'token', r.token || '-'); if (s.row) s.sh.deleteRow(s.row); return { ok: true }; }
function me_(r) { return Object.assign({ ok: true }, payload_(auth_(r.token))); }

function payload_(u) {
  const p = find_(SH.PROG, 'user_id', u.id).obj;
  const progress = p && p.datos_json ? JSON.parse(p.datos_json) : {};
  const c = find_(SH.CERT, 'user_id', u.id).obj;
  return { user: pubUser_(u), progress, status: statusOf_(progress), cert: c ? { codigo: c.codigo, emitido: c.emitido } : null };
}

function reset_(r) {
  const correo = clip_(r.correo, 120).trim().toLowerCase();
  const f = find_(SH.USERS, 'correo', correo);
  if (f.obj) {
    const last = f.obj.reset_en ? new Date(f.obj.reset_en).getTime() : 0;
    if (Date.now() - last > 10 * 60 * 1000) {
      const tmp = Utilities.getUuid().replace(/-/g, '').slice(0, 8);
      const salt = Utilities.getUuid();
      f.sh.getRange(f.row, f.h.indexOf('salt') + 1, 1, 2).setValues([[salt, hash_(tmp, salt)]]);
      f.sh.getRange(f.row, f.h.indexOf('reset_en') + 1).setValue(now_());
      MailApp.sendEmail({
        to: correo, name: CFG.SENDER_NAME, subject: 'Tu contraseña temporal · Universos Transmedia',
        htmlBody: mailWrap_(`<p>Hola ${esc_(f.obj.nombre)},</p><p>Tu contraseña temporal es:</p><p style="font:700 22px monospace;color:#00FFA3;letter-spacing:2px">${tmp}</p><p>Tu usuario es <b>${esc_(f.obj.usuario)}</b>. Ingresa al portal con esta contraseña.</p><p><a style="color:#00F0FF" href="${CFG.SITE_URL}/alumno/">Ir al portal</a></p>`)
      });
    }
  }
  return { ok: true, msg: 'Si el correo está registrado, recibirás una contraseña temporal en unos minutos.' };
}

/* ======================= PROGRESS ======================= */
const filled_ = v => String(v == null ? '' : v).trim().length > 0;
const words_ = s => String(s || '').trim().split(/\s+/).filter(Boolean).length;
const url_ = s => /^https?:\/\/\S+\.\S+/.test(String(s || '').trim());
function statusOf_(p) {
  p = p || {};
  const m1 = p.m1 || {}, m2 = p.m2 || {}, m3 = p.m3 || {}, m4 = p.m4 || {}, m5 = p.m5 || {}, m6 = p.m6 || {};
  const s = {
    m1: ['equipo', 'tipo', 'idea', 'proposito', 'audiencia'].every(k => filled_(m1[k])) && String(m1.idea).trim().length >= 20,
    m2: ['nombre', 'logline', 'mundo', 'personajes', 'conflicto', 'reglas', 'misterios', 'estetica'].every(k => filled_(m2[k])) && words_(m2.logline) <= 45,
    m3: (m3.plataformas || []).filter(x => ['plat', 'fun', 'cont', 'nueva', 'rel', 'part', 'obj'].every(k => filled_(x && x[k]))).length >= 3,
    m4: (m4.prototipos || []).filter(x => x && filled_(x.titulo) && filled_(x.descripcion) && url_(x.enlace)).length >= 3,
    m5: (m5.entradas || []).filter(x => x && ['herramienta', 'prompt', 'resultado', 'decision'].every(k => filled_(x[k]))).length >= 2,
    m6: filled_(m6.mecanismo) && String(m6.reflexion || '').trim().length >= 30
  };
  s.done = MISSIONS.filter(k => s[k]).length;
  return s;
}
function sanitize_(v, depth) {
  depth = depth || 0;
  if (depth > 4) return null;
  if (Array.isArray(v)) return v.slice(0, 8).map(x => sanitize_(x, depth + 1));
  if (v && typeof v === 'object') { const o = {}; Object.keys(v).slice(0, 30).forEach(k => o[clip_(k, 30)] = sanitize_(v[k], depth + 1)); return o; }
  if (typeof v === 'boolean' || typeof v === 'number') return v;
  return clip_(v, 3000);
}
function save_(r) {
  const u = auth_(r.token);
  if (MISSIONS.indexOf(r.mission) < 0) fail_('Misión inválida.');
  const f = find_(SH.PROG, 'user_id', u.id);
  const p = f.obj && f.obj.datos_json ? JSON.parse(f.obj.datos_json) : {};
  p[r.mission] = sanitize_(r.data || {});
  const st = statusOf_(p), t = now_();
  const row = { user_id: u.id, usuario: u.usuario, nombre: u.nombre, correo: u.correo, actualizado: t, avance: Math.round(st.done / 6 * 100) + '%', datos_json: JSON.stringify(p) };
  MISSIONS.forEach(k => row[k] = st[k] ? '✓' : '');
  upsert_(SH.PROG, 'user_id', row);
  const m1 = p.m1 || {}, m2 = p.m2 || {}, m6 = p.m6 || {};
  upsert_(SH.RESP, 'user_id', {
    user_id: u.id, nombre: u.nombre, correo: u.correo, equipo: m1.equipo || '', tipo_semilla: m1.tipo || '', idea: m1.idea || '',
    universo: m2.nombre || '', logline: m2.logline || '',
    plataformas: ((p.m3 || {}).plataformas || []).filter(x => x && x.plat).map(x => x.plat + (x.fun ? ' → ' + x.fun : '')).join(' | '),
    prototipos: ((p.m4 || {}).prototipos || []).filter(x => x && x.titulo).map(x => (x.tipo || '') + ': ' + x.titulo + ' ' + (x.enlace || '')).join('\n'),
    entradas_bitacora: ((p.m5 || {}).entradas || []).filter(x => x && x.herramienta).length,
    mecanismo: m6.mecanismo || '', reflexion: m6.reflexion || '', actualizado: t
  });
  return { ok: true, status: st, saved: t };
}

/* ======================= CERTIFICATE ======================= */
function certificate_(r) {
  const u = auth_(r.token);
  const pr = find_(SH.PROG, 'user_id', u.id).obj;
  const p = pr && pr.datos_json ? JSON.parse(pr.datos_json) : {};
  const st = statusOf_(p);
  if (st.done < 6) fail_('Aún te faltan misiones por completar (' + st.done + '/6).');
  const universo = clip_(((p.m2 || {}).nombre || 'Mi universo'), 80);
  let c = find_(SH.CERT, 'user_id', u.id);
  let codigo, emitido, envios = 0;
  if (c.obj) {
    codigo = c.obj.codigo; emitido = new Date(c.obj.emitido); envios = Number(c.obj.envios) || 0;
    if (envios >= CFG.MAX_CERT_SENDS) fail_('Ya enviamos tu certificado ' + envios + ' veces. Revisa tu correo (y la carpeta de spam) o escribe al tallerista.');
  } else {
    codigo = 'UT26C-' + Utilities.getUuid().replace(/-/g, '').slice(0, 6).toUpperCase(); emitido = now_();
  }
  const pdf = buildPdf_(u.nombre, universo, codigo, fechaLarga_(emitido));
  sendCertMail_(u.correo, u.nombre, pdf, codigo);
  upsert_(SH.CERT, 'user_id', { codigo, emitido, user_id: u.id, nombre: u.nombre, correo: u.correo, universo, envios: envios + 1, pdf_id: pdf.getId() });
  return { ok: true, cert: { codigo, emitido }, msg: 'Enviamos tu certificado a ' + u.correo + '.' };
}

function buildPdf_(nombre, universo, codigo, fecha) {
  const P = PropertiesService.getScriptProperties();
  const folder = DriveApp.getFolderById(P.getProperty('FOLDER_ID'));
  const copy = DriveApp.getFileById(P.getProperty('TPL_ID')).makeCopy('tmp ' + codigo, folder);
  const pres = SlidesApp.openById(copy.getId());
  pres.replaceAllText('{{NOMBRE}}', nombre);
  pres.replaceAllText('{{UNIVERSO}}', universo);
  pres.replaceAllText('{{FECHA}}', fecha);
  pres.replaceAllText('{{CODIGO}}', codigo);
  pres.saveAndClose();
  const blob = copy.getAs('application/pdf').setName('Certificado ' + codigo + ' - ' + nombre + '.pdf');
  const file = folder.createFile(blob);
  copy.setTrashed(true);
  return file;
}

function sendCertMail_(to, nombre, file, codigo) {
  MailApp.sendEmail({
    to, name: CFG.SENDER_NAME,
    subject: 'Tu certificado · Universos Transmedia · Semana C 2026C',
    htmlBody: mailWrap_(`<p>¡Hola ${esc_(String(nombre).split(' ')[0])}!</p><p>Completaste las seis misiones del laboratorio <b>Universos transmedia: expansión de contenidos potenciada por IA</b>. Adjunto encontrarás tu certificado de participación en PDF.</p><p style="font:12px monospace;color:#A0A0A0">Código de verificación: <span style="color:#00FFA3">${codigo}</span></p><p>El universo apenas comienza.<br><b>Profe Gabbo</b></p>`),
    attachments: [file.getBlob()]
  });
}
function mailWrap_(inner) {
  return `<div style="background:#08090A;padding:28px;font-family:Arial,sans-serif;color:#F0F4F8;font-size:15px;line-height:1.5"><div style="max-width:560px;margin:auto;border:1px solid #00FFA3;border-radius:14px;padding:24px;background:#16171B"><div style="font:12px monospace;color:#00FFA3;margin-bottom:14px">// UNIVERSOS TRANSMEDIA · SEMANA C 2026C</div>${inner}<div style="border-top:1px solid #2a2b31;margin-top:18px;padding-top:12px;font:11px monospace;color:#666">CUN / Escuela de Diseño y Comunicación · Programa de Diseño Gráfico</div></div></div>`;
}
function esc_(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

/* ======================= TEMPLATE (Google Slides, editable) ======================= */
function buildTemplate_() {
  const pres = SlidesApp.create('Plantilla certificado · Universos Transmedia 2026C');
  const s = pres.getSlides()[0];
  s.getPageElements().forEach(e => e.remove());
  s.getBackground().setSolidFill('#08090A');
  const W = pres.getPageWidth(), H = pres.getPageHeight(); // 720 x 405
  const glow = (x, y, r, col) => [1, .72, .48].forEach((k, i) => { const sh = s.insertShape(SlidesApp.ShapeType.ELLIPSE, x - r * k, y - r * k, 2 * r * k, 2 * r * k); sh.getFill().setSolidFill(col, [.07, .08, .1][i]); sh.getBorder().setTransparent(); });
  glow(30, H + 20, 230, '#00FFA3');
  glow(W - 40, -30, 250, '#9D00FF');
  glow(W + 10, H + 10, 180, '#00F0FF');
  const tx = (t, x, y, w, h, o) => {
    const b = s.insertTextBox(t, x, y, w, h), st = b.getText().getTextStyle();
    st.setFontFamily(o.f || 'Space Grotesk').setFontSize(o.s || 11).setForegroundColor(o.c || '#F0F4F8').setBold(!!o.b);
    if (o.a) b.getText().getParagraphStyle().setParagraphAlignment(o.a);
    if (o.ls) b.getText().getParagraphStyle().setLineSpacing(o.ls);
    b.setContentAlignment(o.v || SlidesApp.ContentAlignment.TOP);
    return b;
  };
  const R = SlidesApp.ParagraphAlignment;
  // logo + header
  try { s.insertImage(UrlFetchApp.fetch(CFG.SITE_URL + '/img/cun.png').getBlob(), 40, 30, 74, 22); } catch (e) { tx('CUN', 40, 28, 80, 24, { f: 'Bricolage Grotesque', s: 16, b: true }); }
  tx('SEMANA C // DISEÑO GRÁFICO', 124, 32, 240, 18, { f: 'JetBrains Mono', s: 8.5, c: '#00FFA3', b: true });
  const tag = s.insertShape(SlidesApp.ShapeType.RECTANGLE, W - 210, 28, 170, 22);
  tag.getFill().setSolidFill('#E4007C', .12); tag.getBorder().getLineFill().setSolidFill('#E4007C'); tag.getBorder().setWeight(.75);
  tag.getText().setText('MASTERCLASS + LABORATORIO'); tag.getText().getTextStyle().setFontFamily('JetBrains Mono').setFontSize(7.5).setForegroundColor('#FF7AC0');
  tag.getText().getParagraphStyle().setParagraphAlignment(R.CENTER); tag.setContentAlignment(SlidesApp.ContentAlignment.MIDDLE);
  // body
  tx('// CERTIFICADO DE PARTICIPACIÓN', 40, 92, 420, 18, { f: 'Silkscreen', s: 9, c: '#00FFA3' });
  tx('Se certifica que', 40, 114, 420, 20, { s: 12, c: '#A0A0A0' });
  tx('{{NOMBRE}}', 40, 136, 470, 70, { f: 'Bricolage Grotesque', s: 30, b: true, c: '#F5F0E6', ls: 90 });
  tx('participó y completó el taller', 40, 212, 420, 18, { s: 11, c: '#A0B0C0' });
  tx('UNIVERSOS TRANSMEDIA', 40, 230, 470, 30, { f: 'Boldonse', s: 18, c: '#00F0FF' });
  tx('Expansión de contenidos potenciada por IA · Masterclass + laboratorio · 4 horas', 40, 262, 470, 18, { s: 10.5, c: '#F0F4F8' });
  tx('Creó el universo narrativo «{{UNIVERSO}}», con biblia narrativa, mapa transmedia, tres prototipos y bitácora de IA.', 40, 282, 450, 34, { s: 9.5, c: '#A0B0C0', ls: 115 });
  // gabbo
  try { s.insertImage(UrlFetchApp.fetch(CFG.SITE_URL + '/img/cert-gabbo.png').getBlob(), W - 250, 70, 210, 252); } catch (e) {}
  // footer
  s.insertLine(SlidesApp.LineCategory.STRAIGHT, 40, H - 70, W - 40, H - 70).getLineFill().setSolidFill('#2A2B31');
  tx('TALLERISTA', 40, H - 62, 200, 14, { f: 'JetBrains Mono', s: 7, c: '#A0A0A0' });
  tx('PROFE GABBO', 40, H - 50, 260, 20, { f: 'Bricolage Grotesque', s: 14, b: true });
  tx('Gabriel Antolínez · Programa de Diseño Gráfico', 40, H - 32, 300, 14, { f: 'JetBrains Mono', s: 7, c: '#666666' });
  tx('CUN / Escuela de Diseño y Comunicación\nPrograma de Diseño Gráfico · Semana C 2026C', W - 340, H - 62, 300, 26, { f: 'JetBrains Mono', s: 7, c: '#00F0FF', a: R.END });
  tx('{{FECHA}} · Código {{CODIGO}}', W - 340, H - 34, 300, 14, { f: 'JetBrains Mono', s: 7, c: '#A0A0A0', a: R.END });
  pres.saveAndClose();
  return pres.getId();
}
