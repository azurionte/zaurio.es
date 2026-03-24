export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = url.hostname;
    let path = url.pathname;
    const search = url.search;

    if (path === "/admin" || path === "/admin/" || path === "/admin.html") {
      if (host !== "zaurio.es") {
        return Response.redirect(`https://zaurio.es/admin${url.search}`, 302);
      }
      path = "/admin.html";
    }

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
    } else if (host === "juegos.zaurio.es") {
      folder = "/juegos.zaurio.es";
    } else if (host === "zaurio.es" || host === "www.zaurio.es") {
      folder = "";
    } else {
      return new Response("Host no reconocido", { status: 404 });
    }

    const candidates = [];
    const hasExtension = /\.[a-z0-9]+$/i.test(path.split("/").pop() || "");

    candidates.push(folder + path);
    if (!hasExtension) {
      candidates.push(`${folder + path}.html`);
      candidates.push(`${folder + path}/index.html`);
    }

    for (const candidate of candidates) {
      const assetUrl = new URL(candidate + search, url.origin);
      const response = await env.ASSETS.fetch(new Request(assetUrl, request));
      if (response.status !== 404) {
        return response;
      }
    }

    return new Response("No encontrado", { status: 404 });
  }
};
