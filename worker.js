export default {
  async fetch(request, env) {
    // Clonamos la URL para poder modificarla
    const url = new URL(request.url);
    const path = url.pathname;
    // Si es la raíz o una carpeta, añadimos index.html
    if (path === '/' || path.endsWith('/')) {
      url.pathname = `${path}index.html`;
      // Creamos una nueva Request con la URL actualizada
      request = new Request(url.toString(), request);
    }
    // Servimos el fichero desde el binding ASSETS
    return env.ASSETS.fetch(request);
  }
};
