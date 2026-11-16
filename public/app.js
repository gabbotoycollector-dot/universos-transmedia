(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const stage = $('#stage');
const slides = $$('.slide');
const N = slides.length;
const COL = { green:'#00FFA3', cyan:'#00F0FF', violet:'#9D00FF', magenta:'#E4007C' };
const ROT = ['#00FFA3', '#00F0FF', '#B04DFF', '#E4007C'];
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const h = (tag, attrs = {}, html = '') => { const e = document.createElement(tag); for (const k in attrs) { if (k === 'style') e.style.cssText = attrs[k]; else e.setAttribute(k, attrs[k]); } e.innerHTML = html; return e; };
const ICO = {
  video:'<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>',
  redes:'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  podcast:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  web:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  juego:'<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 11v3M5.5 12.5h3M16 12h.01M18 14h.01"/>',
  comunidad:'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M15 14.5c3 0 6 2 6 5"/>',
  cine:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18M7 5l2 4M12 5l2 4M17 5l2 4"/>',
  exp:'<path d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',
  img:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  text:'<path d="M4 6h16M4 10h16M4 14h10M4 18h12"/>'
};
const icon = k => `<svg viewBox="0 0 24 24">${ICO[k]}</svg>`;

/* ---------- state (localStorage best-effort) ---------- */
const KEY = 'ut-gabbo-2026c';
let S = {};
try { S = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { S = {}; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

/* ---------- scale ---------- */
function fit() { const s = Math.min(innerWidth / 1600, innerHeight / 900); stage.style.setProperty('--s', s); stage._s = s; }
addEventListener('resize', fit); fit();

/* ---------- toast ---------- */
let tt;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2200); }
async function copy(text, okMsg = 'Copiado ✓') {
  try { await navigator.clipboard.writeText(text); toast(okMsg); return true; }
  catch (e) {
    const ta = h('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (_) {}
    ta.remove(); toast(ok ? okMsg : 'Selecciona el texto y copia con Ctrl/Cmd + C'); return ok;
  }
}

/* ---------- Gabbo speech ---------- */
const LINES = {
  1:['¡Bienvenidos al universo! Soy el Profe Gabbo y hoy no vamos a hacer contenido: vamos a construir mundos.','Esta esfera es una idea. En cuatro horas la vamos a convertir en un ecosistema de experiencias.','Regla número uno: la IA es copiloto. El volante lo tienen ustedes. ¿Listos? Entren al universo.'],
  2:['Toquen los portales. Cada uno es una puerta distinta al mismo universo.','Si todas las puertas mostraran lo mismo, no sería un universo: sería un pasillo con espejos.'],
  3:['Muevan el dial del tiempo. Fíjense cómo el público pasa de recibir a explorar.','La clave está en la última etapa: piezas distintas que se conectan entre sí.'],
  4:['Mismo ejemplo, tres lógicas. Cambien de pestaña y comparen los diagramas.','Pregunta trampa: si subo el mismo tráiler a cinco redes… ¿eso es transmedia? Spoiler: no.'],
  5:['Siete reglas del juego. Volteen las cartas para ver cada una en acción.','Ojo con la tensión: continuidad cuida la coherencia, multiplicidad abre otras versiones. Necesitan las dos.'],
  6:['Un universo tiene anatomía. Toquen cada órgano del sistema.','Si cambian el conflicto, cambian los personajes, el mundo y lo que el público puede hacer. Todo está conectado.'],
  7:['¡A construir mundos! Generen uno, bloqueen lo que les guste y vuelvan a lanzar.','Un mundo sin reglas no es libre: es incoherente. Las reglas son las que permiten jugar.'],
  8:['Este soy yo… en varias versiones. Mismo rostro, mismas gafas, distintas historias.','Cada versión vive mejor en una plataforma. Eso es un personaje que expande historias.'],
  9:['Todo universo necesita un motor. Llenen los campos y vean cómo se arma la logline.','Si su logline pasa de 40 palabras, todavía no saben de qué trata su historia.'],
  10:['Suban la escalera de participación. ¿Hasta dónde dejan entrar al público?','Un prosumidor no solo consume: produce. Y eso cambia la forma de diseñar.'],
  11:['Así se ve un ecosistema sano: cada plataforma con una función propia.','Ahora pongan el modo “Repetir”… y verán mi cara.'],
  12:['Cada medio tiene un superpoder. Volteen las cartas.','No elijan plataformas por moda: elíjanlas por lo que mejor saben contar.'],
  13:['Esto es ficción, ¿ok? Un caso inventado para entender la arquitectura. Giren el dial.','Cuatro frecuencias, cuatro funciones: descubrimiento, profundización, exploración y participación.'],
  14:['La IA es una copiloto brutal… pero copiloto. Pasen el cursor por cada uso.','Ninguna herramienta es obligatoria. Lo obligatorio es el criterio.'],
  15:['Del prompt al universo en cinco estaciones. Fíjense en la columna “decide la persona”.','La IA produce volumen. Ustedes producen sentido.'],
  16:['Antes de publicar, lupa. Marquen lo que ya revisaron.','Una imagen espectacular con derechos dudosos no es un prototipo: es un problema.'],
  17:['¡Se acabó la teoría! Cada equipo va a expandir su propio universo.','Toquen cualquier fase de la línea de tiempo para saltar directo a ella.'],
  18:['Fase 1: la semilla. Elijan un tipo y, si se bloquean, giren una chispa.','Tres líneas. Si necesitan más, todavía no es una semilla: es un bosque.'],
  19:['Fase 2: la biblia narrativa. Llenen los campos y el prompt se arma solito.','La IA les va a devolver mucho texto. Ustedes deciden qué entra al canon.'],
  20:['Fase 3: el mapa. Mínimo tres plataformas, y ninguna repite a otra.','Si ven una advertencia en rosado… es que dos plataformas están contando lo mismo.'],
  21:['Fase 4: ¡a producir! Una pieza visual, una audiovisual y una interactiva.','Misma identidad visual, funciones narrativas distintas. Esa es la magia.'],
  22:['Fase 5: el pitch. Tres minutos, cinco preguntas. El reloj les dice cuál toca.','Y el grupo no aplaude por aplaudir: busca expansiones, inconsistencias y oportunidades.'],
  23:['El dossier es la memoria del universo. Seis entregables, ni uno menos.','La bitácora de IA es clave: qué prompt usaron, qué eligieron y qué corrigieron.'],
  24:['Así evaluamos. Muevan los criterios para coevaluar a otro equipo.','El 25% está en la estrategia de expansión. Ahí se gana o se pierde este reto.'],
  25:['¡Lo lograron! El universo apenas comienza.','Antes de irse: cuéntenme una decisión que tomaron ustedes y no la IA.','Gracias por construir mundos conmigo. ¡Nos vemos en el siguiente universo!']
};
const sayState = {};
let typer;
function say(slide, text) {
  const b = $('.say', slide); if (!b) return;
  const n = +slide.dataset.n;
  clearInterval(typer);
  b.classList.add('show');
  let i = 0; const total = LINES[n] ? LINES[n].length : 1;
  const idx = sayState[n] || 0;
  const more = text ? '' : `<span class="more">${idx}/${total} · clic en Gabbo</span>`;
  const t = text || LINES[n][(idx - 1 + total) % total];
  b.innerHTML = '<span class="tx"></span><span class="cur"></span>' + more;
  const tx = $('.tx', b);
  typer = setInterval(() => { i += 2; tx.textContent = t.slice(0, i); if (i >= t.length) { clearInterval(typer); } }, 22);
}
function nextLine(slide) {
  const n = +slide.dataset.n; if (!LINES[n]) return;
  sayState[n] = (sayState[n] || 0) % LINES[n].length + 1;
  say(slide);
}
function poke(el) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
stage.addEventListener('click', e => {
  const g = e.target.closest('.gb, [data-speak]'); if (!g) return;
  const sl = g.closest('.slide'); poke(g.classList.contains('lp-body') ? $('.lp-img', g) : g); nextLine(sl);
  if (sl.dataset.n === '1') burst(40);
});

/* ---------- navigation ---------- */
let cur = 0;
const TITLES = slides.map(s => { const t = s.querySelector('.ttl,.cv-title,.mission,.cl-title'); if (!t) return ''; const d = document.createElement('div'); d.innerHTML = t.innerHTML.replace(/<br\s*\/?>/g, ' ').replace(/<\/span>\s*<span/g, '</span> <span'); return d.textContent.replace(/\s+/g, ' ').trim(); });
function accentsOf(sl) { return (sl.dataset.acc || 'green,cyan').split(',').map(k => COL[k]); }
function go(i, fromHash) {
  i = Math.max(0, Math.min(N - 1, i));
  const prev = slides[cur]; prev.classList.remove('on');
  if (onLeave[cur + 1]) onLeave[cur + 1]();
  cur = i; const sl = slides[i]; sl.classList.add('on');
  const [a, b, c] = accentsOf(sl);
  stage.style.setProperty('--acc', a); stage.style.setProperty('--acc2', b || COL.cyan);
  stage.style.setProperty('--c1', a); stage.style.setProperty('--c2', b || COL.cyan); stage.style.setProperty('--c3', c || (a === COL.violet ? COL.magenta : COL.violet));
  document.body.classList.toggle('on-cover', i === 0);
  $('#ctag').textContent = `// ${String(i + 1).padStart(2, '0')} · ${sl.dataset.sec}`;
  $('#cnt').textContent = String(i + 1).padStart(2, '0');
  $('#progbar').style.width = ((i + 1) / N * 100) + '%';
  if (!fromHash) { try { history.replaceState(null, '', '#s' + String(i + 1).padStart(2, '0')); } catch (e) { location.hash = 's' + String(i + 1).padStart(2, '0'); } }
  // first line
  const n = i + 1; if (!sayState[n]) sayState[n] = 1;
  setTimeout(() => { if (cur === i) say(sl); }, 650);
  if (onEnter[n]) onEnter[n]();
}
const onEnter = {}, onLeave = {};
$('#next').onclick = () => go(cur + 1);
$('#prev').onclick = () => go(cur - 1);
stage.addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g) go(+g.dataset.go - 1); });
addEventListener('keydown', e => {
  const t = e.target; if (t.matches('input,textarea,select')) { if (e.key === 'Escape') t.blur(); return; }
  if ($('.overlay.open')) { if (e.key === 'Escape') $$('.overlay.open').forEach(o => o.classList.remove('open')); return; }
  if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); go(cur + 1); }
  else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); go(cur - 1); }
  else if (e.key === 'Home') go(0); else if (e.key === 'End') go(N - 1);
  else if (e.key === 'i' || e.key === 'I') openIdx();
  else if (e.key === 'f' || e.key === 'F') fullscreen();
});
function fromHash() { const m = /^#s(\d{1,2})$/.exec(location.hash); return m ? +m[1] - 1 : null; }
addEventListener('hashchange', () => { const i = fromHash(); if (i != null && i !== cur) go(i, true); });
function fullscreen() { try { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => toast('Pantalla completa no disponible aquí')); else document.exitFullscreen(); } catch (e) { toast('Pantalla completa no disponible aquí'); } }
$('#fs').onclick = fullscreen;
// swipe
let tx0 = null; stage.addEventListener('touchstart', e => { tx0 = e.touches[0].clientX; }, { passive: true });
stage.addEventListener('touchend', e => { if (tx0 == null) return; const d = e.changedTouches[0].clientX - tx0; if (Math.abs(d) > 70 && !e.target.closest('input,textarea,.dial,.rb,.evo-range')) go(cur + (d < 0 ? 1 : -1)); tx0 = null; });

