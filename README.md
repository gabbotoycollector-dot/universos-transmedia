# Universos Transmedia · Semana C 2026C

Taller **Universos transmedia: expansión de contenidos potenciada por IA** — Profe Gabbo · CUN / Programa de Diseño Gráfico.

| Ruta | Qué es |
|---|---|
| `/` | Presentación interactiva de 25 estaciones (proyectar en clase). Flechas para avanzar, `I` mapa, `F` pantalla completa. |
| `/alumno/` | Portal de estudiantes: registro con correo CUN, 6 misiones del laboratorio y certificado PDF por correo. |
| `apps-script/` | Backend (Google Apps Script + Google Sheets + plantilla de certificado en Google Slides). |

## 1 · Publicar en Cloudflare

**Opción A (Pages):** Cloudflare → *Workers & Pages* → *Create* → *Pages* → *Connect to Git* → elegir este repo.
- Framework preset: **None** · Build command: *(vacío)* · Build output directory: **`public`**

**Opción B (Workers con assets):** *Workers & Pages* → *Create* → *Import a repository* → este repo. Usa `wrangler.jsonc` (sin build).

Anota la URL final (ej. `https://universos-transmedia.grafyco-smr.workers.dev`).

## 2 · Backend en Google Apps Script

> Recomendado: hacerlo con la cuenta **@cun.edu.co** (los correos salen institucionales y el límite es de ~1.500 correos/día). Si la administración de la CUN no permite publicar apps web para "Cualquier persona", hazlo con una cuenta Gmail personal (límite ~100 correos/día).

1. Entra a <https://script.new> y nombra el proyecto *Universos Transmedia · Backend*.
2. Pega `apps-script/Code.gs` en `Código.gs`.
3. *Configuración del proyecto* → marca **"Mostrar el archivo de manifiesto appsscript.json"** → pega `apps-script/appsscript.json`.
4. En `Code.gs`, cambia `CFG.SITE_URL` por tu URL de Cloudflare (sin `/` al final).
5. Elige la función **`setup`** → *Ejecutar* → acepta los permisos. En el registro aparecen los enlaces a:
   - la hoja **Universos Transmedia · Registro 2026C** (pestañas Usuarios, Sesiones, Progreso, Respuestas, Certificados),
   - la carpeta de certificados en Drive,
   - la **plantilla del certificado** (Google Slides, editable: cambia diseño, textos o firma; conserva `{{NOMBRE}}`, `{{UNIVERSO}}`, `{{FECHA}}`, `{{CODIGO}}`).
6. Ejecuta **`testCertificate`** para recibir un certificado de prueba en tu correo.
7. *Implementar* → *Nueva implementación* → tipo **Aplicación web** → Ejecutar como: **Yo** · Acceso: **Cualquier persona** → copia la URL que termina en `/exec`.

## 3 · Conectar el portal

En `public/config.js` pega la URL:

```js
window.UT_CONFIG = { API_URL: 'https://script.google.com/macros/s/XXXX/exec', DOMAINS: ['cun.edu.co'] };
```

Haz commit y Cloudflare publica solo. Sin `API_URL`, el portal funciona en **modo demostración** (guarda solo en el navegador).

> Si cambias `Code.gs` después, usa *Implementar → Administrar implementaciones → Editar → Nueva versión* para conservar la misma URL.

## Reglas para el certificado

Se habilita cuando las 6 misiones están completas (validado en el servidor):

1. **Semilla:** equipo, tipo, idea (≥ 20 caracteres), propósito y audiencia.
2. **Biblia narrativa:** 8 campos; logline de máx. 40 palabras.
3. **Mapa transmedia:** mínimo 3 plataformas con los 7 campos.
4. **Prototipos:** visual, audiovisual y digital, cada uno con título, descripción y enlace.
5. **Bitácora de IA:** mínimo 2 entradas completas.
6. **Cierre:** mecanismo participativo y decisión humana (≥ 30 caracteres).

Cada estudiante puede reenviar su certificado hasta 3 veces. El código `UT26C-XXXXXX` queda en la pestaña *Certificados* y el PDF en la carpeta de Drive.

## Seguridad y datos

- Las contraseñas se guardan con hash SHA-256 iterado + sal + *pepper* (en Propiedades del script); nunca en texto plano.
- Solo se aceptan correos de los dominios en `ALLOWED_DOMAINS`.
- "¿Olvidaste tu contraseña?" envía una contraseña temporal al correo (máx. una cada 10 minutos).
- El registro pide autorización para usar nombre y correo en la emisión del certificado.
