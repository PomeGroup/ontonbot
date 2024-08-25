import { db } from "@/db/db";
import { ontoSetting } from "@/db/schema";
import { eq } from "drizzle-orm";

import { cacheKeys, getCache, setCache } from "@/lib/cache";

type Environment = "development" | "production" | "staging" | "local";

export async function fetchOntonSettings() {
  // Try to fetch non-protected settings from cache
  const cachedConfig = getCache(cacheKeys.ontonSettings);
  const cachedConfigProtected = getCache(cacheKeys.ontonSettingsProtected);

  // If both configurations are cached, return them immediately
  if (cachedConfig && cachedConfigProtected) {
    return { config: cachedConfig, configProtected: cachedConfigProtected };
  }

  let config: { [key: string]: string | null } = {};
  let configProtected: { [key: string]: string | null } = {};

  // Validate ENV value
  if (
    !["development", "production", "staging", "local"].includes(
      process.env.ENV!
    )
  ) {
    throw new Error("Invalid ENV");
  }
  const env = process.env.ENV as Environment;

  const settings = await db
    .select()
    .from(ontoSetting)
    .where(eq(ontoSetting.env, env))
    .execute();
  // Categorize settings based on the protected flag
  settings.forEach((setting) => {
    const key = `${setting.var}`;
    if (setting.protected === true) {
      configProtected[key] = setting.value;
    } else {
      config[key] = setting.value;
    }
  });

  // Cache the results separately
  setCache(cacheKeys.ontonSettings, config, 600);
  setCache(cacheKeys.ontonSettingsProtected, configProtected, 600);

  return { config, configProtected };
}