/* index overlay */
function openIdx() {
  const g = $('#ovGrid'); g.innerHTML = '';
  slides.forEach((s, i) => {
    const [a] = accentsOf(s);
    const b = h('button', { style: `--rc:${a}` }, `<div class="k">// ${String(i + 1).padStart(2, '0')} · ${esc(s.dataset.sec)}</div><div class="h">${esc(TITLES[i])}</div>`);
    if (i === cur) b.classList.add('cur');
    b.onclick = () => { $('#idx').classList.remove('open'); go(i); };
    g.appendChild(b);
  });
  $('#idx').classList.add('open');
}
$('#openIdx').onclick = openIdx;
$('#closeIdx').onclick = () => $('#idx').classList.remove('open');
$$('.overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); }));

/* ---------- COSMOS canvas ---------- */
const cv = $('#cosmos'), cx = cv.getContext('2d');
const DPR = Math.min(2, devicePixelRatio || 1);
cv.width = 1600 * DPR; cv.height = 900 * DPR; cx.scale(DPR, DPR);
const P = [];
function seedStars() { for (let i = 0; i < 46; i++) P.push({ x: Math.random() * 1600, y: Math.random() * 900, vx: (Math.random() - .5) * .12, vy: (Math.random() - .5) * .12, r: Math.random() * 1.4 + .4, life: Infinity, star: true }); }
seedStars();
let orbPt = { x: 1260, y: 640 };
function burst(n) { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, sp = Math.random() * 2.2 + .6; P.push({ x: orbPt.x, y: orbPt.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - .4, r: Math.random() * 2 + .8, life: 160 + Math.random() * 120, age: 0, col: Math.random() < .5 ? '0,240,255' : (Math.random() < .5 ? '0,255,163' : '176,77,255') }); } }
function hexA(hex) { const n = parseInt(hex.slice(1), 16); return `${n >> 16},${(n >> 8) & 255},${n & 255}`; }
let tick = 0;
function frame() {
  tick++;
  cx.clearRect(0, 0, 1600, 900);
  const acc = hexA(accentsOf(slides[cur])[0]);
  const onCover = cur === 0;
  if (onCover && tick % 5 === 0 && P.length < 150) burst(1);
  for (let i = P.length - 1; i >= 0; i--) {
    const p = P[i];
    p.x += p.vx; p.y += p.vy;
    if (p.star) { if (p.x < 0) p.x = 1600; if (p.x > 1600) p.x = 0; if (p.y < 0) p.y = 900; if (p.y > 900) p.y = 0; }
    else { p.age++; p.vx *= .992; p.vy *= .992; if (p.age > p.life) { P.splice(i, 1); continue; } }
  }
  // links
  cx.lineWidth = .6;
  for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
    const a = P[i], b = P[j], dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
    if (d < 11000) {
      const fa = a.star ? .5 : Math.max(0, 1 - a.age / a.life), fb = b.star ? .5 : Math.max(0, 1 - b.age / b.life);
      cx.strokeStyle = `rgba(${a.col || acc},${(1 - d / 11000) * .22 * Math.min(fa, fb) * 2})`;
      cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke();
    }
  }
  for (const p of P) {
    const al = p.star ? .35 : Math.max(0, 1 - p.age / p.life);
    cx.fillStyle = `rgba(${p.col || acc},${al})`;
    cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.283); cx.fill();
  }
  if (onCover) animatePortrait();
  requestAnimationFrame(frame);
}

/* ---------- LIVING PORTRAIT ---------- */
const lp = $('#lp'), lpBody = $('.lp-body'), lpBack = $('.lp-back');
const ORB = { x: .5, y: .79 };
lpBody.style.setProperty('--ox', ORB.x * 100 + '%'); lpBody.style.setProperty('--oy', ORB.y * 100 + '%');
const chips = [];
[['VIDEO', 'PODCAST', 'WEB'], ['JUEGO', 'REDES', 'COMUNIDAD']].forEach((arr, ring) => arr.forEach((t, k) => {
  const c = h('div', { class: 'chip-o' + (ring ? ' v' : '') }, t); lp.appendChild(c);
  chips.push({ el: c, ring, a: k * (Math.PI * 2 / 3) + ring * .6 });
}));
let mx = 0, my = 0, tmx = 0, tmy = 0, lastMove = 0;
stage.addEventListener('mousemove', e => {
  if (cur !== 0) return;
  const r = lp.getBoundingClientRect();
  tmx = ((e.clientX - (r.left + r.width / 2)) / (r.width)) ; tmy = ((e.clientY - (r.top + r.height / 2)) / (r.height));
  tmx = Math.max(-1.2, Math.min(1.2, tmx)); tmy = Math.max(-1.2, Math.min(1.2, tmy));
  lastMove = performance.now();
  const br = lpBody.getBoundingClientRect();
  lpBody.style.setProperty('--lx', ((e.clientX - br.left) / br.width * 100) + '%');
  lpBody.style.setProperty('--ly', ((e.clientY - br.top) / br.height * 100) + '%');
});
function animatePortrait() {
  const t = performance.now() / 1000;
  if (performance.now() - lastMove > 2500) { tmx = Math.sin(t * .35) * .35; tmy = Math.sin(t * .27) * .18; }
  mx += (tmx - mx) * .06; my += (tmy - my) * .06;
  lpBody.style.transform = `rotateY(${mx * 9}deg) rotateX(${-my * 6}deg) translate3d(${mx * 8}px,${my * 6}px,0)`;
  lpBack.style.translate = `${-mx * 26}px ${-my * 18}px`;
  $$('.lp-orbit', lp).forEach((o, k) => o.style.translate = `${mx * (k ? 40 : 30)}px ${my * 16}px`);
  // orbit chips (front/back of Gabbo)
  for (const c of chips) {
    c.a += c.ring ? -.0042 : .0055;
    const W = c.ring ? 270 : 320, H = c.ring ? 60 : 75, cyy = c.ring ? 640 * .38 : 640 * .62, tilt = c.ring ? 6 : -7;
    const ex = Math.cos(c.a) * W, ey = Math.sin(c.a) * H;
    const rad = tilt * Math.PI / 180;
    const x = 310 + ex * Math.cos(rad) - ey * Math.sin(rad) + mx * (c.ring ? 40 : 30), y = cyy + ex * Math.sin(rad) + ey * Math.cos(rad) + my * 16;
    const front = Math.sin(c.a) > 0, depth = (Math.sin(c.a) + 1) / 2;
    c.el.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%) scale(${.78 + depth * .3})`;
    c.el.style.opacity = .35 + depth * .65; c.el.style.zIndex = front ? 5 : 0;
  }
  // orb point in stage coords
  const s = stage._s || 1, sr = stage.getBoundingClientRect(), br = lpBody.getBoundingClientRect();
  orbPt.x = (br.left - sr.left + br.width * ORB.x) / s; orbPt.y = (br.top - sr.top + br.height * ORB.y) / s;
}
lpBody.style.zIndex = 2;

/* ===================== SLIDE 2: portals ===================== */
(() => {
  const box = $('#portals'), svg = $('.pl-lines', box), read = $('#portalRead');
  const items = [['video', 'Video', 'Presenta el conflicto y te conecta emocionalmente con los personajes.'], ['redes', 'Redes', 'Microhistorias, señales y pistas que los personajes dejan en tiempo real.'], ['podcast', 'Podcast', 'Testimonios, ambientes y perspectivas que el video no alcanza a contar.'], ['web', 'Web', 'Un espacio para explorar archivos, conexiones y descubrimientos propios.'], ['juego', 'Juego', 'Te convierte en participante: tus decisiones mueven la historia.'], ['comunidad', 'Comunidad', 'Teorías, interpretaciones y creaciones que aporta el público.']];
  const C = { x: 450, y: 230 }, seen = new Set();
  items.forEach(([k, name, txt], i) => {
    const a = -Math.PI / 2 + i * Math.PI * 2 / 6, x = C.x + Math.cos(a) * 330, y = C.y + Math.sin(a) * 175;
    const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    ln.setAttribute('x1', C.x); ln.setAttribute('y1', C.y); ln.setAttribute('x2', x); ln.setAttribute('y2', y);
    ln.setAttribute('stroke', '#2c2d33'); ln.setAttribute('stroke-width', '1.2'); ln.setAttribute('stroke-dasharray', '4 5'); svg.appendChild(ln);
    const p = h('button', { class: 'portal', style: `left:${x}px;top:${y}px` }, icon(k) + name);
    p.onclick = () => {
      $$('.portal', box).forEach(q => q.classList.remove('on')); p.classList.add('on', 'seen'); seen.add(k);
      $$('line', svg).forEach(l => { l.setAttribute('stroke', '#2c2d33'); l.setAttribute('stroke-dasharray', '4 5'); });
      ln.setAttribute('stroke', getComputedStyle(stage).getPropertyValue('--acc')); ln.setAttribute('stroke-dasharray', '0');
      read.innerHTML = `<div class="k">// Entras por: ${name.toUpperCase()} · ${seen.size}/6</div><div class="h">${name}</div><div class="p">${txt}</div>`;
      if (seen.size === 6) say(slides[1], '¡Eso! Seis puertas, seis experiencias distintas… y un solo universo. Eso es transmedia.');
    };
    box.appendChild(p);
  });
})();

