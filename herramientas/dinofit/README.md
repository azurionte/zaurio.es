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
