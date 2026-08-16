export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/shared/')) {
      const target = new URL(url.pathname + url.search, 'https://zaurio.es');
      return fetch(new Request(target, request));
    }

    return env.ASSETS.fetch(request);
  }
};
