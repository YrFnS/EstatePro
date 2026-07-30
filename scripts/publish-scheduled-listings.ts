import { publishScheduledListings } from "../src/lib/scheduled-listings";
import { db } from "../src/lib/db";

const requestedLimit = Number(process.env.LISTING_PUBLISH_LIMIT || "100");
const limit = Number.isFinite(requestedLimit)
  ? Math.min(500, Math.max(1, Math.floor(requestedLimit)))
  : 100;

try {
  const result = await publishScheduledListings(limit);
  console.log(JSON.stringify(result, null, 2));
  if (result.failed > 0) process.exitCode = 1;
} catch (error) {
  console.error("Scheduled listing publisher failed:", error);
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
