(() => {
'use strict';
const CFG = window.UT_CONFIG || {};
const API = (CFG.API_URL || '').trim();
const DOMAINS = CFG.DOMAINS || ['cun.edu.co'];
const DEMO = !API;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const LS = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }, del(k) { try { localStorage.removeItem(k); } catch (e) {} } };

let tt;
function toast(msg, err) { const t = $('#toast'); t.textContent = msg; t.className = 'toast show' + (err ? ' err' : ''); clearTimeout(tt); tt = setTimeout(() => t.className = 'toast', 3200); }

/* ===================== status rules (same as server) ===================== */
const filled = v => String(v == null ? '' : v).trim().length > 0;
const words = s => String(s || '').trim().split(/\s+/).filter(Boolean).length;
const isUrl = s => /^https?:\/\/\S+\.\S+/.test(String(s || '').trim());
const PF = ['plat', 'fun', 'cont', 'nueva', 'rel', 'part', 'obj'];
function statusOf(p) {
  p = p || {}; const m1 = p.m1 || {}, m2 = p.m2 || {}, m3 = p.m3 || {}, m4 = p.m4 || {}, m5 = p.m5 || {}, m6 = p.m6 || {};
  const s = {
    m1: ['equipo', 'tipo', 'idea', 'proposito', 'audiencia'].every(k => filled(m1[k])) && String(m1.idea).trim().length >= 20,
    m2: ['nombre', 'logline', 'mundo', 'personajes', 'conflicto', 'reglas', 'misterios', 'estetica'].every(k => filled(m2[k])) && words(m2.logline) <= 45,
    m3: (m3.plataformas || []).filter(x => PF.every(k => filled(x && x[k]))).length >= 3,
    m4: (m4.prototipos || []).filter(x => x && filled(x.titulo) && filled(x.descripcion) && isUrl(x.enlace)).length >= 3,
    m5: (m5.entradas || []).filter(x => x && ['herramienta', 'prompt', 'resultado', 'decision'].every(k => filled(x[k]))).length >= 2,
    m6: filled(m6.mecanismo) && String(m6.reflexion || '').trim().length >= 30
  };
  s.done = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'].filter(k => s[k]).length;
  return s;
}

/* ===================== API (real or demo) ===================== */
async function api(action, payload = {}) {
  if (DEMO) return demoApi(action, payload);
  const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ action }, payload)), redirect: 'follow' });
  if (!r.ok) throw new Error('No hay conexión con el servidor (' + r.status + ').');
  const j = await r.json();
  if (!j.ok) { const e = new Error(j.error || 'Error'); e.server = true; throw e; }
  return j;
}
function demoApi(action, p) {
  const db = LS.get('ut-demo-db', { users: {}, prog: {}, cert: {} });
  const fail = m => { const e = new Error(m); e.server = true; throw e; };
  const out = o => { LS.set('ut-demo-db', db); return Promise.resolve(Object.assign({ ok: true }, o)); };
  const pay = u => ({ user: u, progress: db.prog[u.id] || {}, status: statusOf(db.prog[u.id]), cert: db.cert[u.id] || null });
  const byTok = t => Object.values(db.users).find(u => u.token === t) || fail('Tu sesión expiró.');
  if (action === 'register') {
    if (Object.values(db.users).some(u => u.usuario === p.usuario || u.correo === p.correo)) fail('Ese usuario o correo ya existe.');
    const u = { id: Math.random().toString(36).slice(2, 10), nombre: p.nombre, usuario: p.usuario, correo: p.correo, pw: p.password, token: 'demo-' + Date.now() };
    db.users[u.id] = u; return out(Object.assign({ token: u.token }, pay(u)));
  }
  if (action === 'login') { const u = Object.values(db.users).find(u => (u.usuario === p.usuario || u.correo === p.usuario) && u.pw === p.password) || fail('Usuario o contraseña incorrectos.'); u.token = 'demo-' + Date.now(); return out(Object.assign({ token: u.token }, pay(u))); }
  if (action === 'me') return out(pay(byTok(p.token)));
  if (action === 'save') { const u = byTok(p.token); db.prog[u.id] = db.prog[u.id] || {}; db.prog[u.id][p.mission] = p.data; return out({ status: statusOf(db.prog[u.id]), saved: new Date().toISOString() }); }
  if (action === 'certificate') { const u = byTok(p.token); if (statusOf(db.prog[u.id]).done < 6) fail('Aún te faltan misiones.'); db.cert[u.id] = db.cert[u.id] || { codigo: 'UT26C-DEMO' + Math.floor(Math.random() * 90 + 10), emitido: new Date().toISOString() }; return out({ cert: db.cert[u.id], msg: 'Modo demostración: en el portal conectado, el PDF llegaría a ' + u.correo + '.' }); }
  if (action === 'reset') return out({ msg: 'Modo demostración: aquí llegaría la contraseña temporal.' });
  if (action === 'logout') return out({});
  return fail('Acción desconocida');
}

/* ===================== session ===================== */
let S = LS.get('ut-alumno', null); // {token,user}
let P = {}, ST = statusOf({}), CERT = null, cur = 'm1';
function setSession(r) {
  S = { token: r.token || S.token, user: r.user }; LS.set('ut-alumno', S);
  const draft = LS.get('ut-draft-' + r.user.id, {});
  P = Object.assign({}, r.progress || {});
  // keep local drafts that are newer than server (offline edits)
  Object.keys(draft).forEach(k => { if (draft[k] && draft[k]._t && (!P[k] || !P[k]._t || draft[k]._t > P[k]._t)) P[k] = draft[k]; });
  ST = statusOf(P); CERT = r.cert || null;
}

