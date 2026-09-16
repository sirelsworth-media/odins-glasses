const { sendJson } = require("./http.cjs");

function createApiHandler(routes, dynamicRoutes = []) {
  return async function handleApi(request, response) {
    const url = new URL(request.url, "http://127.0.0.1");
    if (!url.pathname.startsWith("/api/")) return false;
    if (request.method !== "GET") {
      sendJson(response, 405, { error: "Method not allowed" });
      return true;
    }
    try {
      const exactRoute = routes[url.pathname];
      const dynamicRoute = dynamicRoutes.find((route) => url.pathname.startsWith(route.prefix));
      if (!exactRoute && !dynamicRoute) {
        sendJson(response, 404, { error: "Not found" });
        return true;
      }
      const body = exactRoute
        ? await exactRoute(url)
        : await dynamicRoute.load(decodeURIComponent(url.pathname.slice(dynamicRoute.prefix.length)), url);
      sendJson(response, 200, body);
    } catch (error) {
      sendJson(response, 502, { error: error instanceof Error ? error.message : "Datenquelle nicht erreichbar" });
    }
    return true;
  };
}

module.exports = { createApiHandler };
