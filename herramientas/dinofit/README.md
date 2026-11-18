# DinoFit

Registro privado de peso, composición corporal, actividad y comidas.

## Reescritura de noviembre de 2026

La aplicación actual está implementada en archivos independientes: `index.html`, `app.css`, `app.js` (estado y Supabase), `app-ui.js` (interfaz y gráficos), `app-events.js` (acciones) y `worker.mjs` (servidor de rutas estáticas). No queda código visual antiguo en el documento HTML.

**Uso:** en https://herramientas.zaurio.es/dinofit/ inicia sesión con Google. El calendario en la cabecera controla todas las secciones; las flechas pasan al día anterior o siguiente. El seguimiento actual, desde su fecha seleccionada, presenta la evolución del peso, los 12 indicadores de báscula y el desglose de comidas y actividad. El archivo de pesos anterior continúa accesible en Historial, pero no se une a la curva actual.

Las dos líneas punteadas son **simulaciones**: prolongación lineal de la tendencia de las pesadas de los últimos 14 días y variante con desaceleración hipotética. El selector VR añade el gasto orientativo de sesiones de 15/20 minutos cuatro veces por semana. La línea sólida representa únicamente lecturas reales.

Las 10 opciones rápidas de comida mantienen el editor de cantidades antes de guardar. Las calorías que dependen de productos sin envase confirmado son estimaciones. Se pueden registrar actividades reales, incluidos minutos de Beat Saber y Pistol Whip.

**Importación desde ChatGPT:** abrir un enlace privado en el formato `/dinofit/#import=<base64url>` permite que el navegador recoja un JSON solo en la sesión local del usuario, elimine el fragmento de la barra y, una vez autenticado con Google, añada las fechas de forma no destructiva a su documento privado de Supabase. Conserva campos existentes no mencionados y lecturas adicionales del mismo día. También admite pegar JSON desde Ajustes. El enlace no permite a ChatGPT acceder directamente a Supabase y no incluye datos personales en GitHub. Los únicos datos que se guardan se confirman mediante la sincronización real del documento privado de la cuenta activa.

La base de datos existente `dinofit_documents` utiliza el esquema JSONB `schemaVersion=1` y controles por usuario. No se ha modificado el esquema SQL ni eliminado registros antiguos. El cliente solo utiliza la clave publicable de Supabase.

## Pruebas

```bash
node herramientas/dinofit/tests/rewrite.cjs
```

El test cubre compatibilidad con documento preexistente, interfaz oscura, 12 indicadores, 10 comidas, calendario, proyecciones, archivo histórico y fusión idempotente de mediciones. GitHub Actions ejecuta estas pruebas antes de desplegar el Worker y comprueba que el servidor publica los recursos de la nueva interfaz.

## Operación y publicación

Cloudflare Worker **dinofit** con rutas `herramientas.zaurio.es/dinofit` y `herramientas.zaurio.es/dinofit/*`. GitHub Actions `Publicar DinoFit` despliega únicamente este Worker cuando cambia el directorio en `main`. Requiere secretos ya configurados `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID`; la comprobación posterior solicita el HTML y los recursos CSS/JS de producción.

