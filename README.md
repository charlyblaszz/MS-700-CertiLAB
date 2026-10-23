# CertLab Microsoft — edición Netlify

## Edición MS-700 en español

Se añadió un selector de certificación que conserva AB-900 y permite estudiar las 399 preguntas MS-700 de la guía aportada. Incluye 244 preguntas con corrección automática, 24 laboratorios de procedimiento y 131 ejercicios visuales con autoevaluación. Consulte [LEEME-MS700.md](./LEEME-MS700.md) para conocer la traducción, sus límites y la edición portátil sin instalación.

Comprobación del banco: `npm run test:ms700`. Edición portátil: `npm run build:portable`.

Simulador de práctica para certificaciones Microsoft construido como una SPA
estática con React, TypeScript, Vite, Material UI, Zustand y Recharts.

Esta edición elimina la capa Vinext/Cloudflare de la versión local anterior y
genera un directorio `dist` estándar, compatible con Netlify.

## Ejecutar localmente

```powershell
npm install
npm run dev
```

Abra `http://localhost:5173`.

## Compilar

```powershell
npm run build
npm run preview
```

## Publicar

Consulte [DEPLOY-NETLIFY.md](./DEPLOY-NETLIFY.md) para subir el proyecto a
GitHub y conectarlo con Netlify.

Netlify utiliza automáticamente:

```text
Build command: npm run build
Publish directory: dist
Node.js: 22.13.0
```

## Funciones

- 88 preguntas normalizadas y copia del banco original.
- Opción única, multiselección, grupos Sí/No, desplegables y relaciones.
- Modo examen, estudio y Pearson VUE.
- Semilla reproducible, navegación libre y preguntas para revisión.
- Calificación exacta o parcial según el tipo.
- Revisión posterior y reintento de errores.
- Buscador, filtros, favoritos y tema claro/oscuro.
- Dashboard, tendencias y recomendaciones.
- Exportación a PDF e historial JSON.
- Persistencia local sin servicios externos.

## Privacidad

Los intentos se guardan solamente en el navegador mediante LocalStorage. No se
sincronizan entre dispositivos. El banco de preguntas forma parte de los
archivos públicos del sitio; no publique contenido confidencial.

> Proyecto de práctica independiente. No está afiliado con Microsoft ni con
> Pearson VUE.
