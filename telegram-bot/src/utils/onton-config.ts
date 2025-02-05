import { fetchOntonSetting } from "../db/db";
import { logger } from "../utils/logger";
import { getCache ,cacheKeys} from "../lib/redisTools";

// Initialize config and configProtected as empty objects
let config: { [key: string]: string | null } = {};
let configProtected: { [key: string]: string | null } = {};

(async () => {
  try {
    // const cachedConfig = await getCache(cacheKeys.ontonSettings);
    // const cachedConfigProtected = await getCache(cacheKeys.ontonSettingsProtected);

    // // If both configurations are cached, return them immediately
    // if (cachedConfig && cachedConfigProtected) {
    //   return { config: cachedConfig, configProtected: cachedConfigProtected };
    // }
    // Fetch the settings and restructure into config and configProtected
    const ontonConfig = await fetchOntonSetting();

    config = ontonConfig.config;
    configProtected = ontonConfig.configProtected;
    
    logger.log('configProtected' , configProtected);
    logger.log('config' , config);

  } catch (error) {
    logger.error("Error fetching Onton settings:", error);
    // Handle the error or use default configurations
  }
})();

export { config, configProtected };