/* ===================== SLIDE 3: evolution ===================== */
(() => {
  const svg = $('#evoSvg'), R = $('#evoR');
  const D = [
    ['Relato lineal', 'Una obra, un medio, un público que recibe. La historia empieza y termina en el mismo lugar.', ['Un medio', 'Público receptor', 'Historia cerrada']],
    ['Adaptación', 'La historia salta de un medio a otro y se vuelve a contar: del libro a la película.', ['Re-contar', 'Cambio de lenguaje', 'Misma trama']],
    ['Distribución', 'La misma pieza circula por muchos canales, ajustada al formato de cada uno.', ['Multicanal', 'Mismo mensaje', 'Alcance']],
    ['Ecosistema conectado', 'Cada plataforma aporta una parte distinta. El público explora, conecta y participa.', ['Expansión', 'Exploración', 'Participación']]
  ];
  const node = (x, y, r, label, col = '#00FFA3', fill = '#16171B') => `<g class="fade"><circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${col}" stroke-width="1.5"/><text x="${x}" y="${y + 5}" text-anchor="middle" fill="#F0F4F8" font-size="14" font-weight="700">${label}</text></g>`;
  const arrow = (x1, y1, x2, y2, col = '#3a3b42', dash = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="1.5" ${dash ? `stroke-dasharray="${dash}"` : ''} marker-end="url(#ar)"/>`;
  const defs = `<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#5a5f68"/></marker></defs>`;
  const draw = [
    () => node(200, 200, 70, 'OBRA') + arrow(275, 200, 470, 200) + node(560, 200, 70, 'PÚBLICO', '#3a3b42'),
    () => node(150, 200, 62, 'LIBRO') + arrow(218, 200, 320, 200) + node(390, 200, 62, 'PELÍCULA', '#00F0FF') + arrow(458, 200, 560, 200) + node(630, 200, 56, 'PÚBLICO', '#3a3b42') + `<text x="270" y="300" fill="#666" font-size="13" font-family="JetBrains Mono">la misma historia, contada otra vez</text>`,
    () => { let s = node(130, 200, 64, 'PIEZA'); [60, 150, 250, 340].forEach((y, i) => { s += arrow(196, 200, 400, y + 2) + `<g><rect x="410" y="${y - 30}" width="200" height="56" rx="10" fill="#16171B" stroke="#3a3b42"/><text x="510" y="${y + 3}" text-anchor="middle" fill="#A0B0C0" font-size="14">= misma pieza · canal ${i + 1}</text></g>`; }); return s; },
    () => { const C = [380, 200], pts = [], lab = ['VIDEO', 'REDES', 'PODCAST', 'WEB', 'JUEGO', 'COMUNIDAD'], cols = ['#00FFA3', '#00F0FF', '#B04DFF', '#E4007C', '#00FFA3', '#00F0FF']; let s = '';
      for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + i * Math.PI / 3; pts.push([C[0] + Math.cos(a) * 270, C[1] + Math.sin(a) * 150]); }
      for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) if ((j - i) % 2 === 1) s += `<line x1="${pts[i][0]}" y1="${pts[i][1]}" x2="${pts[j][0]}" y2="${pts[j][1]}" stroke="#2c2d33" stroke-width="1"/>`;
      pts.forEach((p, i) => s += `<line x1="${C[0]}" y1="${C[1]}" x2="${p[0]}" y2="${p[1]}" stroke="${cols[i]}" stroke-opacity=".5" stroke-width="1.3"/>`);
      s += node(C[0], C[1], 62, 'UNIVERSO', '#00F0FF', '#0d1f22');
      pts.forEach((p, i) => s += `<g><rect x="${p[0] - 58}" y="${p[1] - 20}" width="116" height="40" rx="20" fill="#16171B" stroke="${cols[i]}"/><text x="${p[0]}" y="${p[1] + 5}" text-anchor="middle" fill="#F0F4F8" font-size="13" font-weight="700">${lab[i]}</text></g>`);
      return s; }
  ];
  function upd() {
    const i = +R.value; svg.innerHTML = defs + draw[i]();
    svg.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: 'ease-out' });
    $('#evoK').textContent = `// Etapa 0${i + 1}`; $('#evoH').textContent = D[i][0]; $('#evoP').textContent = D[i][1];
    $('#evoC').innerHTML = D[i][2].map(c => `<span>${c}</span>`).join('');
    R.style.background = `linear-gradient(90deg,var(--acc) ${i / 3 * 100}%,#2a2b31 ${i / 3 * 100}%)`;
  }
  R.oninput = upd; upd();
})();

/* ===================== SLIDE 4: multi/cross/trans ===================== */
(() => {
  const svg = $('#mctSvg');
  const T = [
    ['// 01 · INTEGRAR', 'Multimedia', 'Un solo documental web sobre la leyenda que integra video, fotografías, audio y texto. Todo vive en una misma pieza.', '¿Qué medios se integran en esta pieza?', 'Integra medios ✓  ·  No expande el universo'],
    ['// 02 · ADAPTAR Y DISTRIBUIR', 'Crossmedia', 'El mismo tráiler del documental se recorta para Instagram, TikTok, YouTube y un afiche. Mismo mensaje, formato adaptado.', '¿Cómo se adapta el mensaje a cada canal?', 'Adapta y distribuye ✓  ·  Repite la historia'],
    ['// 03 · EXPANDIR', 'Transmedia', 'El corto muestra la noche de la desaparición; el podcast reúne testimonios de vecinos; un mapa web deja recorrer la casa; en TikTok el farero deja pistas; la comunidad propone teorías.', '¿Qué aporta de nuevo cada medio al universo?', 'Cada medio suma información nueva ✓']
  ];
  const box = (x, y, w, hh, col, lbl, sub = '') => `<g><rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="12" fill="#16171B" stroke="${col}" stroke-width="1.3"/><text x="${x + w / 2}" y="${y + hh / 2 + (sub ? -3 : 5)}" text-anchor="middle" fill="#F0F4F8" font-size="15" font-weight="700">${lbl}</text>${sub ? `<text x="${x + w / 2}" y="${y + hh / 2 + 16}" text-anchor="middle" fill="#A0B0C0" font-size="12">${sub}</text>` : ''}</g>`;
  const ic = (k, x, y, col) => `<g transform="translate(${x},${y}) scale(1.6)" fill="none" stroke="${col}" stroke-width="1.4">${ICO[k]}</g>`;
  const D = [
    () => `<rect x="90" y="40" width="460" height="300" rx="22" fill="#121318" stroke="#00FFA3" stroke-width="1.5"/><text x="320" y="78" text-anchor="middle" fill="#00FFA3" font-family="Silkscreen" font-size="12">UNA SOLA PIEZA</text><text x="320" y="110" text-anchor="middle" fill="#F0F4F8" font-size="20" font-weight="700">Documental web</text>` + ['video', 'img', 'podcast', 'text'].map((k, i) => `<rect x="${125 + i * 100}" y="160" width="80" height="80" rx="14" fill="#16171B" stroke="#2c2d33"/>` + ic(k, 146 + i * 100, 181, '#00F0FF')).join('') + `<text x="320" y="295" text-anchor="middle" fill="#666" font-family="JetBrains Mono" font-size="12">video + foto + audio + texto</text>`,
    () => { let s = box(30, 160, 150, 60, '#00F0FF', 'Tráiler'); ['Instagram', 'TikTok', 'YouTube', 'Afiche'].forEach((n, i) => { const y = 30 + i * 85; s += `<path d="M180 190 C 260 190, 270 ${y + 30}, 360 ${y + 30}" fill="none" stroke="#3a3b42" stroke-width="1.3"/>` + box(360, y, 240, 60, '#3a3b42', n, '= mismo tráiler'); }); return s; },
    () => { const C = [320, 190], L = [['Corto', 'la desaparición', '#00FFA3'], ['Podcast', 'testimonios', '#B04DFF'], ['Mapa web', 'recorrer la casa', '#00F0FF'], ['TikTok', 'pistas del farero', '#E4007C'], ['Comunidad', 'teorías', '#00FFA3']]; const pts = L.map((_, i) => { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; return [C[0] + Math.cos(a) * 225, C[1] + Math.sin(a) * 140]; }); let s = '';
      pts.forEach((p, i) => { const q = pts[(i + 1) % 5]; s += `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="#2c2d33" stroke-dasharray="3 4"/><line x1="${C[0]}" y1="${C[1]}" x2="${p[0]}" y2="${p[1]}" stroke="${L[i][2]}" stroke-opacity=".55"/>`; });
      s += `<circle cx="${C[0]}" cy="${C[1]}" r="58" fill="#0d1f22" stroke="#00F0FF" stroke-width="1.5"/><text x="${C[0]}" y="${C[1] - 3}" text-anchor="middle" fill="#F0F4F8" font-size="14" font-weight="700">La Casa</text><text x="${C[0]}" y="${C[1] + 15}" text-anchor="middle" fill="#F0F4F8" font-size="14" font-weight="700">del Faro</text>`;
      pts.forEach((p, i) => s += box(p[0] - 72, p[1] - 28, 144, 56, L[i][2], L[i][0], L[i][1])); return s; }
  ];
  const set = i => {
    $$('#mctTabs button').forEach(b => b.classList.toggle('on', +b.dataset.t === i));
    svg.innerHTML = D[i](); svg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400 });
    $('#mctK').textContent = T[i][0]; $('#mctH').textContent = T[i][1]; $('#mctP').textContent = T[i][2]; $('#mctQ').textContent = T[i][3]; $('#mctV').textContent = T[i][4];
    if (i === 2) say(slides[3], 'Ahora sí: cada plataforma cuenta una parte diferente. Si te pierdes una, te pierdes algo del universo.');
  };
  $$('#mctTabs button').forEach(b => b.onclick = () => set(+b.dataset.t)); set(0);
})();

/* ===================== flip-card helper ===================== */
function flipCards(host, data) {
  data.forEach((d, i) => {
    const rc = d.col || ROT[i % 4];
    const c = h('div', { class: 'rule', style: `--rc:${rc}` }, `<div class="rule-in"><div class="rule-f">${d.front}</div><div class="rule-b">${d.back}</div></div>`);
    c.onclick = () => c.classList.toggle('flip');
    host.appendChild(c);
  });
}
/* ===================== SLIDE 5: rules ===================== */
flipCards($('#rules'), [
  ['Expansión', 'El relato se propaga y se comparte.', 'Cada pieza invita a buscar la siguiente; el universo circula por sí mismo.', 'Un clip del farero se comparte y lleva al podcast.'],
  ['Profundidad', 'Capas para quien quiere excavar.', 'Detalles, archivos y secretos para el público que quiere saber más.', 'El mapa web esconde la bitácora del farero.'],
  ['Continuidad', 'Coherencia en todas las plataformas.', 'Reglas, personajes y hechos se mantienen estables entre medios.', 'La luz del faro siempre se enciende a las 3:07 a. m.'],
  ['Multiplicidad', 'Otras versiones, otros puntos de vista.', 'Relatos alternativos que amplían el mundo sin contradecir su centro.', 'Un episodio narrado por la niña que vio la luz.'],
  ['Inmersión', 'Sentir que entras al mundo.', 'La experiencia envuelve al público y lo hace habitar el universo.', 'Recorrido sonoro nocturno con audífonos.'],
  ['Extracción', 'El mundo sale a la vida cotidiana.', 'Objetos, signos o rituales del universo que el público se lleva.', 'Postales, filtros o un llavero del faro.'],
  ['Participación', 'El público aporta y decide.', 'La audiencia interviene, crea o modifica el rumbo del universo.', 'Los vecinos envían sus propios avistamientos.'],
  ['¿Y el tuyo?', 'Tu universo, tu combinación.', '¿Qué principio domina tu proyecto? ¿Cuál te falta?', 'Escoge dos que estén en tensión y equilíbralos.']
].map((r, i) => ({ front: `<div class="n">${i < 7 ? '0' + (i + 1) : '+'}</div><div class="h">${r[0]}</div><div class="p">${r[1]}</div>`, back: `<div class="k">// ${r[0].toUpperCase()}</div><div class="p">${r[2]}</div><div class="ex"><b style="color:var(--rc)">Ej.</b> ${r[3]}</div>` })));

