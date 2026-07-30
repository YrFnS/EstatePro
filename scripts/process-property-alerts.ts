import { processPropertyAlerts } from "../src/lib/property-alert-matcher";

const requestedLimit = Number(process.env.ALERT_PROCESS_LIMIT || "250");
const limit = Number.isFinite(requestedLimit)
  ? Math.min(500, Math.max(1, Math.floor(requestedLimit)))
  : 250;

try {
  const result = await processPropertyAlerts({ limit });
  console.log(
    JSON.stringify(
      {
        processedAt: new Date().toISOString(),
        ...result,
      },
      null,
      2
    )
  );

  if (result.failed > 0) {
    process.exitCode = 1;
  }
} catch (error) {
  console.error("Failed to process property alerts:", error);
  process.exitCode = 1;
} finally {
  const { db } = await import("../src/lib/db");
  await db.$disconnect();
}
