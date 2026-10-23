# CertLab MS-700 en español

Esta edición conserva el simulador AB-900 y añade la guía MS-700 aportada por el usuario: 399 preguntas, versión 35.2, de un PDF de 309 páginas.

## Usarlo sin instalar nada

Abra `Simulador-MS-700-Espanol.html` con Chrome o Edge. Ese archivo se entrega por separado e incluye el programa, ambos bancos y todas las figuras. No necesita internet para estudiar ni envía sus respuestas a un servicio externo. No necesita abrir los archivos del proyecto para usar esta edición portátil.

## Opciones

- **Examen aleatorio:** 244 preguntas de selección única o múltiple, con las claves del PDF y calificación automática.
- **Modo estudio:** las 399 preguntas, con explicación y acceso a la solución.
- **Laboratorios de Teams:** 24 tareas. Escriba los pasos o comandos, pulse Mostrar respuesta y compare su procedimiento con la solución de la guía. Marque que lo revisó.
- **Ejercicios visuales:** 100 HOTSPOT y 31 ejercicios de relaciones. Consulte las figuras, escriba sus selecciones y compárelas con la respuesta gráfica. Esta edición usa autoevaluación; no reproduce los controles originales de arrastrar y soltar ni asigna una clave automática a estas imágenes.
- **Certificación:** elija MS-700 o AB-900 en Inicio. Finalice el intento activo antes de cambiar de banco.
- **Banco:** busque por texto, filtre por tipo, marque favoritos y practique las preguntas filtradas.

Las 155 prácticas guiadas no suman ni restan puntos al examen. El resumen distingue las prácticas revisadas de las preguntas calificables. Los laboratorios son ejercicios de procedimiento; no crean un entorno de Microsoft 365 ni ejecutan comandos.

## Traducción y figuras

La traducción al español se preparó con Google Translate con autorización del usuario. Las explicaciones y los casos prácticos están traducidos; los comandos e identificadores detectados se protegen durante la traducción. Los enunciados originales en inglés se pueden consultar dentro de cada pregunta.

Se conservaron 369 figuras originales, incluyendo las tablas y las respuestas gráficas. Se puede ampliar cada figura. El texto leído de las imágenes se ofrece en una transcripción traducida: la imagen conserva su diseño original y sus etiquetas en inglés. La lectura automática puede confundir caracteres, espacios y marcas de selección; para las respuestas gráficas, coteje siempre la imagen original.

Las claves y soluciones se trasladaron de la guía. Esta edición no afirma que todas las soluciones sean técnicamente correctas ni que sus procedimientos sigan vigentes. La puntuación de 100 a 1000 es orientativa y no reproduce la evaluación de Microsoft.

## Archivos entregados

- `Simulador-MS-700-Espanol.html`: edición portátil lista para abrir.
- `CertLab-MS700-proyecto.zip`: código fuente y recursos, listo para continuar en su repositorio.
- `CertLab-MS700-Netlify.zip`: sitio compilado para alojamiento estático.
- `MS-700-espanol.json`: banco completo; las figuras están en el proyecto y en la edición portátil.

## Actualizar su GitHub

1. Descargue y extraiga el ZIP del proyecto.
2. Abra su repositorio AB-900 con GitHub Desktop y copie dentro los archivos del proyecto actualizado, conservando la carpeta `.git` de su repositorio.
3. Revise los cambios, cree un commit y utilice Push origin.
4. Si Netlify está conectado a ese repositorio, use `npm run build` y la carpeta de publicación `dist`. También puede cargar el contenido extraído de `CertLab-MS700-Netlify.zip` mediante la publicación manual de Netlify.

La entrega no modifica ni publica automáticamente su GitHub.

## Desarrollo y comprobación

Requiere Node.js 22.13 o posterior.

```text
npm ci
npm run dev
npm run test:ms700
npm run build
npm run build:portable
```

La edición portátil se genera en `outputs/Simulador-MS-700-Espanol.html` dentro del proyecto. El código de la aplicación no usa un servicio de traducción en tiempo de ejecución.

Los intentos y preferencias se guardan en este navegador. Se conservan los tres resultados más recientes al volver a abrir la aplicación; exporte el historial si desea conservar más. El almacenamiento depende del navegador y del modo de navegación; una ventana privada no conserva los datos al cerrarse.
