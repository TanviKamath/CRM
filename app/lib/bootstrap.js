import axios from "axios";

axios.defaults.withCredentials = true;
axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";

// ⛔ REMOVE Laravel backend URL
// ⛔ Do NOT set a baseURL for Next.js API routes
axios.defaults.baseURL = ""; 

export default axios;