/* ===================== SLIDE 6: anatomy ===================== */
(() => {
  const svg = $('#anatSvg'), read = $('#anatRead');
  const A = [['Concepto', '¿De qué trata nuestro universo?', 'La memoria de un barrio que se niega a desaparecer.'], ['Mundo', '¿Dónde sucede y qué reglas lo gobiernan?', 'Un barrio costero donde el faro se enciende solo a las 3:07 a. m.'], ['Personajes', '¿Quiénes habitan ese universo?', 'El farero ausente, una fotógrafa joven y la vecina que lo sabe todo.'], ['Conflicto', '¿Qué situación impulsa la historia?', 'Una constructora quiere demoler la casa del faro.'], ['Narrativa', '¿Qué acontecimientos, perspectivas y secretos pueden descubrirse?', 'Las fotos antiguas muestran personas que aún no han nacido.'], ['Audiencia', '¿Qué puede experimentar, explorar o aportar el público?', 'Enviar avistamientos y votar qué misterio se investiga primero.']];
  const C = [310, 280], R = 210, NS = 'http://www.w3.org/2000/svg';
  const pts = A.map((_, i) => { const a = -Math.PI / 2 + i * Math.PI / 3; return [C[0] + Math.cos(a) * R, C[1] + Math.sin(a) * R]; });
  let s = '';
  for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) s += `<line data-a="${i}" data-b="${j}" x1="${pts[i][0]}" y1="${pts[i][1]}" x2="${pts[j][0]}" y2="${pts[j][1]}" stroke="#25262c" stroke-width="1"/>`;
  s += `<circle cx="${C[0]}" cy="${C[1]}" r="74" fill="#0b1a16" stroke="#00FFA3" stroke-width="1.5"/><circle cx="${C[0]}" cy="${C[1]}" r="90" fill="none" stroke="#00FFA3" stroke-opacity=".25" stroke-dasharray="2 6"><animateTransform attributeName="transform" type="rotate" from="0 ${C[0]} ${C[1]}" to="360 ${C[0]} ${C[1]}" dur="30s" repeatCount="indefinite"/></circle><text x="${C[0]}" y="${C[1] + 6}" text-anchor="middle" fill="#F0F4F8" font-family="Bricolage Grotesque" font-weight="800" font-size="20">UNIVERSO</text>`;
  pts.forEach((p, i) => s += `<g class="anode" data-i="${i}"><circle class="b" cx="${p[0]}" cy="${p[1]}" r="62"/><text class="q" x="${p[0]}" y="${p[1] - 12}">0${i + 1}</text><text x="${p[0]}" y="${p[1] + 12}">${A[i][0]}</text></g>`);
  svg.innerHTML = s;
  const pick = i => {
    $$('.anode', svg).forEach(n => n.classList.toggle('on', +n.dataset.i === i));
    $$('line', svg).forEach(l => { const on = +l.dataset.a === i || +l.dataset.b === i; l.setAttribute('stroke', on ? '#00FFA3' : '#25262c'); l.setAttribute('stroke-opacity', on ? '.6' : '1'); });
    read.innerHTML = `<div class="k">// 0${i + 1} · ${A[i][0].toUpperCase()}</div><div class="h">${A[i][1]}</div><div class="p"><span class="silk">Ej. La Casa del Faro</span><br>${A[i][2]}</div>`;
  };
  $$('.anode', svg).forEach(n => n.addEventListener('click', () => pick(+n.dataset.i))); pick(0);
})();

/* ===================== SLIDE 7: worldbuilding ===================== */
(() => {
  const W = [
    ['Espacio', '¿Cómo se ve, se huele y se recorre?', ['Un barrio costero que se hunde un centímetro por día', 'Una biblioteca infinita bajo la montaña', 'Un mercado flotante en una ciudad sin calles', 'Una estación espacial que recicla recuerdos', 'Un pueblo dentro de un videojuego abandonado', 'Una terminal de buses de la que nadie logra salir']],
    ['Tiempo', '¿Cuándo sucede y cómo se mide el tiempo?', ['Año 2049', 'Una noche que dura una semana', '1985, el día antes del primer celular', 'Un presente donde internet se apagó', 'Siglo XXII, después de la gran sequía', 'Tiempo circular: cada lunes se repite']],
    ['Contexto', '¿Qué condición social, cultural o tecnológica lo define?', ['Las emociones se pueden vender', 'Nadie recuerda su nombre al despertar', 'Los colores están prohibidos', 'Solo la IA puede contar historias', 'El agua es la moneda', 'Las fotos predicen el futuro']],
    ['Atmósfera', '¿Qué debe sentir el público al entrar?', ['Nostálgica y luminosa', 'Misterio noir caribeño', 'Humor absurdo', 'Tensión de cuenta regresiva', 'Calma inquietante', 'Épica de barrio']],
    ['Regla interna', '¿Qué ley gobierna este mundo?', ['Nadie puede mentir después de las 6 p. m.', 'Cada objeto guarda la voz de su dueño', 'Solo los niños ven las señales', 'Todo mensaje llega con un día de retraso', 'Lo que dibujas, se vuelve real', 'Ninguna historia se cuenta dos veces igual']],
    ['Coherencia', '¿Qué nunca puede pasar aquí?', ['Nadie puede viajar al pasado', 'La magia siempre cobra un precio', 'Los muertos no regresan', 'Nada se borra de internet', 'Ningún personaje conoce toda la verdad', 'La ciudad nunca tiene nombre']]
  ];
  const host = $('#wb'), lock = new Set(), cards = [];
  W.forEach((w, i) => {
    const c = h('div', { class: 'wbc' }, `<span class="lk">🔓</span><div class="k">// 0${i + 1} · ${w[0].toUpperCase()}</div><div class="val">—</div><div class="q">${w[1]}</div>`);
    c.onclick = () => { lock.has(i) ? lock.delete(i) : lock.add(i); c.classList.toggle('lock', lock.has(i)); $('.lk', c).textContent = lock.has(i) ? '🔒' : '🔓'; };
    host.appendChild(c); cards.push(c);
  });
  const roll = () => cards.forEach((c, i) => { if (lock.has(i)) return; const l = W[i][2]; const v = $('.val', c); let nv; do { nv = l[Math.floor(Math.random() * l.length)]; } while (nv === v.textContent && l.length > 1); v.textContent = nv; c.classList.remove('roll'); void c.offsetWidth; c.classList.add('roll'); });
  $('#wbRoll').onclick = () => { roll(); poke($('.gb', slides[6])); };
  roll();
})();

/* ===================== SLIDE 8: multiverse ===================== */
(() => {
  const V = [
    ['v-explorador', 'Gabbo Explorador', 'Podcast · bitácora de viaje', 'Sale a buscar referentes visuales en el territorio y los narra en audio.'],
    ['v-caso', 'Gabbo · El Caso', 'Serie de misterio en redes', 'Investiga “crímenes” de diseño: kerning roto, logos pixelados, paletas imposibles.'],
    ['v-hacker', 'Gabbo Hacker', 'Web interactiva · juego', 'Esconde códigos en tipografías que el público debe descifrar.'],
    ['v-tiburon', 'Gabbo Tiburón', 'TikTok · humor', 'Microhistorias en pijama sobre las madrugadas de entrega.'],
    ['v-gabardina', 'Gabbo Noir', 'Cortometraje', 'Una noche, una ciudad y un archivo perdido que nadie debería abrir.'],
    ['v-formal', 'Gabbo Mentor', 'Masterclass en vivo', 'El guía que conecta todas las versiones y le da sentido al universo.']
  ];
  const tr = $('#mvTrack'), read = $('#mvRead'); let at = 1;
  const items = V.map((v, i) => { const d = h('div', { class: 'mv-item' }, `<img src="img/${v[0]}.webp" alt="${v[1]}">`); d.onclick = () => { if (i !== at) { at = i; lay(); } }; tr.appendChild(d); return d; });
  function lay() {
    items.forEach((d, i) => {
      let o = i - at; if (o > 3) o -= 6; if (o < -2) o += 6;
      const ab = Math.abs(o);
      d.style.transform = `translateX(calc(-50% + ${o * 190}px)) scale(${ab === 0 ? 1 : ab === 1 ? .6 : .4})`;
      d.style.opacity = ab === 0 ? 1 : ab === 1 ? .55 : 0; d.style.zIndex = 10 - ab; d.style.filter = ab ? 'grayscale(.5) brightness(.6)' : 'none';
      d.style.pointerEvents = ab > 1 ? 'none' : 'auto';
      const img = d.querySelector('img'); if (ab === 0) img.setAttribute('data-speak', ''); else img.removeAttribute('data-speak');
    });
    const v = V[at];
    read.innerHTML = `<div class="k">// Versión 0${at + 1} / 06</div><div class="h">${v[1]}</div><div class="p"><span class="silk">Plataforma ideal</span><br>${v[2]}</div><div class="p" style="margin-top:10px"><span class="silk">Historia complementaria</span><br>${v[3]}</div><div class="p" style="margin-top:12px;font-size:13px;color:#666">Anclas de identidad: gafas violeta · barba · calavera</div>`;
  }
  $('#mvPrev').onclick = () => { at = (at + 5) % 6; lay(); };
  $('#mvNext').onclick = () => { at = (at + 1) % 6; lay(); };
  lay();
  const AT = [['Motivación', '¿Qué desea profundamente?'], ['Personalidad', '¿Cómo reacciona y cómo habla?'], ['Objetivo', '¿Qué busca concretamente?'], ['Conflicto', '¿Qué se lo impide?'], ['Relaciones', '¿Con quién choca o se alía?'], ['Evolución', '¿Cómo cambia de plataforma en plataforma?']];
  const ah = $('#attrs');
  AT.forEach(([a, q], i) => { const d = h('div', { class: 'attr' + (i === 0 ? ' on' : '') }, `<b>${a}</b><span>${q}</span>`); d.onclick = () => d.classList.toggle('on'); ah.appendChild(d); });
})();

/* ===================== SLIDE 9: logline ===================== */
(() => {
  const ins = $$('#lgForm input'), out = $('#lgText');
  const EX = { det: 'la luz del faro abandonado se enciende sola', pro: 'una estudiante de fotografía', obj: 'descubrir quién envía las señales', obs: 'cada foto que toma muestra un lugar que aún no existe', rie: 'el barrio olvidará su propia historia' };
  const v = k => { const i = ins.find(x => x.dataset.k === k); return i.value.trim(); };
  const part = (k, ph) => v(k) ? `<i>${esc(v(k))}</i>` : `<span class="ph">[${ph}]</span>`;
  function upd() {
    out.innerHTML = `Cuando ${part('det', 'detonante')}, ${part('pro', 'protagonista')} debe ${part('obj', 'objetivo')}, pero ${part('obs', 'obstáculo')}; si fracasa, ${part('rie', 'lo que está en juego')}.`;
    const txt = ['det', 'pro', 'obj', 'obs', 'rie'].map(v).join(' ');
    const w = txt.trim() ? txt.trim().split(/\s+/).length + 6 : 0;
    $('#lgCount').textContent = `${w} / 40 palabras` + (w > 40 ? ' · demasiado larga' : '');
    $('#lgBar').style.width = Math.min(100, w / 40 * 100) + '%'; $('#lgBar').style.background = w > 40 ? '#E4007C' : '';
    S.logline = Object.fromEntries(ins.map(i => [i.dataset.k, i.value])); save();
  }
  ins.forEach(i => { if (S.logline && S.logline[i.dataset.k]) i.value = S.logline[i.dataset.k]; i.oninput = upd; });
  $('#lgEx').onclick = () => { ins.forEach(i => i.value = EX[i.dataset.k]); upd(); };
  $('#lgClr').onclick = () => { ins.forEach(i => i.value = ''); upd(); };
  upd();
})();

