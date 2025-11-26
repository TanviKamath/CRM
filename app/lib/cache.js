import { redis } from "@/lib/redis";

export async function cacheRemember(key, ttl, callback) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const fresh = await callback();
  await redis.set(key, JSON.stringify(fresh), "EX", ttl);

  return fresh;
}