/* ===================== AUTH VIEW ===================== */
function showAuth() {
  $('#authView').hidden = false; $('#appView').hidden = true; $('#who').hidden = true;
  const img = $('.p-img'), pt = $('#portrait');
  addEventListener('mousemove', e => { if ($('#authView').hidden) return; const r = pt.getBoundingClientRect(); const x = (e.clientX - r.left - r.width / 2) / r.width, y = (e.clientY - r.top - r.height / 2) / r.height; img.style.transform = `translateX(-50%) rotateY(${Math.max(-1, Math.min(1, x)) * 10}deg) rotateX(${-Math.max(-1, Math.min(1, y)) * 6}deg)`; });
}
function tab(t) {
  $$('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
  $('#fLogin').hidden = t !== 'login'; $('#fRegister').hidden = t !== 'register'; $('#fReset').hidden = t !== 'reset';
  msg('');
  $('#authSay').textContent = { login: '¡Hola! Soy el Profe Gabbo. Antes de construir universos, necesito saber quién eres.', register: 'Usa tu correo de la CUN y escribe tu nombre tal como quieres verlo en tu certificado.', reset: 'Tranqui, a todos se nos olvida. Te mando una contraseña temporal al correo.' }[t];
}
$$('.tabs button').forEach(b => b.onclick = () => tab(b.dataset.tab));
$('#toReset').onclick = () => tab('reset');
$('#backLogin').onclick = () => tab('login');
function msg(t, ok) { const m = $('#authMsg'); m.textContent = t; m.className = 'msg ' + (t ? (ok ? 'ok' : 'err') : ''); }
async function busy(btn, fn) { const h = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spin"></span>'; try { await fn(); } catch (e) { msg(e.server ? e.message : 'No pudimos conectar con el servidor. Revisa tu internet e intenta de nuevo.'); } finally { btn.disabled = false; btn.innerHTML = h; } }
$('#fLogin').onsubmit = e => { e.preventDefault(); const f = new FormData(e.target); busy($('button[type=submit]', e.target), async () => { const r = await api('login', { usuario: f.get('usuario').trim().toLowerCase(), password: f.get('password') }); setSession(r); enter(); }); };
$('#fRegister').onsubmit = e => {
  e.preventDefault(); const f = new FormData(e.target);
  const nombre = f.get('nombre').trim().replace(/\s+/g, ' '), usuario = f.get('usuario').trim().toLowerCase(), correo = f.get('correo').trim().toLowerCase();
  if (nombre.split(' ').length < 2) return msg('Escribe tu nombre completo (nombre y apellido).');
  if (!DOMAINS.includes(correo.split('@')[1] || '')) return msg('Usa tu correo institucional (@' + DOMAINS.join(', @') + ').');
  if (f.get('password') !== f.get('password2')) return msg('Las contraseñas no coinciden.');
  busy($('button[type=submit]', e.target), async () => { const r = await api('register', { nombre, usuario, correo, password: f.get('password'), acepta: !!f.get('acepta') }); setSession(r); enter(true); });
};
$('#fReset').onsubmit = e => { e.preventDefault(); const f = new FormData(e.target); busy($('button[type=submit]', e.target), async () => { const r = await api('reset', { correo: f.get('correo').trim().toLowerCase() }); msg(r.msg, true); }); };
$('#logout').onclick = async () => { try { await api('logout', { token: S && S.token }); } catch (e) {} LS.del('ut-alumno'); S = null; location.reload(); };

/* ===================== MISSIONS ===================== */
const SEEDS = ['Una marca o emprendimiento', 'Una historia de ficción', 'Un personaje original', 'Una problemática social o cultural', 'Un proyecto educativo', 'Una iniciativa ambiental o comunitaria', 'Una experiencia turística o cultural'];
const M = [
  { id: 'm1', n: '01', t: 'La semilla creativa', sub: 'Idea central', col: '#00FFA3', img: 'tablet', lead: 'Elige el tipo de semilla y formula tu idea central en máximo tres líneas. Identifica su propósito y su audiencia.', say: ['Todo universo empieza con una semilla. Tres líneas, ni una más.', 'Si te bloqueas, piensa: ¿qué secreto guarda tu idea?'] },
  { id: 'm2', n: '02', t: 'Construye tu universo', sub: 'Biblia narrativa', col: '#00F0FF', img: 'dibuja', lead: 'Desarrolla la biblia narrativa con apoyo de IA. Usa el prompt 01, pero tú decides qué entra al canon.', say: ['La IA te va a dar mucho texto. Tú eliges, recortas y corriges.', 'Si tu logline pasa de 40 palabras, todavía no sabes de qué trata tu historia.'] },
  { id: 'm3', n: '03', t: 'Diseña la expansión', sub: 'Mapa transmedia', col: '#B04DFF', img: 'v-explorador', lead: 'Mínimo tres plataformas. Cada una cumple una función narrativa distinta y aporta información nueva.', say: ['Si dos plataformas cuentan lo mismo, no es un universo: es un eco.', 'Piensa el recorrido: ¿por dónde entra el público y a dónde lo llevas después?'] },
  { id: 'm4', n: '04', t: 'Produce con IA', sub: 'Tres prototipos', col: '#00FFA3', img: 'camara', lead: 'Una pieza visual, una audiovisual y una digital o interactiva. Sube cada una a Drive, Canva o Figma y pega el enlace (con acceso de lectura).', say: ['Misma identidad visual, funciones narrativas distintas.', 'Revisa que tus enlaces se puedan abrir sin pedir permiso.'] },
  { id: 'm5', n: '05', t: 'Bitácora de IA', sub: 'Prompts y decisiones', col: '#E4007C', img: 'escritorio-hacker', lead: 'Registra al menos dos momentos en los que usaste IA: qué pediste, qué elegiste y qué decidiste cambiar tú.', say: ['La bitácora demuestra que el piloto eres tú, no la máquina.', 'Lo más valioso es la columna “decisión humana”.'] },
  { id: 'm6', n: '06', t: 'Conecta y presenta', sub: 'Participación y cierre', col: '#00F0FF', img: 'selfie', lead: 'Define cómo participa la audiencia en tu universo y comparte una decisión creativa que tomaste con criterio humano.', say: ['¿Qué puede hacer el público dentro de tu universo? Ahí está la magia.', 'Cuéntame una decisión que tomaste tú y no la IA.'] },
  { id: 'cert', n: '★', t: 'Tu certificado', sub: 'PDF a tu correo', col: '#F5F0E6', img: 'dab', lead: 'Cuando completes las seis misiones, genera tu certificado de participación. Te llegará en PDF a tu correo institucional.', say: ['¡Casi! Completa las seis misiones y el certificado es tuyo.'] }
];
const mById = id => M.find(m => m.id === id);

function enter(isNew) {
  $('#authView').hidden = true; $('#appView').hidden = false; $('#who').hidden = false;
  $('#whoName').textContent = S.user.nombre.split(' ')[0];
  $('#avatar').textContent = S.user.nombre.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const first = M.find(m => m.id !== 'cert' && !ST[m.id]);
  go(LS.get('ut-cur', null) || (first ? first.id : 'cert'));
  if (isNew) toast('¡Bienvenido/a al universo, ' + S.user.nombre.split(' ')[0] + '!');
}
function renderNav() {
  $('#nav').innerHTML = M.map(m => `<button class="nv ${m.id === cur ? 'on' : ''} ${ST[m.id] || (m.id === 'cert' && CERT) ? 'done' : ''}" data-id="${m.id}" style="--nc:${m.col}"><span class="d">${ST[m.id] || (m.id === 'cert' && CERT) ? '✓' : m.n}</span><div><b>${m.t}</b><span>${m.sub}</span></div></button>`).join('');
  $$('.nv').forEach(b => b.onclick = () => go(b.dataset.id));
  $('#pbar').style.width = (ST.done / 6 * 100) + '%';
  $('#ptxt').textContent = `${ST.done} / 6 misiones`;
}
function go(id) {
  if (!mById(id)) id = 'm1';
  cur = id; LS.set('ut-cur', id);
  const m = mById(id);
  document.documentElement.style.setProperty('--acc', m.col === '#F5F0E6' ? '#00FFA3' : m.col);
  renderNav();
  const st = $('#stage');
  st.innerHTML = `<div class="mhead"><div><div class="silk">// ${id === 'cert' ? 'CIERRE' : 'MISIÓN ' + m.n} · ${m.sub.toUpperCase()}</div><h2>${m.t}</h2><p class="lead">${m.lead}</p></div><div class="guide"><div class="bubble" id="gsay"></div><img src="../img/${m.img}.webp" alt="Profe Gabbo" id="gimg"></div></div><div id="body"></div>`;
  let li = 0; const say = t => { $('#gsay').textContent = t; };
  say(ST[id] ? '¡Misión cumplida! Puedes seguir ajustando o pasar a la siguiente.' : m.say[0]);
  $('#gimg').onclick = () => { li = (li + 1) % m.say.length; say(m.say[li]); $('#gimg').animate([{ transform: 'scale(1)' }, { transform: 'scale(1.05,.95)' }, { transform: 'scale(.98,1.04) translateY(-8px)' }, { transform: 'scale(1)' }], { duration: 450 }); };
  (RENDER[id] || (() => {}))($('#body'));
  scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------- data binding ---------- */
function getPath(path) { return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), P); }
function setPath(path, val) { const ks = path.split('.'); let o = P; ks.slice(0, -1).forEach((k, i) => { if (o[k] == null) o[k] = /^\d+$/.test(ks[i + 1]) ? [] : {}; o = o[k]; }); o[ks[ks.length - 1]] = val; }
function bind(root) {
  $$('[data-p]', root).forEach(el => {
    const v = getPath(el.dataset.p); if (v != null) el.value = v;
    el.addEventListener('input', () => { setPath(el.dataset.p, el.value); changed(); });
    el.addEventListener('change', () => { setPath(el.dataset.p, el.value); changed(); });
  });
}
const field = (p, label, o = {}) => `<label class="${o.full ? 'full' : ''}">${label}${o.hint ? ` <small>${o.hint}</small>` : ''}${o.ta ? `<textarea data-p="${p}" placeholder="${esc(o.ph || '')}" ${o.max ? `maxlength="${o.max}"` : ''} rows="${o.rows || 3}"></textarea>` : o.opts ? `<select data-p="${p}"><option value="">Elegir…</option>${o.opts.map(x => `<option>${esc(x)}</option>`).join('')}</select>` : `<input data-p="${p}" placeholder="${esc(o.ph || '')}" ${o.list ? `list="${o.list}"` : ''} ${o.type ? `type="${o.type}"` : ''}>`}${o.count ? `<div class="counter" data-count="${p}" data-max="${o.count}" data-unit="${o.unit || 'c'}"></div>` : ''}</label>`;
function counters(root) { $$('[data-count]', root).forEach(c => { const v = String(getPath(c.dataset.count) || ''); const n = c.dataset.unit === 'w' ? words(v) : v.length, max = +c.dataset.max; c.textContent = `${n} / ${max} ${c.dataset.unit === 'w' ? 'palabras' : 'caracteres'}`; c.classList.toggle('bad', n > max); }); }

/* ---------- saving ---------- */
let saveT, saving = false, dirty = new Set();
function changed() {
  P[cur] = P[cur] || {}; P[cur]._t = Date.now(); dirty.add(cur);
  LS.set('ut-draft-' + S.user.id, P);
  const before = ST[cur]; ST = statusOf(P);
  counters($('#body')); refreshFoot(); if (before !== ST[cur]) { renderNav(); if (ST[cur]) celebrate(); }
  setSaved('Cambios sin guardar…');
  clearTimeout(saveT); saveT = setTimeout(saveNow, 2000);
}
async function saveNow() {
  if (saving || !dirty.size) return; saving = true;
  const list = [...dirty]; dirty.clear();
  setSaved('<span class="spin"></span> Guardando…');
  try {
    for (const k of list) { const r = await api('save', { token: S.token, mission: k, data: P[k] }); ST = r.status || statusOf(P); }
    const t = new Date(); setSaved(`Guardado ✓ ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`); renderNav();
  } catch (e) {
    list.forEach(k => dirty.add(k));
    if (e.server && /sesión/i.test(e.message)) { toast(e.message, true); setTimeout(() => { LS.del('ut-alumno'); location.reload(); }, 1600); }
    else { setSaved('Sin conexión · guardado en este navegador'); clearTimeout(saveT); saveT = setTimeout(saveNow, 8000); }
  } finally { saving = false; }
}
addEventListener('beforeunload', e => { if (dirty.size) { saveNow(); e.preventDefault(); e.returnValue = ''; } });
function setSaved(h) { const s = $('#saved'); if (s) s.innerHTML = h; }
function celebrate() { const g = $('#gsay'); if (g) g.textContent = '¡Misión cumplida! ' + (cur === 'm6' ? 'Ya puedes pedir tu certificado.' : 'Vamos por la siguiente.'); toast('Misión ' + mById(cur).n + ' completada ✓'); }
function foot(reqHtml) {
  const i = M.findIndex(m => m.id === cur), next = M[i + 1];
  return `<div class="foot"><div><div class="saved" id="saved">${dirty.size ? 'Cambios sin guardar…' : ''}</div><div class="req" id="req">${reqHtml || ''}</div></div><div class="row" style="display:flex;gap:10px"><button class="btn ghost" id="bSave">Guardar</button>${next ? `<button class="btn" id="bNext">Siguiente: ${next.t} →</button>` : ''}</div></div>`;
}
let reqFn = null;
function refreshFoot() { const r = $('#req'); if (r && reqFn) r.innerHTML = reqFn(); }
function wireFoot() { $('#bSave').onclick = () => { dirty.add(cur); saveNow(); }; const n = $('#bNext'); if (n) n.onclick = () => { saveNow(); go(M[M.findIndex(m => m.id === cur) + 1].id); }; }
const chip = (ok, t) => `<span class="${ok ? 'ok' : ''}">${ok ? '✓' : '○'} ${t}</span>`;

/* ---------- prompts ---------- */
const PROMPTS = {
  '01': v => `Actúa como un director creativo especializado en storytelling, worldbuilding y narrativas transmedia.\n\nNecesito convertir la siguiente idea en un universo narrativo original:\n\nIDEA CENTRAL: ${v.idea || '[Escribir aquí]'}\nPÚBLICO OBJETIVO: ${v.aud || '[Describir]'}\nPROPÓSITO: ${v.prop || '[Entretenimiento, educación, comunicación, publicidad, cultura, etc.]'}\nTONO: ${v.tono || '[Cinematográfico, documental, fantástico, humorístico, futurista, etc.]'}\n\nDesarrolla:\n1. Nombre y concepto del universo.\n2. Logline de máximo 40 palabras.\n3. Sinopsis general.\n4. Descripción del mundo y sus reglas.\n5. Tres personajes con motivaciones y conflictos.\n6. Línea temporal de acontecimientos.\n7. Cinco elementos narrativos que puedan expandirse.\n8. Identidad estética y dirección de arte.\n9. Tres misterios o interrogantes que permitan desarrollar nuevas historias.\n\nNo quiero una historia cerrada. Necesito un universo con potencial de crecimiento y expansión narrativa.\n\nPresenta el resultado como una biblia narrativa profesional.`,
  '02': v => `${v.ctx}Actúa como un estratega transmedia y director de contenidos digitales.\n\nUtiliza el universo narrativo que hemos construido y diseña un ecosistema de expansión en cinco plataformas o medios diferentes.\n\nPara cada medio determina:\n- Plataforma o formato.\n- Función narrativa.\n- Contenido específico.\n- Información nueva que descubrirá el público.\n- Relación con las demás plataformas.\n- Nivel de participación de la audiencia.\n- Objetivo comunicacional.\n\nCONDICIÓN IMPORTANTE:\nNinguna plataforma debe limitarse a reproducir el contenido de otra. Cada una debe aportar información, perspectiva o experiencia nueva.\n\nDiseña un recorrido para el usuario que permita entrar al universo desde diferentes plataformas sin perder la comprensión de la historia.\n\nPresenta la propuesta en una matriz de expansión transmedia.`,
  '03': v => `${v.ctx}Actúa como un equipo multidisciplinario de producción creativa compuesto por director audiovisual, diseñador gráfico, guionista y estratega digital.\n\nNecesito producir un prototipo de contenido para una de las plataformas de mi universo transmedia.\n\nPLATAFORMA: ${v.plat || '[Seleccionar]'}\nFORMATO: ${v.form || '[Video, podcast, publicación, animación, micrositio, etc.]'}\nOBJETIVO: ${v.obj || '[Describir]'}\nAUDIENCIA: ${v.aud || '[Describir]'}\nPERSONAJE O ELEMENTO NARRATIVO: ${v.pers || '[Seleccionar]'}\n\nDesarrolla:\n1. Concepto creativo.\n2. Guion o estructura narrativa.\n3. Dirección de arte.\n4. Storyboard o estructura visual.\n5. Prompts especializados para generar los recursos visuales o sonoros necesarios.\n6. Recomendaciones de montaje y producción.\n7. Llamado a la acción.\n\nConserva la coherencia con la biblia narrativa, pero aporta una experiencia nueva al universo.\n\nEl resultado debe ser viable como prototipo de producción.`,
  '04': v => `${v.ctx}Actúa como un consultor experto en narrativa transmedia, dirección creativa y evaluación de proyectos digitales.\n\nAnaliza nuestro universo y su propuesta de expansión.\n\nEvalúa:\n1. Coherencia entre las historias.\n2. Diferenciación narrativa de cada plataforma.\n3. Continuidad de personajes y acontecimientos.\n4. Posibilidades de participación de la audiencia.\n5. Calidad y consistencia visual.\n6. Viabilidad de producción.\n7. Uso crítico y responsable de inteligencia artificial.\n8. Posibles problemas de derechos, privacidad, accesibilidad o información no verificada.\n\nIdentifica debilidades, contradicciones y oportunidades.\n\nNo apruebes automáticamente la propuesta. Cuestiónala como un director creativo que debe garantizar la calidad del proyecto.`
};
const PNAME = { '01': 'Arquitecto de universos narrativos', '02': 'Estratega de expansión transmedia', '03': 'Productor creativo con IA', '04': 'Auditor de coherencia transmedia' };
function ctx() {
  const m2 = P.m2 || {}, m3 = P.m3 || {};
  if (!m2.nombre && !m2.logline) return '';
  let s = `CONTEXTO DE NUESTRO UNIVERSO\nNombre: ${m2.nombre || '-'}\nLogline: ${m2.logline || '-'}\nMundo y reglas: ${m2.mundo || '-'}\nPersonajes: ${m2.personajes || '-'}\nConflicto: ${m2.conflicto || '-'}\n`;
  const pl = (m3.plataformas || []).filter(x => x && x.plat);
  if (pl.length) s += 'Plataformas: ' + pl.map(x => `${x.plat} (${x.fun || '?'})`).join('; ') + '\n';
  return s + '\n';
}
function promptBox(id, vals) {
  return `<div class="prompt" data-prompt="${id}"><div class="ph"><div><div class="silk">// PROMPT ${id}</div><b>${PNAME[id]}</b></div><button class="btn sm" style="--acc:#E4007C;color:#fff" data-copy>Copiar prompt</button></div><pre></pre><div class="mono xs gr" style="margin-top:8px">Pégalo en ChatGPT, Gemini o Claude. Luego registra en la bitácora (misión 05) qué elegiste y qué cambiaste.</div></div>`;
}
function wirePrompt(root, id, valsFn) {
  const box = $(`[data-prompt="${id}"]`, root); if (!box) return;
  const upd = () => { $('pre', box).textContent = PROMPTS[id](Object.assign({ ctx: ctx() }, valsFn())); };
  upd(); root.addEventListener('input', upd); root.addEventListener('change', upd);
  $('[data-copy]', box).onclick = async () => { const t = $('pre', box).textContent; try { await navigator.clipboard.writeText(t); toast('Prompt copiado ✓'); } catch (e) { const r = document.createRange(); r.selectNodeContents($('pre', box)); getSelection().removeAllRanges(); getSelection().addRange(r); toast('Selecciona y copia con Ctrl/Cmd + C'); } };
}

/* ---------- renderers ---------- */
const RENDER = {
  m1(b) {
    reqFn = () => { const m = P.m1 || {}; return [chip(filled(m.equipo), 'Equipo'), chip(filled(m.tipo), 'Tipo de semilla'), chip(String(m.idea || '').trim().length >= 20, 'Idea central'), chip(filled(m.proposito), 'Propósito'), chip(filled(m.audiencia), 'Audiencia')].join(''); };
    b.innerHTML = `<div class="grid">${field('m1.equipo', 'Nombre de tu equipo', { ph: 'Ej.: Los Fareros' })}<div></div>
      <div class="full"><label>Tipo de semilla</label><div class="seeds" id="seeds" style="margin-top:8px">${SEEDS.map(s => `<button type="button" data-s="${esc(s)}">${s}</button>`).join('')}</div></div>
      ${field('m1.idea', 'Idea central', { ta: 1, full: 1, rows: 4, max: 320, count: 280, hint: 'máximo tres líneas', ph: 'Ej.: Una emisora comienza a recibir señales de radio procedentes de un futuro desconocido. Cada transmisión revela una pista sobre un acontecimiento que todavía no ha ocurrido.' })}
      ${field('m1.proposito', 'Propósito', { opts: ['Entretenimiento', 'Educación', 'Comunicación', 'Publicidad / marca', 'Cultura', 'Impacto social o ambiental', 'Turismo'] })}
      ${field('m1.audiencia', 'Audiencia', { ph: '¿Para quién es este universo?' })}</div>${foot(reqFn())}`;
    const seeds = $('#seeds');
    const mark = () => $$('button', seeds).forEach(x => x.classList.toggle('on', x.dataset.s === (P.m1 || {}).tipo));
    $$('button', seeds).forEach(x => x.onclick = () => { setPath('m1.tipo', x.dataset.s); mark(); changed(); }); mark();
    bind(b); counters(b); wireFoot();
  },
  m2(b) {
    const K = [['nombre', 'Nombre del universo'], ['logline', 'Logline o premisa'], ['mundo', 'Mundo y reglas'], ['personajes', 'Personajes'], ['conflicto', 'Conflicto'], ['reglas', 'Continuidad'], ['misterios', 'Misterios'], ['estetica', 'Estética y tono']];
    reqFn = () => { const m = P.m2 || {}; return K.map(([k, t]) => chip(filled(m[k]) && (k !== 'logline' || words(m[k]) <= 45), t)).join(''); };
    b.innerHTML = `<div class="grid">${field('m2.nombre', 'Nombre del universo', { ph: 'Ej.: Frecuencia 2049' })}${field('m2.tono', 'Tono narrativo', { opts: ['Cinematográfico', 'Documental', 'Fantástico', 'Humorístico', 'Futurista', 'Noir / misterio', 'Poético'] })}
      ${field('m2.logline', 'Logline o premisa central', { ta: 1, full: 1, rows: 2, count: 40, unit: 'w', hint: 'máximo 40 palabras' })}
      ${field('m2.mundo', 'Descripción del mundo y sus reglas', { ta: 1, rows: 4, ph: '¿Dónde y cuándo sucede? ¿Qué ley interna lo gobierna?' })}
      ${field('m2.personajes', 'Personajes principales y sus motivaciones', { ta: 1, rows: 4, ph: 'Nombre · qué desea · qué se lo impide' })}
      ${field('m2.conflicto', 'Conflicto narrativo', { ta: 1, rows: 3 })}
      ${field('m2.reglas', 'Reglas de continuidad', { ta: 1, rows: 3, ph: '¿Qué nunca puede cambiar entre plataformas?' })}
      ${field('m2.misterios', 'Tres misterios o elementos expandibles', { ta: 1, rows: 3, ph: '1. …\n2. …\n3. …' })}
      ${field('m2.estetica', 'Identidad estética y dirección de arte', { ta: 1, rows: 3, ph: 'Paleta, referentes, texturas, tipografía…' })}</div>
      ${promptBox('01')}${foot(reqFn())}`;
    bind(b); counters(b); wireFoot();
    wirePrompt(b, '01', () => { const m1 = P.m1 || {}; return { idea: m1.idea, aud: m1.audiencia, prop: m1.proposito, tono: (P.m2 || {}).tono }; });
  },
  m3(b) {
    P.m3 = P.m3 || {}; if (!Array.isArray(P.m3.plataformas) || !P.m3.plataformas.length) P.m3.plataformas = [{}, {}, {}];
    const LV = ['Observa', 'Comparte', 'Comenta', 'Descifra', 'Crea', 'Co-crea'];
    const okP = x => PF.every(k => filled(x && x[k]));
    reqFn = () => { const n = P.m3.plataformas.filter(okP).length; return chip(n >= 3, `${n}/3 plataformas completas`); };
    const draw = () => {
      b.innerHTML = `<datalist id="plList">${['Video / cortometraje', 'Instagram', 'TikTok', 'Podcast', 'Web interactiva', 'Juego', 'Comunidad', 'Afiche / impreso', 'Experiencia en vivo'].map(o => `<option value="${o}">`).join('')}</datalist><datalist id="fnList">${['Descubrimiento', 'Profundización', 'Exploración', 'Participación', 'Conexión emocional', 'Revelación', 'Archivo / memoria'].map(o => `<option value="${o}">`).join('')}</datalist>
      <div class="items">${P.m3.plataformas.map((x, i) => `<div class="item ${okP(x) ? 'ok' : ''}" data-i="${i}"><div class="ih"><b>Plataforma ${i + 1}${x.plat ? ' · ' + esc(x.plat) : ''}</b><span><span class="st">${okP(x) ? 'COMPLETA ✓' : PF.filter(k => filled(x[k])).length + '/7'}</span> ${P.m3.plataformas.length > 3 ? `<button class="rm" data-rm="${i}">Quitar</button>` : ''}</span></div><div class="grid">
        ${field(`m3.plataformas.${i}.plat`, 'Plataforma o formato', { list: 'plList' })}${field(`m3.plataformas.${i}.fun`, 'Función narrativa', { list: 'fnList' })}
        ${field(`m3.plataformas.${i}.cont`, 'Contenido específico', { ta: 1, rows: 2 })}${field(`m3.plataformas.${i}.nueva`, 'Información nueva que descubre el público', { ta: 1, rows: 2 })}
        ${field(`m3.plataformas.${i}.rel`, 'Relación con las demás plataformas', { ta: 1, rows: 2 })}${field(`m3.plataformas.${i}.obj`, 'Objetivo comunicacional', { ta: 1, rows: 2 })}
        ${field(`m3.plataformas.${i}.part`, 'Nivel de participación de la audiencia', { opts: LV })}</div></div>`).join('')}</div>
      ${P.m3.plataformas.length < 5 ? '<button class="btn ghost sm" id="addP" style="margin-top:14px">+ Agregar plataforma</button>' : ''}
      <div class="audit" id="audit"></div>${promptBox('02')}${foot(reqFn())}`;
      bind(b); wireFoot(); audit();
      $$('[data-rm]', b).forEach(x => x.onclick = () => { P.m3.plataformas.splice(+x.dataset.rm, 1); changed(); draw(); });
      const a = $('#addP'); if (a) a.onclick = () => { P.m3.plataformas.push({}); changed(); draw(); };
      wirePrompt(b, '02', () => ({}));
    };
    const wset = s => new Set(String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\W+/).filter(w => w.length > 3));
    function audit() {
      const L = P.m3.plataformas, out = [];
      for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
        const a = L[i], c = L[j], n1 = a.plat || 'P' + (i + 1), n2 = c.plat || 'P' + (j + 1);
        if (a.fun && c.fun && a.fun.trim().toLowerCase() === c.fun.trim().toLowerCase()) out.push(`<div class="warn">⚠ ${esc(n1)} y ${esc(n2)} tienen la misma función narrativa.</div>`);
        [['cont', 'parecen repetir contenido'], ['nueva', 'revelan casi lo mismo']].forEach(([k, t]) => { const A = wset(a[k]), B = wset(c[k]); if (A.size > 2 && B.size > 2 && [...A].filter(x => B.has(x)).length / Math.min(A.size, B.size) > .6) out.push(`<div class="warn">⚠ ${esc(n1)} y ${esc(n2)} ${t}.</div>`); });
      }
      $('#audit').innerHTML = '<div class="silk" style="margin-bottom:6px">// Auditoría rápida</div>' + (out.length ? out.join('') : '<div class="ok">✓ Sin repeticiones detectadas por ahora.</div>');
    }
    b.addEventListener('input', () => { audit(); $$('.item', b).forEach(el => { const x = P.m3.plataformas[+el.dataset.i]; el.classList.toggle('ok', okP(x)); $('.st', el).textContent = okP(x) ? 'COMPLETA ✓' : PF.filter(k => filled(x[k])).length + '/7'; }); });
    b.addEventListener('change', audit);
    draw();
  },
  m4(b) {
    P.m4 = P.m4 || {}; const T = ['Visual', 'Audiovisual', 'Digital o interactivo'];
    const H = ['Afiche, portada, key visual, ficha de personaje o pieza editorial.', 'Storyboard, teaser, tráiler, secuencia animada o video corto.', 'Publicación social, historia, micrositio, mapa, experiencia web o mecanismo participativo.'];
    if (!Array.isArray(P.m4.prototipos) || P.m4.prototipos.length < 3) P.m4.prototipos = T.map((t, i) => Object.assign({ tipo: t }, (P.m4.prototipos || [])[i] || {}));
    const ok = x => filled(x.titulo) && filled(x.descripcion) && isUrl(x.enlace);
    reqFn = () => P.m4.prototipos.map((x, i) => chip(ok(x), T[i])).join('');
    b.innerHTML = `<div class="items">${P.m4.prototipos.map((x, i) => `<div class="item ${ok(x) ? 'ok' : ''}" data-i="${i}"><div class="ih"><b>Prototipo 0${i + 1} · ${T[i]}</b><span class="st">${ok(x) ? 'LISTO ✓' : 'PENDIENTE'}</span></div><p class="p" style="margin:-4px 0 12px;font-size:14px">${H[i]}</p><div class="grid">
      ${field(`m4.prototipos.${i}.titulo`, 'Título de la pieza')}${field(`m4.prototipos.${i}.plataforma`, 'Plataforma a la que pertenece', { list: 'plList2' })}
      ${field(`m4.prototipos.${i}.descripcion`, '¿Qué aporta esta pieza al universo?', { ta: 1, rows: 2, full: 1 })}
      ${field(`m4.prototipos.${i}.enlace`, 'Enlace a la pieza', { full: 1, type: 'url', ph: 'https://drive.google.com/…  ·  https://canva.com/…  ·  https://figma.com/…', hint: 'con permiso de lectura' })}</div></div>`).join('')}</div>
      <datalist id="plList2">${((P.m3 || {}).plataformas || []).filter(x => x && x.plat).map(x => `<option value="${esc(x.plat)}">`).join('')}</datalist>
      <div class="block"><span class="silk">// Prepara el prompt 03</span><div class="grid">${field('m4.pr.plat', 'Plataforma', { list: 'plList2' })}${field('m4.pr.form', 'Formato', { ph: 'video, podcast, micrositio…' })}${field('m4.pr.obj', 'Objetivo')}${field('m4.pr.pers', 'Personaje o elemento narrativo')}</div></div>
      ${promptBox('03')}${foot(reqFn())}`;
    bind(b); wireFoot();
    b.addEventListener('input', () => $$('.item', b).forEach(el => { const x = P.m4.prototipos[+el.dataset.i]; el.classList.toggle('ok', ok(x)); $('.st', el).textContent = ok(x) ? 'LISTO ✓' : 'PENDIENTE'; }));
    wirePrompt(b, '03', () => { const pr = (P.m4 || {}).pr || {}; return { plat: pr.plat, form: pr.form, obj: pr.obj, pers: pr.pers, aud: (P.m1 || {}).audiencia }; });
  },
  m5(b) {
    P.m5 = P.m5 || {}; if (!Array.isArray(P.m5.entradas) || !P.m5.entradas.length) P.m5.entradas = [{}, {}];
    const ok = x => ['herramienta', 'prompt', 'resultado', 'decision'].every(k => filled(x[k]));
    reqFn = () => { const n = P.m5.entradas.filter(ok).length; return chip(n >= 2, `${n}/2 entradas completas`); };
    const draw = () => {
      b.innerHTML = `<div class="items">${P.m5.entradas.map((x, i) => `<div class="item ${ok(x) ? 'ok' : ''}" data-i="${i}"><div class="ih"><b>Entrada ${i + 1}</b><span><span class="st">${ok(x) ? 'COMPLETA ✓' : ''}</span> ${P.m5.entradas.length > 2 ? `<button class="rm" data-rm="${i}">Quitar</button>` : ''}</span></div><div class="grid">
        ${field(`m5.entradas.${i}.herramienta`, 'Herramienta de IA', { list: 'aiList', ph: 'ChatGPT, Gemini, Claude, Firefly…' })}${field(`m5.entradas.${i}.fase`, 'Para qué la usaste', { opts: ['Investigación', 'Ideación', 'Construcción narrativa', 'Producción visual', 'Producción audiovisual', 'Prototipado', 'Revisión / auditoría'] })}
        ${field(`m5.entradas.${i}.prompt`, 'Prompt utilizado (resumen o texto)', { ta: 1, rows: 3, full: 1 })}
        ${field(`m5.entradas.${i}.resultado`, 'Resultado que seleccionaste', { ta: 1, rows: 3 })}${field(`m5.entradas.${i}.decision`, 'Decisión humana: qué cambiaste, descartaste o corregiste', { ta: 1, rows: 3 })}</div></div>`).join('')}</div>
        <datalist id="aiList">${['ChatGPT', 'Google Gemini', 'Claude', 'Adobe Firefly', 'Leonardo AI', 'Ideogram', 'Runway', 'Kling AI', 'CapCut', 'Canva', 'Figma', 'Miro'].map(o => `<option value="${o}">`).join('')}</datalist>
        ${P.m5.entradas.length < 8 ? '<button class="btn ghost sm" id="addE" style="margin-top:14px">+ Agregar entrada</button>' : ''}${foot(reqFn())}`;
      bind(b); wireFoot();
      $$('[data-rm]', b).forEach(x => x.onclick = () => { P.m5.entradas.splice(+x.dataset.rm, 1); changed(); draw(); });
      const a = $('#addE'); if (a) a.onclick = () => { P.m5.entradas.push({}); changed(); draw(); };
    };
    b.addEventListener('input', () => $$('.item', b).forEach(el => { const x = P.m5.entradas[+el.dataset.i]; el.classList.toggle('ok', ok(x)); $('.st', el).textContent = ok(x) ? 'COMPLETA ✓' : ''; }));
    draw();
  },
  m6(b) {
    reqFn = () => { const m = P.m6 || {}; return [chip(filled(m.mecanismo), 'Mecanismo participativo'), chip(String(m.reflexion || '').trim().length >= 30, 'Decisión humana')].join(''); };
    b.innerHTML = `<div class="grid">${field('m6.mecanismo', 'Mecanismo participativo', { ta: 1, rows: 5, full: 1, hint: '¿cómo interviene, explora, responde o aporta la audiencia?', ph: 'Ej.: Cada semana el público vota cuál señal se decodifica primero; los mejores aportes aparecen como transmisiones en el podcast.' })}
      ${field('m6.recorrido', 'Recorrido de la audiencia (opcional)', { ta: 1, rows: 3, full: 1, ph: '¿Por dónde entra el público y a dónde lo llevas después?' })}
      ${field('m6.reflexion', 'Una decisión creativa que tomaste con criterio humano', { ta: 1, rows: 5, full: 1, hint: 'mínimo 30 caracteres', ph: 'La IA propuso…, pero decidimos… porque…' })}</div>
      ${promptBox('04')}${foot(reqFn())}`;
    bind(b); wireFoot(); wirePrompt(b, '04', () => ({}));
  },
  cert(b) {
    const names = ['La semilla creativa', 'Biblia narrativa', 'Mapa transmedia', 'Tres prototipos', 'Bitácora de IA', 'Participación y cierre'];
    const all = ST.done === 6, uni = (P.m2 || {}).nombre || 'Tu universo';
    b.innerHTML = `<div class="cert"><div class="cert-prev"><div class="t">// CERTIFICADO DE PARTICIPACIÓN</div><div class="n">${esc(S.user.nombre)}</div><div class="u">UNIVERSOS TRANSMEDIA</div><div class="s">Creó el universo narrativo «${esc(uni)}» con biblia narrativa, mapa transmedia, tres prototipos y bitácora de IA.</div><img src="../img/cert-gabbo.png" alt=""><img class="firma" src="../img/firma-gabbo.png" alt="Firma del Profe Gabbo"><div class="f"><span>PROFE GABBO · TALLERISTA</span><span>${CERT ? 'Código ' + esc(CERT.codigo) : 'SEMANA C 2026C'}</span></div></div>
      <div><div class="checklist">${['m1', 'm2', 'm3', 'm4', 'm5', 'm6'].map((k, i) => `<div class="${ST[k] ? 'ok' : ''}"><i>${ST[k] ? '✓' : i + 1}</i>${names[i]}</div>`).join('')}</div>
      <p class="p">${all ? `Tu certificado llegará en PDF a <b style="color:var(--cold)">${esc(S.user.correo)}</b>. Revisa también la carpeta de spam.` : `Te faltan ${6 - ST.done} misiones. Completa todas para generar tu certificado.`}</p>
      <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap"><button class="btn" id="bCert" ${all ? '' : 'disabled'}>${CERT ? 'Reenviar a mi correo' : 'Generar y enviar mi certificado'}</button></div>
      <div class="msg" id="certMsg">${CERT ? `Certificado emitido · código <b>${esc(CERT.codigo)}</b>` : ''}</div></div></div>`;
    if (all && !CERT) $('#gsay').textContent = '¡Lo lograste! Seis misiones completas. Pide tu certificado.';
    if (CERT) $('#gsay').textContent = '¡Universo construido! El universo apenas comienza.';
    const btn = $('#bCert');
    btn.onclick = async () => {
      await saveNow();
      const h = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Generando PDF… (puede tardar unos segundos)';
      try { const r = await api('certificate', { token: S.token }); CERT = r.cert; $('#certMsg').className = 'msg ok'; $('#certMsg').innerHTML = esc(r.msg || 'Certificado enviado.') + ` Código <b>${esc(CERT.codigo)}</b>`; toast('Certificado enviado ✓'); renderNav(); $('#gsay').textContent = '¡Felicitaciones! Revisa tu correo institucional.'; btn.innerHTML = 'Reenviar a mi correo'; }
      catch (e) { $('#certMsg').className = 'msg err'; $('#certMsg').textContent = e.server ? e.message : 'No pudimos conectar con el servidor. Intenta de nuevo.'; btn.innerHTML = h; }
      finally { btn.disabled = false; }
    };
  }
};

/* ===================== boot ===================== */
(async function boot() {
  if (DEMO) $('#demo').hidden = false;
  if (S && S.token) {
    try { const r = await api('me', { token: S.token }); setSession(Object.assign({ token: S.token }, r)); enter(); return; }
    catch (e) { if (!e.server && S.user) { P = LS.get('ut-draft-' + S.user.id, {}); ST = statusOf(P); enter(); toast('Sin conexión: trabajando con tu copia local.', true); return; } LS.del('ut-alumno'); S = null; }
  }
  showAuth(); tab('login');
})();
})();