/* ===================== SLIDE 10: ladder ===================== */
(() => {
  const L = [['Observa', 'Mira y escucha: consume la historia.', 'Teaser, video principal.'], ['Comparte', 'Hace circular piezas del universo.', 'Clips, stickers, frases citables.'], ['Comenta', 'Opina, reacciona, conversa con los personajes.', 'Personajes que responden en redes.'], ['Descifra', 'Investiga pistas y conecta plataformas.', 'Códigos ocultos, mapas, búsquedas del tesoro.'], ['Crea', 'Produce contenidos derivados: es prosumidor.', 'Retos, plantillas, fan art.'], ['Co-crea', 'Su aporte entra al canon del universo.', 'Votaciones, convocatorias, historias de la comunidad.']];
  const host = $('#ladder'), read = $('#ladRead'); let lv = 0;
  const steps = L.map((s, i) => { const d = h('button', { class: 'step', style: `left:${i * 44}px;bottom:${i * 64}px;width:${380}px` }, `<span class="n">NIVEL 0${i + 1}</span>${s[0]}`); d.onclick = () => set(i); host.appendChild(d); return d; });
  function set(i) {
    lv = i; steps.forEach((s, k) => { s.classList.toggle('lit', k <= i); s.classList.toggle('cur', k === i); });
    read.innerHTML = `<div class="k">// Nivel 0${i + 1} de 06</div><div class="h">${L[i][0]}</div><div class="p">${L[i][1]}</div><div class="p" style="margin-top:12px"><span class="silk">Mecanismo</span><br>${L[i][2]}</div>`;
    if (i === 5) say(slides[9], '¡Nivel máximo! Cuando el público co-crea, el universo deja de ser tuyo… y se vuelve de todos.');
  }
  set(0);
})();

/* ===================== SLIDE 11: architecture ===================== */
(() => {
  const svg = $('#archSvg'), read = $('#archRead'), G = $('#archGabbo');
  const P = [['Video', 'Presenta el conflicto y genera conexión emocional.', 'El detonante y los personajes.', 'Deja preguntas que se responden en el podcast.'], ['Instagram y TikTok', 'Desarrollan personajes, microhistorias, señales y pistas.', 'El día a día de los personajes.', 'Las pistas llevan a la web.'], ['Podcast', 'Profundiza en testimonios, ambientes y perspectivas.', 'Voces y puntos de vista ocultos.', 'Menciona lugares que se exploran en la web.'], ['Web interactiva', 'Permite explorar información, conexiones y descubrimientos.', 'Archivos, mapas y relaciones.', 'Desbloquea el acceso al juego.'], ['Juego', 'Convierte al espectador en participante.', 'Consecuencias de sus decisiones.', 'Los resultados alimentan a la comunidad.'], ['Comunidad', 'Aporta interpretaciones, teorías y contenidos derivados.', 'Lo que el público imagina.', 'Las mejores teorías vuelven al video.']];
  const C = [400, 280], pts = P.map((_, i) => { const a = -Math.PI / 2 + i * Math.PI / 3; return [C[0] + Math.cos(a) * 300, C[1] + Math.sin(a) * 205]; });
  const short = ['Conflicto + emoción', 'Pistas y microhistorias', 'Testimonios y perspectivas', 'Exploración', 'Participación', 'Teorías y derivados'];
  let mode = 'exp', sel = 0;
  function draw() {
    let s = '';
    pts.forEach((p, i) => { const q = pts[(i + 1) % 6]; s += `<path class="flowp" d="M${p[0]} ${p[1]} Q ${C[0]} ${C[1]} ${q[0]} ${q[1]}" fill="none" stroke="${mode === 'rep' ? '#2c2d33' : ROT[i % 4]}" stroke-opacity=".45" stroke-width="1.2" stroke-dasharray="5 6"><animate attributeName="stroke-dashoffset" from="0" to="-22" dur="1.4s" repeatCount="indefinite"/></path>`; });
    pts.forEach((p) => s += `<line x1="${C[0]}" y1="${C[1]}" x2="${p[0]}" y2="${p[1]}" stroke="#2c2d33"/>`);
    s += `<circle cx="${C[0]}" cy="${C[1]}" r="66" fill="${mode === 'rep' ? '#22101a' : '#0f1a2a'}" stroke="${mode === 'rep' ? '#E4007C' : '#00F0FF'}" stroke-width="1.5"/><text x="${C[0]}" y="${C[1] + 6}" text-anchor="middle" fill="#F0F4F8" font-family="Bricolage Grotesque" font-weight="800" font-size="18">${mode === 'rep' ? 'TRÁILER' : 'UNIVERSO'}</text>`;
    pts.forEach((p, i) => s += `<g class="pnode${i === sel ? ' on' : ''}" data-i="${i}"><rect x="${p[0] - 105}" y="${p[1] - 32}" width="210" height="64" rx="12"/><text x="${p[0]}" y="${p[1] - 4}">${P[i][0]}</text><text class="f" x="${p[0]}" y="${p[1] + 16}">${mode === 'rep' ? 'el mismo tráiler, otro formato' : short[i]}</text></g>`);
    svg.innerHTML = s; svg.classList.toggle('rep', mode === 'rep');
    $$('.pnode', svg).forEach(n => n.addEventListener('click', () => { sel = +n.dataset.i; draw(); }));
    const p = P[sel];
    read.style.setProperty('--acc', mode === 'rep' ? '#E4007C' : '');
    read.innerHTML = mode === 'rep'
      ? `<div class="k">// MODO REPETIR</div><div class="h">${p[0]}</div><div class="p">Publica el mismo tráiler adaptado al formato. El público que ya lo vio no encuentra nada nuevo.</div><div class="p" style="margin-top:12px;color:#E4007C">Regla rota: una plataforma no debe limitarse a reproducir el contenido de otra.</div>`
      : `<div class="k">// 0${sel + 1} · FUNCIÓN NARRATIVA</div><div class="h">${p[0]}</div><div class="p">${p[1]}</div><div class="p" style="margin-top:12px"><span class="silk">Qué descubre el público</span><br>${p[2]}</div><div class="p" style="margin-top:10px"><span class="silk">Conexión</span><br>${p[3]}</div>`;
  }
  $$('#archSw button').forEach(b => b.onclick = () => {
    mode = b.dataset.m; $$('#archSw button').forEach(x => x.classList.toggle('on', x === b)); draw();
    G.src = mode === 'rep' ? 'img/no.webp' : 'img/menton.webp'; poke(G);
    say(slides[10], mode === 'rep' ? '¡NOOO! Mismo tráiler en seis lugares no es un universo: es spam con buena intención.' : 'Eso es: cada plataforma con una función propia, y todas conectadas.');
  });
  draw();
})();

/* ===================== SLIDE 12: platforms ===================== */
flipCards($('#flips'), [['cine', 'Cine · cortometraje', 'Emoción e inmersión audiovisual.', 'La noche en que la luz del faro se encendió por primera vez.'], ['redes', 'Redes sociales', 'Inmediatez y conversación.', 'La fotógrafa publica fotos con detalles imposibles.'], ['juego', 'Videojuegos', 'Agencia: el público decide.', 'Recorres la casa y decides qué puerta abrir.'], ['podcast', 'Podcast', 'Intimidad y profundidad de la voz.', 'La vecina cuenta lo que vio hace cuarenta años.'], ['web', 'Páginas web', 'Exploración no lineal.', 'Un archivo con los diarios del farero.'], ['exp', 'Experiencias interactivas', 'Presencia física y memoria del cuerpo.', 'Un recorrido nocturno con audífonos por el barrio.']]
  .map(r => ({ front: `<div class="ico">${icon(r[0])}</div><div class="h">${r[1]}</div><div class="p"><span class="silk" style="color:var(--rc)">Superpoder</span><br>${r[2]}</div>`, back: `<div class="k">// APORTE A “LA CASA DEL FARO”</div><div class="p" style="font-family:var(--fH);font-size:22px;line-height:1.25">${r[3]}</div><div class="ex">${r[1]} · ${r[2]}</div>` })));

/* ===================== SLIDE 13: radio ===================== */
(() => {
  const ST = [[913, 'Cortometraje', 'Descubrimiento', 'El público conoce la primera transmisión y el misterio que desencadena la historia.'], [957, 'Podcast', 'Profundización', 'Se escuchan testimonios y fragmentos de las señales que revelan nuevas perspectivas.'], [1004, 'Página interactiva', 'Exploración', 'El usuario investiga coordenadas y conecta las pistas encontradas.'], [1049, 'Redes sociales', 'Participación', 'Los personajes publican mensajes, reciben respuestas e invitan al público a descifrar la historia.']];
  const dial = $('#dial'), scr = $('#radioScr'), fq = $('#freq'), scale = $('#dialScale'), found = $('#found'), cvn = $('#noise'), nx = cvn.getContext('2d');
  for (let f = 880; f <= 1080; f += 5) { const i = h('i', { style: `left:${(f - 880) / 200 * 100}%;height:${f % 20 === 0 ? 18 : 9}px` }); scale.appendChild(i); }
  const marks = ST.map(s => { const b = h('b', { style: `left:${(s[0] - 880) / 200 * 100}%` }); scale.appendChild(b); return b; });
  const seen = new Set();
  const cells = ST.map((s, i) => { const d = h('div', { class: 'fnd' }, `<div class="k">// ${(s[0] / 10).toFixed(1)} · ???</div><div class="h">Señal sin descubrir</div><div class="p">Sigue girando el dial…</div>`); found.appendChild(d); return d; });
  let strength = 0, hit = -1;
  function upd() {
    const f = +dial.value; fq.textContent = (f / 10).toFixed(1);
    let best = 1e9; hit = -1; ST.forEach((s, i) => { const d = Math.abs(f - s[0]); if (d < best) { best = d; if (d <= 3) hit = i; } });
    strength = Math.max(0, 1 - best / 14);
    marks.forEach((m, i) => m.classList.toggle('hit', i === hit));
    if (hit >= 0) {
      const s = ST[hit];
      scr.classList.remove('lost');
      scr.innerHTML = `<div class="k">// ${(s[0] / 10).toFixed(1)} MHz · ${s[2].toUpperCase()}</div><div class="h">${s[1]}</div><div class="p">${s[3]}</div>`;
      if (!seen.has(hit)) { seen.add(hit); const c = cells[hit]; c.classList.add('ok'); c.innerHTML = `<div class="k">// ${(s[0] / 10).toFixed(1)} · ${s[2].toUpperCase()}</div><div class="h">${s[1]}</div><div class="p">${s[3]}</div>`;
        if (seen.size === 4) say(slides[12], '¡Cuatro de cuatro! Ninguna frecuencia repitió a otra. Así se diseña un ecosistema.'); }
      beep();
    } else { scr.classList.add('lost'); scr.innerHTML = `<div class="k">// ${(f / 10).toFixed(1)} MHz</div><div class="h">${strength > .4 ? 'Señal débil…' : 'Solo estática'}</div><div class="p">${seen.size}/4 transmisiones encontradas. Gira el dial.</div>`; }
    if (AC.on) AC.ng.gain.setTargetAtTime(hit >= 0 ? .015 : .07 * (1 - strength * .6), AC.ctx.currentTime, .05);
  }
  dial.oninput = upd;
  function noise() {
    if (cur === 12) {
      const w = 140, hh = 60, id = nx.createImageData(w, hh), amt = hit >= 0 ? .12 : .75 - strength * .4;
      for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() * 255 * amt; id.data[i] = v * .6; id.data[i + 1] = v; id.data[i + 2] = v * (hit >= 0 ? 1.1 : .9); id.data[i + 3] = 255; }
      const tmp = noise.c || (noise.c = document.createElement('canvas')); tmp.width = w; tmp.height = hh; tmp.getContext('2d').putImageData(id, 0, 0);
      nx.imageSmoothingEnabled = false; nx.drawImage(tmp, 0, 0, 560, 240);
      if (hit >= 0) { nx.strokeStyle = 'rgba(0,240,255,.8)'; nx.lineWidth = 2; nx.beginPath(); const t = performance.now() / 300; for (let x = 0; x <= 560; x += 4) { const y = 90 + Math.sin(x / 18 + t) * 26 * Math.sin(x / 90 + t / 3); x ? nx.lineTo(x, y) : nx.moveTo(x, y); } nx.stroke(); }
    }
    requestAnimationFrame(noise);
  }
  noise();
  const AC = { on: false };
  let lastBeep = 0;
  function beep() { if (!AC.on || performance.now() - lastBeep < 900) return; lastBeep = performance.now(); const o = AC.ctx.createOscillator(), g = AC.ctx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(AC.ctx.destination); const t = AC.ctx.currentTime; [0, .14, .28].forEach(d => { g.gain.setValueAtTime(.08, t + d); g.gain.setValueAtTime(0, t + d + .08); }); o.start(t); o.stop(t + .4); }
  $('#sndBtn').onclick = () => {
    try {
      if (!AC.ctx) { AC.ctx = new (window.AudioContext || window.webkitAudioContext)(); const b = AC.ctx.createBuffer(1, AC.ctx.sampleRate * 2, AC.ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; AC.src = AC.ctx.createBufferSource(); AC.src.buffer = b; AC.src.loop = true; AC.ng = AC.ctx.createGain(); AC.ng.gain.value = 0; const bp = AC.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = .6; AC.src.connect(bp); bp.connect(AC.ng); AC.ng.connect(AC.ctx.destination); AC.src.start(); }
      AC.on = !AC.on; if (AC.on) AC.ctx.resume(); AC.ng.gain.setTargetAtTime(AC.on ? .06 : 0, AC.ctx.currentTime, .05);
      $('#sndBtn').textContent = AC.on ? '🔊 Sonido: sí' : '🔈 Sonido: no'; upd();
    } catch (e) { toast('El audio no está disponible aquí'); }
  };
  onLeave[13] = () => { if (AC.on) { AC.on = false; AC.ng.gain.setTargetAtTime(0, AC.ctx.currentTime, .05); $('#sndBtn').textContent = '🔈 Sonido: no'; } };
  upd();
})();

