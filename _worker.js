export default {
  async fetch(request, env) {

    const url = new URL(request.url)
    const host = url.hostname
    let path = url.pathname

    if (path === "/") path = "/index.html"

    let folder = ""

    if (host === "miercoles.zaurio.es") {
      folder = "/miercoles.zaurio.es"
    }

    if (host === "secretos.zaurio.es") {
      folder = "/secretos.zaurio.es"
    }

    // dominio principal
    if (host === "zaurio.es" || host === "www.zaurio.es") {
      folder = ""
    }

    const assetUrl = new URL(folder + path, url.origin)

    return env.ASSETS.fetch(new Request(assetUrl, request))
  }
}
