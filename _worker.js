export default {
  async fetch(request, env) {

    const url = new URL(request.url)
    const host = url.hostname

    let path = url.pathname

    if (path === "/") {
      path = "/index.html"
    }

    // routing por subdominio
    if (host.startsWith("secretos.zaurio.es")) {
      path = "/secretos.zaurio.es" + path
    }

    if (host.startsWith("miercoles.zaurio.es")) {
      path = "/miercoles.zaurio.es" + path
    }

    const asset = await env.ASSETS.fetch(
      new Request(url.origin + path, request)
    )

    return asset
  }
}
