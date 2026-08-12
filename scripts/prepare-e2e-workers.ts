import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const dueAt = new Date(Date.now() - 60_000);

  await db.property.update({
    where: { id: "property-scheduled" },
    data: {
      listingStatus: "scheduled",
      scheduledPublishAt: dueAt,
      publishedAt: null,
    },
  });

  await db.propertyAlert.update({
    where: { id: "alert-instant" },
    data: {
      enabled: true,
      nextRunAt: dueAt,
      lastRunAt: null,
      lastError: null,
    },
  });

  console.log(
    JSON.stringify({
      propertyId: "property-scheduled",
      alertId: "alert-instant",
      dueAt: dueAt.toISOString(),
    })
  );
}

main()
  .catch((error) => {
    console.error("Failed to prepare disposable worker fixtures:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