/* ===================== SLIDE 14: AI uses ===================== */
(() => {
  const U = [['Investigación', 'Contextos, audiencias y referentes.', ['ChatGPT', 'Gemini', 'Claude']], ['Ideación', 'Conceptos, conflictos y escenarios en volumen.', ['ChatGPT', 'Gemini', 'Claude']], ['Construcción narrativa', 'Personajes, guiones, reglas y biblia narrativa.', ['Claude', 'ChatGPT', 'Gemini']], ['Diseño', 'Personajes, escenarios, key visuals y afiches.', ['Adobe Firefly', 'Leonardo AI', 'Ideogram']], ['Producción audiovisual', 'Video generativo, animación, montaje y piezas promocionales.', ['Runway', 'Kling AI', 'CapCut']], ['Prototipado', 'Mapas narrativos, tableros y prototipos de experiencias.', ['Canva', 'Figma', 'Miro']]];
  const host = $('#uses'); U.forEach((u, i) => host.appendChild(h('div', { class: 'use', style: `--rc:${['#E4007C', '#B04DFF', '#00F0FF'][i % 3]}` }, `<div class="n">// 0${i + 1}</div><div class="h">${u[0]}</div><div class="p">${u[1]}</div><div class="chips">${u[2].map(t => `<span>${t}</span>`).join('')}</div>`)));
})();

/* ===================== SLIDE 15: flow ===================== */
(() => {
  const F = [['Investigación', 'Análisis de contextos, audiencias y referentes.', 'Preguntas, contexto, público', 'Mapa de referentes y hallazgos', 'Verificar fuentes y datos: la IA puede inventar.'], ['Ideación', 'Generación y exploración de conceptos, conflictos y escenarios.', 'Semilla + restricciones', 'Decenas de variaciones', 'Elegir, combinar y descartar con criterio.'], ['Construcción', 'Desarrollo de personajes, guiones, reglas e identidades visuales.', 'Concepto elegido', 'Biblia narrativa', 'Cuidar la coherencia y la voz propia.'], ['Producción', 'Creación asistida de imágenes, voces, sonidos, videos y prototipos.', 'Prompts especializados', 'Piezas y prototipos', 'Dirección de arte, derechos y consentimiento.'], ['Optimización', 'Revisión de coherencia, continuidad, accesibilidad y adaptación.', 'Piezas producidas', 'Ecosistema ajustado', 'Auditar sin aprobar automáticamente.']];
  const host = $('#flow'), read = $('#flowRead'); let at = 0, auto = true, timer;
  const st = F.map((f, i) => { const d = h('div', { class: 'fst' }, `<div class="dot">0${i + 1}</div><div class="h">${f[0]}</div>`); d.onclick = () => { auto = false; set(i); }; host.appendChild(d); return d; });
  function set(i) {
    at = i; st.forEach((s, k) => { s.classList.toggle('on', k === i); s.classList.toggle('done', k < i); });
    const f = F[i];
    read.innerHTML = `<div class="card"><div class="k">// 0${i + 1} · ${f[0].toUpperCase()}</div><div class="p" style="color:var(--cold);font-size:19px">${f[1]}</div></div><div class="card" style="--acc:#B04DFF"><div class="k">// Entra → sale</div><div class="p">${f[2]}<br><span style="color:#B04DFF">→</span> ${f[3]}</div></div><div class="card" style="--acc:#00FFA3"><div class="k">// Decide la persona</div><div class="p" style="color:var(--cold)">${f[4]}</div></div>`;
  }
  onEnter[15] = () => { auto = true; set(0); clearInterval(timer); timer = setInterval(() => { if (!auto || cur !== 14) return clearInterval(timer); set((at + 1) % 5); }, 4200); };
  set(0);
})();

/* ===================== SLIDE 16: human filter ===================== */
(() => {
  const F = [['Pensamiento crítico', '¿Cuestioné la salida en lugar de aceptarla?'], ['Curaduría', '¿Elegí entre varias opciones con un criterio claro?'], ['Validación', '¿Verifiqué datos, nombres y afirmaciones?'], ['Coherencia narrativa', '¿Respeta las reglas y personajes del universo?'], ['Privacidad', '¿Evité ingresar datos personales o confidenciales?'], ['Derechos de autor', '¿Uso recursos originales, licenciados o autorizados?'], ['Accesibilidad y sesgos', '¿Revisé contraste, subtítulos y estereotipos?'], ['Registro', '¿Documenté qué hizo la IA y qué decidí yo?']];
  const host = $('#filter'), ok = new Set();
  F.forEach((f, i) => { const d = h('div', { class: 'fil' }, `<div class="bx">✓</div><div><b>${f[0]}</b><span>${f[1]}</span></div>`); d.onclick = () => { ok.has(i) ? ok.delete(i) : ok.add(i); d.classList.toggle('ok', ok.has(i)); upd(); }; host.appendChild(d); });
  function upd() { const p = Math.round(ok.size / F.length * 100); $('#gaugeBar').style.width = p + '%'; $('#gaugeVal').textContent = p + '%'; if (p === 100) say(slides[15], '¡Ahora sí! Revisado por humanos. Eso se puede publicar con la frente en alto.'); }
})();

/* ===================== SLIDE 17: lab timeline ===================== */
(() => {
  const T = [['FASE 01', 'La semilla creativa', 25, 18, '#00FFA3'], ['FASE 02', 'Construcción del universo', 35, 19, '#00F0FF'], ['FASE 03', 'Diseño del ecosistema', 35, 20, '#B04DFF'], ['FASE 04', 'Producción de prototipos', 40, 21, '#00FFA3'], ['FASE 05', 'Socialización y pitch', 25, 22, '#00F0FF'], ['CIERRE', 'Decisión humana', 10, 25, '#E4007C']];
  const host = $('#labTl');
  T.forEach(t => { const d = h('div', { class: 'ltl', style: `flex:${t[2]};--rc:${t[4]}` }, `<div class="k">${t[0]}</div><div class="h">${t[1]}</div><div class="t">${t[2]} min</div>`); d.onclick = () => go(t[3] - 1); host.appendChild(d); });
})();

