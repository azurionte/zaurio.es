# DinoFit

Seguimiento de comidas, calorías, despensa, peso y objetivo en español.

## Publicación

URL: https://herramientas.zaurio.es/dinofit/

Este directorio tiene su propio Worker para publicar únicamente las rutas /dinofit y /dinofit/* sin reemplazar las otras herramientas. Desde este directorio: npx wrangler deploy. La página también funciona como activo estático dentro del router principal de Zaurio.

## Supabase

Proyecto compartido con Dinerozaurio: adpjitccwwvlydrtvvqk. Acceso Google con el cliente público, reutilizando la sesión del mismo origen. La lista de redirecciones de Auth debe incluir exactamente https://herramientas.zaurio.es/dinofit/.

Aplicar la migración dinofit_documents antes de publicar en un entorno nuevo. Cada cuenta tiene un documento JSONB con revisión incremental. RLS limita SELECT, INSERT y UPDATE a auth.uid() = user_id; anon no tiene permisos. El guardado compara la revisión leída; ante un conflicto conserva la copia en pantalla y requiere descargarla antes de cargar la nube.

Los datos personales no se incluyen en el HTML ni en Git. Los usuarios nuevos empiezan sin pesajes, comidas, existencias ni objetivos personales. El catálogo de alimentos inicial es editable. Solo la sesión de autenticación se mantiene en el navegador; el seguimiento se almacena en Supabase. JSON y el HTML anterior de Mi ritmo se pueden importar desde Mi cuenta; también se exportan JSON y CSV.

## Verificación

node tests/tracker.cjs

Comprobados en producción: carga con sesión de Google existente, perfil con objetivo 77 guardado y conservado al recargar, vistas de móvil (390 px) y escritorio, políticas de acceso entre usuarios dentro de una transacción revertida.

## Calendario y métricas (rama de revisión)

- El menú de fechas situado arriba permite ir al día anterior, siguiente, elegir una fecha o volver a hoy. Las vistas **Mi día** y **Progreso** respetan la fecha seleccionada.
- El editor de pesadas permite registrar los 12 indicadores de la báscula Arboleaf: peso, grasa corporal, IMC, músculo esquelético, masa muscular, proteína, metabolismo basal, masa libre de grasa, grasa subcutánea, grasa visceral (índice), agua corporal y masa ósea. Hora y nota son opcionales.
- El gráfico principal representa **fecha en el eje X y kg en el eje Y**. Muestra la línea sólida de pesadas reales, una proyección punteada por tendencia de los últimos 14 días si existe, y otra por simulación del balance energético, que puede visualizarse con VR de 0, 15 o 20 minutos cuatro días por semana. Ninguna curva simulada es una medición ni una indicación clínica.
- Las tarjetas de cada indicador de báscula abren su propio histórico.
- Los diez atajos de comida son: café con leche desnatada, loncha de queso light, flan proteico, YoPRO, Activia con cereales 0 %, pollo, ternera, plato mixto, dos hamburguesas de ternera y dos de pollo. Todos abren el editor de cantidades antes de registrar; los valores nutricionales sin etiqueta confirmada son estimaciones.
- El importador en **Importar mediciones preparadas en ChatGPT** acepta una lista JSON de pesadas; comprueba las fechas, los rangos y las duplicidades, pide confirmación y mezcla los campos con los datos ya existentes, sin borrar comidas ni objetivos. No requiere credenciales de ChatGPT. Ejemplo:

```json
[
  {"date": "2026-11-18", "weight": 126.6, "bodyFat": 46.1, "muscleMass": 64.8, "bodyWater": 39.0}
]
```

Esto permite preparar un bloque de mediciones desde una conversación y pegarlas tras revisarlas. No constituye una conexión directa entre ChatGPT y la cuenta autenticada: la sincronización sigue ejecutándose desde la sesión Google del usuario.

Los cambios mantienen `schemaVersion: 1` y la tabla RLS `dinofit_documents`, evitando migraciones destructivas o pérdida de documentos ya guardados. No se añaden mediciones personales al repositorio.

## Pruebas

```sh
node herramientas/dinofit/tests/tracker.cjs
node herramientas/dinofit/tests/calendar.cjs
```

Los tests revisan compatibilidad con documentos antiguos, representación del calendario, doce indicadores, actualización sin borrar métricas, las diez comidas, curvas y la importación no destructiva. GitHub Actions repite ambas pruebas al modificar el directorio.
