import { db } from "@/db/db";
import { giataCity } from "@/db/schema";
import { and, eq, ilike, sql, SQLWrapper } from "drizzle-orm";
import { redisTools } from "@/lib/redisTools";

// Function to get countries
export async function fetchCountries(search?: string) {
  const cacheKey = `countries:${search || 'all'}`;

  // Try to get the cached result
  const cachedResult = await redisTools.getCache(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  const whereOptions: SQLWrapper[] = [eq(giataCity.parentId, 0)];
  if (search) {
    whereOptions.push(ilike(giataCity.title, `%${search}%`));
  }

  const result = await db
      .select()
      .from(giataCity)
      .where(and(...whereOptions))
      .execute();

  // Cache the result
  await redisTools.setCache(cacheKey, result, redisTools.cacheLvl.long);

  return result;
}

// Function to get cities
export async function fetchCities(countryId: number, search?: string) {
  const cacheKey = `cities:${countryId}:${search || 'all'}`;

  // Try to get the cached result
  const cachedResult = await redisTools.getCache(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  const whereOptions: SQLWrapper[] = [eq(giataCity.parentId, countryId)];
  if (search) {
    whereOptions.push(ilike(giataCity.title, `%${search}%`));
  }

  let query = db
      .select()
      .from(giataCity)
      .where(and(...whereOptions));

  if (search) {
    // @ts-expect-error
    query = query.orderBy(sql`similarity(${giataCity.title}, ${search}) DESC`);
  }

  const result = await query.limit(7).execute();

  // Cache the result
  await redisTools.setCache(cacheKey, result, redisTools.cacheLvl.long);

  return result;
}

// Function to get city by ID
export async function fetchCityById(cityId: number) {
  const cacheKey = `city:${cityId}`;

  // Try to get the cached result
  const cachedResult = await redisTools.getCache(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  const result = await db
      .select()
      .from(giataCity)
      .where(eq(giataCity.id, cityId))
      .limit(1)
      .execute()
      .then((results) => results[0]);

  // Cache the result if found
  if (result) {
    await redisTools.setCache(cacheKey, result, redisTools.cacheLvl.long);
  }

  return result;
}
