export const API_URL = "http://localhost:3000/api";
// WebSocket base — strips `/api` and switches the scheme.
export const WS_URL = API_URL.replace(/^http/, "ws");
