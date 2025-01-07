import { fetchOntonSetting } from "../db/db";

// Initialize config and configProtected as empty objects
let config: { [key: string]: string | null } = {};
let configProtected: { [key: string]: string | null } = {};

console.log("-asdasd----------------------");

(async () => {
  try {
    // Fetch the settings and restructure into config and configProtected
    const ontonConfig = await fetchOntonSetting();

    console.log({
      ontonConfig,
    });

    config = ontonConfig.config;
    configProtected = ontonConfig.configProtected;
  } catch (error) {
    console.error("Error fetching Onton settings:", error);
    // Handle the error or use default configurations
  }
})();

export { config, configProtected };
