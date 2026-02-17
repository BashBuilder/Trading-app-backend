// import { redis } from "../lib/redis.js";

// type ThrottleOptions = {
//   action: string;
//   identifier: string; // email or IP or userId
//   limit: number; // e.g. 5
//   windowSeconds: number; // e.g. 300
// };

// export async function throttle({
//   action,
//   identifier,
//   limit,
//   windowSeconds,
// }: ThrottleOptions): Promise<{ allowed: boolean; retryAfter?: number }> {
//   const key = `throttle:${action}:${identifier}`;

//   const count = await redis.incr(key);

//   if (count === 1) {
//     await redis.expire(key, windowSeconds);
//   }

//   if (count > limit) {
//     const ttl = await redis.ttl(key);
//     return {
//       allowed: false,
//       retryAfter: ttl,
//     };
//   }

//   return { allowed: true };
// }
