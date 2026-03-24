export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = url.hostname;
    let path = url.pathname;

    if (path === "/" || path.endsWith("/")) {
      path = `${path}index.html`;
    }

    let folder = "";

    if (path.startsWith("/shared/")) {
      const assetUrl = new URL(path, url.origin);
      return env.ASSETS.fetch(new Request(assetUrl, request));
    }

    if (host === "miercoles.zaurio.es") {
      folder = "/miercoles.zaurio.es";
    } else if (host === "secretos.zaurio.es") {
      folder = "/secretos.zaurio.es";
    } else if (host === "herramientas.zaurio.es") {
      folder = "/herramientas";
    } else if (host === "zaurio.es" || host === "www.zaurio.es") {
      folder = "";
    } else {
      return new Response("Host no reconocido", { status: 404 });
    }

    const assetUrl = new URL(folder + path, url.origin);
    return env.ASSETS.fetch(new Request(assetUrl, request));
  }
};
