import axios from "axios";

export const miniAppClient = axios.create({
  baseURL: `http://${process.env.IP_MINI_APP + ":" + process.env.MINI_APP_PORT}/api/v1`,
  headers: {
    "x-api-key": process.env.ONTON_API_KEY,
  },
});