/* portal QR */
(() => {
  const url = new URL('alumno/', location.href).href.replace(/#.*$/, '');
  $('#qrUrl').textContent = url.replace(/^https?:\/\//, '');
  try { const q = qrcode(0, 'M'); q.addData(url); q.make(); $('#qrBox').innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); } catch (e) { $('#qrBox').style.display = 'none'; }
})();

/* ===================== timers ===================== */
let ACT = null;
function tone(freq = 660, dur = .25) { try { ACT = ACT || new (window.AudioContext || window.webkitAudioContext)(); const o = ACT.createOscillator(), g = ACT.createGain(); o.frequency.value = freq; o.connect(g); g.connect(ACT.destination); g.gain.setValueAtTime(.12, ACT.currentTime); g.gain.exponentialRampToValueAtTime(.001, ACT.currentTime + dur); o.start(); o.stop(ACT.currentTime + dur); } catch (e) {} }
$$('.timer').forEach(tm => {
  const total = +tm.dataset.min * 60; let left = total, iv = null;
  const CIRC = 2 * Math.PI * 26;
  tm.innerHTML = `<svg viewBox="0 0 62 62"><circle class="bgc" cx="31" cy="31" r="26"/><circle class="fgc" cx="31" cy="31" r="26" stroke-dasharray="${CIRC}" stroke-dashoffset="0"/></svg><div><div class="tl">// TIEMPO DE FASE</div><div class="tm">00:00</div><div class="tb"><button data-a="go">▶</button><button data-a="rs">↺</button><button data-a="m">−1</button><button data-a="p">+1</button></div></div>`;
  const fg = $('.fgc', tm), tx = $('.tm', tm), bgo = $('[data-a=go]', tm);
  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const draw = () => { tx.textContent = fmt(Math.max(0, left)); fg.style.strokeDashoffset = CIRC * (1 - left / total); };
  const stop = () => { clearInterval(iv); iv = null; bgo.textContent = '▶'; };
  const start = () => { if (left <= 0) left = total; tm.classList.remove('done'); bgo.textContent = '❚❚'; try { ACT = ACT || new (window.AudioContext || window.webkitAudioContext)(); ACT.resume(); } catch (e) {} iv = setInterval(() => { left--; draw(); if (left === 60) tone(520, .2); if (left <= 0) { stop(); tm.classList.add('done'); tone(660, .3); setTimeout(() => tone(880, .4), 320); const sl = tm.closest('.slide'); if (sl.classList.contains('on')) say(sl, '¡Tiempo! Cierren la idea, guarden lo que tienen y pasemos a la siguiente fase.'); } }, 1000); };
  tm.addEventListener('click', e => { const a = e.target.dataset.a; if (!a) return; if (a === 'go') iv ? stop() : start(); if (a === 'rs') { stop(); left = total; tm.classList.remove('done'); } if (a === 'm') left = Math.max(0, left - 60); if (a === 'p') left += 60; draw(); });
  draw();
});

/* ===================== prompts ===================== */
const PROMPTS = {
  '01': ['Arquitecto de universos narrativos', `Actúa como un director creativo especializado en storytelling, worldbuilding y narrativas transmedia.

Necesito convertir la siguiente idea en un universo narrativo original:

IDEA CENTRAL: {idea}
PÚBLICO OBJETIVO: {aud}
PROPÓSITO: {prop}
TONO: {tono}

Desarrolla:
1. Nombre y concepto del universo.
2. Logline de máximo 40 palabras.
3. Sinopsis general.
4. Descripción del mundo y sus reglas.
5. Tres personajes con motivaciones y conflictos.
6. Línea temporal de acontecimientos.
7. Cinco elementos narrativos que puedan expandirse.
8. Identidad estética y dirección de arte.
9. Tres misterios o interrogantes que permitan desarrollar nuevas historias.

No quiero una historia cerrada. Necesito un universo con potencial de crecimiento y expansión narrativa.

Presenta el resultado como una biblia narrativa profesional.`],
  '02': ['Estratega de expansión transmedia', `Actúa como un estratega transmedia y director de contenidos digitales.

Utiliza el universo narrativo que hemos construido y diseña un ecosistema de expansión en cinco plataformas o medios diferentes.

Para cada medio determina:
- Plataforma o formato.
- Función narrativa.
- Contenido específico.
- Información nueva que descubrirá el público.
- Relación con las demás plataformas.
- Nivel de participación de la audiencia.
- Objetivo comunicacional.

CONDICIÓN IMPORTANTE:
Ninguna plataforma debe limitarse a reproducir el contenido de otra. Cada una debe aportar información, perspectiva o experiencia nueva.

Diseña un recorrido para el usuario que permita entrar al universo desde diferentes plataformas sin perder la comprensión de la historia.

Presenta la propuesta en una matriz de expansión transmedia.`],
  '03': ['Productor creativo con IA', `Actúa como un equipo multidisciplinario de producción creativa compuesto por director audiovisual, diseñador gráfico, guionista y estratega digital.

Necesito producir un prototipo de contenido para una de las plataformas de mi universo transmedia.

PLATAFORMA: {plat}
FORMATO: {form}
OBJETIVO: {obj}
AUDIENCIA: {aud}
PERSONAJE O ELEMENTO NARRATIVO: {pers}

Desarrolla:
1. Concepto creativo.
2. Guion o estructura narrativa.
3. Dirección de arte.
4. Storyboard o estructura visual.
5. Prompts especializados para generar los recursos visuales o sonoros necesarios.
6. Recomendaciones de montaje y producción.
7. Llamado a la acción.

Conserva la coherencia con la biblia narrativa, pero aporta una experiencia nueva al universo.

El resultado debe ser viable como prototipo de producción.`],
  '04': ['Auditor de coherencia transmedia', `Actúa como un consultor experto en narrativa transmedia, dirección creativa y evaluación de proyectos digitales.

Analiza nuestro universo y su propuesta de expansión.

Evalúa:
1. Coherencia entre las historias.
2. Diferenciación narrativa de cada plataforma.
3. Continuidad de personajes y acontecimientos.
4. Posibilidades de participación de la audiencia.
5. Calidad y consistencia visual.
6. Viabilidad de producción.
7. Uso crítico y responsable de inteligencia artificial.
8. Posibles problemas de derechos, privacidad, accesibilidad o información no verificada.

Identifica debilidades, contradicciones y oportunidades.

No apruebes automáticamente la propuesta. Cuestiónala como un director creativo que debe garantizar la calidad del proyecto.`]
};
const PH = { idea: '[Escribir aquí]', aud: '[Describir]', prop: '[Entretenimiento, educación, comunicación, publicidad, cultura, etc.]', tono: '[Cinematográfico, documental, fantástico, humorístico, futurista, etc.]', plat: '[Seleccionar]', form: '[Video, podcast, publicación, animación, micrositio, etc.]', obj: '[Describir]', pers: '[Seleccionar]' };
function fillPrompt(id, vals = {}) { return PROMPTS[id][1].replace(/\{(\w+)\}/g, (_, k) => (vals[k] && vals[k].trim()) ? vals[k].trim() : PH[k]); }
let pmCur = '';
function openPrompt(id, vals) { pmCur = fillPrompt(id, vals); $('#pmTitle').textContent = `// PROMPT ${id} · ${PROMPTS[id][0].toUpperCase()}`; $('#pmText').textContent = pmCur; $('#pmMsg').textContent = 'Pégalo en ChatGPT, Gemini o Claude y registra el resultado en tu bitácora de IA.'; $('#pmodal').classList.add('open'); }
$('#pmCopy').onclick = () => copy(pmCur, 'Prompt copiado ✓');
$('#closePm').onclick = () => $('#pmodal').classList.remove('open');

/* prompt boxes (01, 03) */
$$('.prompt-box').forEach(pb => {
  const id = pb.dataset.prompt;
  const F = id === '01'
    ? [['idea', 'Idea central', 'full'], ['aud', 'Público objetivo'], ['prop', 'Propósito'], ['tono', 'Tono', 'full', ['', 'Cinematográfico', 'Documental', 'Fantástico', 'Humorístico', 'Futurista', 'Noir / misterio', 'Poético']]]
    : [['plat', 'Plataforma'], ['form', 'Formato'], ['obj', 'Objetivo', 'full'], ['aud', 'Audiencia'], ['pers', 'Personaje o elemento']];
  pb.innerHTML = `<div class="k">// PROMPT ${id}</div><div class="h">${PROMPTS[id][0]}</div><div class="fl">${F.map(f => `<label class="${f[2] || ''}">${f[1].toUpperCase()}${f[3] ? `<select data-k="${f[0]}">${f[3].map(o => `<option value="${o}">${o || 'Elegir…'}</option>`).join('')}</select>` : `<input data-k="${f[0]}" ${f[0] === 'plat' ? 'list="platList"' : ''}>`}</label>`).join('')}</div><div class="prev"></div><div class="row"><button class="btn bm sm" data-c>Copiar prompt</button><button class="btn ghost sm" data-o>Ver completo</button></div>`;
  const vals = () => { const o = {}; $$('[data-k]', pb).forEach(i => o[i.dataset.k] = i.value); return o; };
  const prev = $('.prev', pb);
  const upd = () => { prev.textContent = fillPrompt(id, vals()); const v = vals(); S['p' + id] = v; if (id === '01') { S.idea = v.idea; S.aud = v.aud; S.prop = v.prop; } save(); };
  $$('[data-k]', pb).forEach(i => { i.addEventListener('input', upd); i.addEventListener('change', upd); });
  $('[data-c]', pb).onclick = () => copy(fillPrompt(id, vals()), 'Prompt copiado ✓');
  $('[data-o]', pb).onclick = () => openPrompt(id, vals());
  pb._load = () => { const v = S['p' + id] || {}; $$('[data-k]', pb).forEach(i => { const k = i.dataset.k; if (id === '01' && ['idea', 'aud', 'prop'].includes(k) && S[k]) i.value = S[k]; else if (v[k]) i.value = v[k]; if (id === '03' && k === 'aud' && !i.value && S.aud) i.value = S.aud; }); upd(); };
  pb._load();
});
document.body.appendChild(h('datalist', { id: 'platList' }, ['Video / cortometraje', 'Instagram', 'TikTok', 'Podcast', 'Web interactiva', 'Juego', 'Comunidad', 'Afiche / impreso', 'Experiencia en vivo'].map(o => `<option value="${o}">`).join('')));
onEnter[19] = () => $$('.prompt-box[data-prompt="01"]').forEach(p => p._load());
onEnter[21] = () => $$('.prompt-box[data-prompt="03"]').forEach(p => p._load());

/* ===================== SLIDE 18: seed ===================== */
(() => {
  const SEEDS = ['Una marca o emprendimiento', 'Una historia de ficción', 'Un personaje original', 'Una problemática social o cultural', 'Un proyecto educativo', 'Una iniciativa ambiental o comunitaria', 'Una experiencia turística o cultural'];
  const TW = ['que guarda un secreto que nadie se atreve a contar', 'que comienza a recibir mensajes del futuro', 'que desaparece una noche sin explicación', 'contada desde el punto de vista de un objeto', 'donde el público tiene la última palabra', 'que solo existe mientras alguien la recuerde', 'que cambia cada vez que alguien la visita', 'con un personaje que no sabe que es ficticio', 'que deja pistas en lugares reales de la ciudad', 'que se cuenta al revés: empieza por el final'];
  const host = $('#seeds'); let sel = S.seed ?? -1;
  SEEDS.forEach((s, i) => { const b = h('button', {}, s); if (i === sel) b.classList.add('on'); b.onclick = () => { sel = i; S.seed = i; save(); $$('button', host).forEach((x, k) => x.classList.toggle('on', k === i)); }; host.appendChild(b); });
  $('#sparkBtn').onclick = () => { const s = sel >= 0 ? SEEDS[sel] : SEEDS[Math.floor(Math.random() * SEEDS.length)]; const t = TW[Math.floor(Math.random() * TW.length)]; const el = $('#sparkTxt'); el.textContent = `${s}… ${t}.`; el.animate([{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'none' }], { duration: 350 }); };
  const ta = $('#ideaTxt'), pr = $('#ideaProp'), au = $('#ideaAud');
  ta.value = S.idea || ''; pr.value = S.prop || ''; au.value = S.aud || '';
  const upd = () => { const n = ta.value.length; $('#ideaCnt').textContent = `${n} / 280 caracteres · máx. 3 líneas`; $('#ideaCnt').style.color = n > 280 ? '#E4007C' : ''; S.idea = ta.value; S.prop = pr.value; S.aud = au.value; save(); };
  [ta, pr, au].forEach(i => i.addEventListener('input', upd)); upd();
})();

/* ===================== SLIDE 19: bible ===================== */
(() => {
  const B = ['Nombre del universo', 'Logline o premisa central', 'Descripción del mundo', 'Personajes y motivaciones', 'Conflicto narrativo', 'Reglas de continuidad', 'Tres misterios expandibles', 'Identidad estética y tono'];
  const host = $('#bible'); S.bible = S.bible || [];
  B.forEach((b, i) => { const d = h('div', { class: 'bib' + (S.bible[i] ? ' ok' : '') }, `<span class="bx">✓</span>${b}`); d.onclick = () => { S.bible[i] = !S.bible[i]; d.classList.toggle('ok', S.bible[i]); save(); if (S.bible.filter(Boolean).length === 8) say(slides[18], '¡Biblia completa! Ahora sí tienen un universo, no solo una idea.'); }; host.appendChild(d); });
})();

/* ===================== SLIDE 20: matrix ===================== */
(() => {
  const FIELDS = [['plat', 'Plataforma o formato', 'input'], ['fun', 'Función narrativa', 'input'], ['cont', 'Contenido específico', 'ta'], ['nueva', 'Información nueva que descubre el público', 'ta'], ['rel', 'Relación con las demás plataformas', 'ta'], ['part', 'Nivel de participación', 'sel'], ['obj', 'Objetivo comunicacional', 'ta']];
  const LV = ['', 'Observa', 'Comparte', 'Comenta', 'Descifra', 'Crea', 'Co-crea'];
  S.mx = S.mx && S.mx.length ? S.mx : [{}, {}, {}];
  let at = 0;
  const tabs = $('#mxTabs'), form = $('#mxForm'), chk = $('#mxCheck');
  form.innerHTML = FIELDS.map(f => `<label ${f[2] === 'ta' && f[0] === 'obj' ? '' : ''}>${f[1].toUpperCase()}${f[2] === 'ta' ? `<textarea data-k="${f[0]}"></textarea>` : f[2] === 'sel' ? `<select data-k="${f[0]}">${LV.map(l => `<option value="${l}">${l || 'Elegir…'}</option>`).join('')}</select>` : `<input data-k="${f[0]}" ${f[0] === 'plat' ? 'list="platList"' : 'list="funList"'}>`}</label>`).join('');
  document.body.appendChild(h('datalist', { id: 'funList' }, ['Descubrimiento', 'Profundización', 'Exploración', 'Participación', 'Conexión emocional', 'Revelación', 'Archivo / memoria'].map(o => `<option value="${o}">`).join('')));
  const filled = r => FIELDS.filter(f => (r[f[0]] || '').trim()).length;
  function renderTabs() {
    tabs.innerHTML = '';
    S.mx.forEach((r, i) => { const b = h('button', { 'data-ti': i, class: (i === at ? 'on ' : '') + (filled(r) === 7 ? 'full' : '') }, `<span>${esc(r.plat || 'Plataforma ' + (i + 1))}</span><i>${filled(r)}/7</i>`); b.onclick = () => { at = i; load(); }; tabs.appendChild(b); });
    const row = h('div', { class: 'row' });
    if (S.mx.length < 5) { const a = h('button', { class: 'btn ghost sm' }, '+ Agregar'); a.onclick = () => { S.mx.push({}); at = S.mx.length - 1; save(); load(); }; row.appendChild(a); }
    if (S.mx.length > 3) { const d = h('button', { class: 'btn ghost sm' }, '− Quitar'); d.onclick = () => { S.mx.splice(at, 1); at = Math.max(0, at - 1); save(); load(); }; row.appendChild(d); }
    tabs.appendChild(row);
  }
  function load() { const r = S.mx[at]; $$('[data-k]', form).forEach(i => i.value = r[i.dataset.k] || ''); renderTabs(); check(); }
  const words = s => new Set((s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/\W+/).filter(w => w.length > 3));
  function check() {
    const full = S.mx.filter(r => filled(r) >= 5).length; const msgs = [];
    msgs.push(full >= 3 ? `<div class="ok">✓ ${full} plataformas desarrolladas</div>` : `<div>${full}/3 plataformas mínimas desarrolladas</div>`);
    for (let i = 0; i < S.mx.length; i++) for (let j = i + 1; j < S.mx.length; j++) {
      const a = S.mx[i], b = S.mx[j], n1 = a.plat || 'P' + (i + 1), n2 = b.plat || 'P' + (j + 1);
      if (a.fun && b.fun && a.fun.trim().toLowerCase() === b.fun.trim().toLowerCase()) msgs.push(`<div class="warn">⚠ ${esc(n1)} y ${esc(n2)} tienen la misma función narrativa.</div>`);
      const A = words(a.cont), B = words(b.cont); if (A.size > 2 && B.size > 2) { const inter = [...A].filter(x => B.has(x)).length; if (inter / Math.min(A.size, B.size) > .6) msgs.push(`<div class="warn">⚠ ${esc(n1)} y ${esc(n2)} parecen repetir contenido.</div>`); }
      const C1 = words(a.nueva), C2 = words(b.nueva); if (C1.size > 2 && C2.size > 2) { const inter = [...C1].filter(x => C2.has(x)).length; if (inter / Math.min(C1.size, C2.size) > .6) msgs.push(`<div class="warn">⚠ ${esc(n1)} y ${esc(n2)} revelan casi lo mismo.</div>`); }
    }
    if (msgs.length === 1 && full >= 3) msgs.push('<div class="ok">✓ Sin repeticiones detectadas</div>');
    chk.innerHTML = '<b>// AUDITORÍA RÁPIDA</b>' + msgs.join('');
  }
  function updTabs() { $$('button[data-ti]', tabs).forEach(b => { const r = S.mx[+b.dataset.ti]; b.querySelector('span').textContent = r.plat || 'Plataforma ' + (+b.dataset.ti + 1); b.querySelector('i').textContent = filled(r) + '/7'; b.classList.toggle('full', filled(r) === 7); }); }
  $$('[data-k]', form).forEach(i => { const f = () => { S.mx[at][i.dataset.k] = i.value; save(); updTabs(); check(); }; i.addEventListener('input', f); i.addEventListener('change', f); });
  $('#mxCopy').onclick = () => { const head = FIELDS.map(f => f[1]).join('\t'); const rows = S.mx.map(r => FIELDS.map(f => (r[f[0]] || '').replace(/\s+/g, ' ')).join('\t')); copy([head, ...rows].join('\n'), 'Matriz copiada ✓ · pégala en una hoja o en Miro'); };
  $('#mxPrompt').onclick = () => openPrompt('02');
  load();
})();

/* ===================== SLIDE 21: prototypes ===================== */
(() => {
  const P = [['img', 'Visual', 'Afiche, portada, key visual, ficha de personaje o pieza editorial.', '#00FFA3'], ['cine', 'Audiovisual', 'Storyboard, teaser, tráiler, secuencia animada o video corto.', '#00F0FF'], ['web', 'Digital o interactivo', 'Publicación social, historia, micrositio, mapa, experiencia web o mecanismo participativo.', '#B04DFF']];
  const host = $('#protos'); S.pr = S.pr || [];
  P.forEach((p, i) => { const d = h('div', { class: 'proto' + (S.pr[i] ? ' ok' : ''), style: `--rc:${p[3]}` }, `<div class="ic">${icon(p[0])}</div><div><div class="k">// PROTOTIPO 0${i + 1}</div><div class="h">${p[1]}</div><div class="p">${p[2]}</div></div><div class="st">${S.pr[i] ? 'LISTO ✓' : 'PENDIENTE'}</div>`);
    d.onclick = () => { S.pr[i] = !S.pr[i]; save(); d.classList.toggle('ok', S.pr[i]); $('.st', d).textContent = S.pr[i] ? 'LISTO ✓' : 'PENDIENTE'; if (S.pr.filter(Boolean).length === 3) say(slides[20], '¡Tres prototipos! Ahora revisen: ¿cada uno cuenta algo que los otros no cuentan?'); };
    host.appendChild(d); });
})();

/* ===================== SLIDE 22: pitch ===================== */
(() => {
  const TOT = 180; let left = TOT, iv = null; const qs = $$('#pq li'); const log = [];
  const draw = () => { $('#pcTime').textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`; $('#pcBar').style.width = ((TOT - left) / TOT * 100) + '%'; const q = Math.min(4, Math.floor((TOT - left) / 36)); qs.forEach((l, i) => { l.classList.toggle('now', iv !== null && i === q); l.classList.toggle('past', i < q && left < TOT); }); $('#pcTime').style.color = left <= 20 ? '#E4007C' : ''; };
  const stop = () => { clearInterval(iv); iv = null; $('#pcGo').textContent = '▶ Iniciar pitch'; draw(); };
  $('#pcGo').onclick = () => { if (iv) return stop(); if (left <= 0) left = TOT; $('#pcGo').textContent = '❚❚ Pausar'; try { ACT = ACT || new (window.AudioContext || window.webkitAudioContext)(); ACT.resume(); } catch (e) {} iv = setInterval(() => { left--; if (left === 20) tone(520, .2); if (left <= 0) { left = 0; stop(); tone(660, .3); setTimeout(() => tone(880, .5), 320); const n = $('#teamName').value.trim() || 'Equipo ' + (log.length + 1); log.push(n); $('#pcLog').textContent = 'Presentaron: ' + log.join(' · '); say(slides[21], `¡Tiempo, ${n}! Grupo: una posibilidad de expansión, una inconsistencia y una oportunidad de participación.`); } draw(); }, 1000); draw(); };
  $('#pcReset').onclick = () => { stop(); left = TOT; draw(); };
  $('#pcNext').onclick = () => { stop(); left = TOT; $('#teamName').value = ''; $('#teamName').focus(); draw(); };
  $('#p04').onclick = () => openPrompt('04');
  draw();
})();

/* ===================== SLIDE 23: dossier ===================== */
(() => {
  const D = [['Biblia narrativa', 'Concepto, sinopsis, personajes, mundo, conflicto y reglas narrativas.'], ['Mapa transmedia', 'Diagrama de conexiones, medios, plataformas y recorrido de la audiencia.'], ['Tres prototipos', 'Tres piezas diferentes, conectadas narrativamente y adaptadas a sus medios.'], ['Bitácora de IA', 'Prompts utilizados, resultados seleccionados y decisiones humanas de edición.'], ['Mecanismo participativo', 'Cómo la audiencia interviene, explora, responde o aporta al universo.'], ['Pitch creativo', 'Presentación oral de tres minutos.']];
  const host = $('#dossier'); S.dz = S.dz || [];
  const upd = () => { const n = S.dz.filter(Boolean).length; $('#dzTxt').textContent = `${n} / 6 listos`; $('#dzBar').style.width = n / 6 * 100 + '%'; return n; };
  D.forEach((d, i) => { const c = h('div', { class: 'dz' + (S.dz[i] ? ' ok' : ''), style: `--rc:${ROT[i % 4]}` }, `<div class="bx">✓</div><div class="n">0${i + 1}</div><div class="h">${d[0]}</div><div class="p">${d[1]}</div>`); c.onclick = () => { S.dz[i] = !S.dz[i]; save(); c.classList.toggle('ok', S.dz[i]); if (upd() === 6) say(slides[22], '¡Dossier completo! Esto ya no es un ejercicio: es un proyecto.'); }; host.appendChild(c); });
  upd();
})();

/* ===================== SLIDE 24: rubric ===================== */
(() => {
  const R = [['Conceptualización y coherencia del universo', 20], ['Estrategia de expansión transmedia', 25], ['Experiencia y participación de la audiencia', 15], ['Uso creativo y crítico de IA', 15], ['Calidad de los prototipos y dirección de arte', 15], ['Presentación y argumentación', 10]];
  const host = $('#rub'), cols = ['#00FFA3', '#00F0FF', '#B04DFF', '#E4007C', '#00FFA3', '#00F0FF'];
  const ins = R.map((r, i) => { const d = h('div', { class: 'rb', style: `--rc:${cols[i]}` }, `<div><b>${r[0]}</b><span class="w">${r[1]}% del total</span></div><input type="range" min="0" max="${r[1]}" value="0"><div class="v"><span>0</span><i>/${r[1]}</i></div>`); host.appendChild(d); const inp = $('input', d); inp.oninput = upd; return inp; });
  function upd() { let t = 0; ins.forEach((i, k) => { t += +i.value; i.style.setProperty('--p', (i.value / R[k][1] * 100) + '%'); i.closest('.rb').querySelector('.v span').textContent = i.value; }); $('#rubTot').textContent = t; return t; }
  $('#rubCopy').onclick = () => { const t = upd(); copy(R.map((r, k) => `${r[0]}: ${ins[k].value}/${r[1]}`).join('\n') + `\nTOTAL: ${t}/100`, 'Evaluación copiada ✓'); };
  $('#rubReset').onclick = () => { ins.forEach(i => i.value = 0); upd(); };
  upd();
})();

/* ===================== close: confetti ===================== */
onEnter[25] = () => { orbPt = { x: 300, y: 420 }; burst(90); };
onEnter[1] = () => { burst(30); };

/* ---------- boot ---------- */
const start = fromHash();
slides[0].classList.add('on');
go(start != null ? start : 0, true);
requestAnimationFrame(frame);
})();
