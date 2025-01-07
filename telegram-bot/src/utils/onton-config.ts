import { fetchOntonSetting } from "../db/db";

// Initialize config and configProtected as empty objects
let config: { [key: string]: string | null } = {};
let configProtected: { [key: string]: string | null } = {};

(async () => {
  try {
    // Fetch the settings and restructure into config and configProtected
    const { config: cfg, configProtected: cfgProtected } =
      await fetchOntonSetting();

    config = cfg;
    configProtected = cfgProtected;
  } catch (error) {
    console.error("Error fetching Onton settings:", error);
    // Handle the error or use default configurations
  }
})();

export { config, configProtected };
