import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { MEDIA_ASSETS } from "../src/lib/media-assets";

if (process.env.SEED_DATABASE !== "estatepro-demo") {
  throw new Error("Set SEED_DATABASE=estatepro-demo to confirm the demo-data reset.");
}

const db = new PrismaClient();
const now = new Date();
const day = 86_400_000;
const image = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=80`;
const propertyImages = [
  image("photo-1600585154340-be6161a56a0c"),
  image("photo-1600607687939-ce8a6c25118c"),
];
const savedSearchSignature = (name: string, filters: Record<string, string>) =>
  createHash("sha256")
    .update(
      JSON.stringify([
        name.trim().toLocaleLowerCase(),
        Object.fromEntries(
          Object.entries(filters).sort(([left], [right]) =>
            left.localeCompare(right),
          ),
        ),
      ]),
    )
    .digest("hex");
const alertSignature = (
  name: string,
  filters: Record<string, string>,
  frequency: string,
) =>
  JSON.stringify([
    name.trim().toLocaleLowerCase(),
    Object.fromEntries(
      Object.entries(filters).sort(([left], [right]) =>
        left.localeCompare(right),
      ),
    ),
    frequency,
  ]);

const tables = [
  "Account",
  "Agent",
  "CommuteProfile",
  "ContactMessage",
  "Conversation",
  "ConversationParticipant",
  "Inquiry",
  "MarketDataPoint",
  "MarketStat",
  "Message",
  "Neighborhood",
  "NewsletterSubscriber",
  "Property",
  "PropertyAlert",
  "PropertyAlertMatch",
  "PropertyAuditLog",
  "PropertyMedia",
  "PropertyTypeConfig",
  "Review",
  "SavedSearch",
  "Session",
  "SiteSetting",
  "Testimonial",
  "Tour",
  "User",
  "UserComparison",
  "UserFavorite",
  "UserNotification",
  "VerificationToken",
] as const;

const listingStates = [
  "draft",
  "pending_review",
  "changes_requested",
  "scheduled",
  "published",
  "rejected",
  "archived",
] as const;

const passwordHash = await bcrypt.hash("DemoPass!2026", 12);

try {
  await db.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe(
        `TRUNCATE TABLE ${tables.map((table) => `"${table}"`).join(", ")} CASCADE`,
      );

      await tx.user.createMany({
        data: [
          {
            id: "user-admin",
            email: "admin@estatepro.test",
            name: "Amina Admin",
            password: passwordHash,
            role: "admin",
            emailVerified: now,
          },
          {
            id: "user-agent",
            email: "agent@estatepro.test",
            name: "Omar Agent",
            password: passwordHash,
            role: "agent",
            emailVerified: now,
            phone: "+971 50 555 0101",
          },
          {
            id: "user-buyer",
            email: "buyer@estatepro.test",
            name: "Layla Buyer",
            password: passwordHash,
            role: "user",
            emailVerified: now,
          },
          {
            id: "user-unverified",
            email: "unverified@estatepro.test",
            name: "Noor Newcomer",
            password: passwordHash,
            role: "user",
          },
        ],
      });
      await tx.account.createMany({
        data: [
          {
            id: "account-buyer-google",
            userId: "user-buyer",
            type: "oauth",
            provider: "google",
            providerAccountId: "demo-google-buyer",
          },
          {
            id: "account-agent-credentials",
            userId: "user-agent",
            type: "credentials",
            provider: "credentials",
            providerAccountId: "agent@estatepro.test",
          },
        ],
      });
      await tx.session.createMany({
        data: [
          {
            id: "session-active",
            sessionToken: "demo-active-session-not-for-auth",
            userId: "user-buyer",
            expires: new Date(now.getTime() + 7 * day),
          },
          {
            id: "session-expired",
            sessionToken: "demo-expired-session-not-for-auth",
            userId: "user-unverified",
            expires: new Date(now.getTime() - day),
          },
        ],
      });
      await tx.verificationToken.create({
        data: {
          identifier: "unverified@estatepro.test",
          token: "expired-demo-verification-token",
          expires: new Date(now.getTime() - day),
        },
      });

      await tx.agent.createMany({
        data: [
          {
            id: "agent-omar",
            nameEn: "Omar Al-Hassan",
            nameAr: "عمر الحسن",
            titleEn: "Senior Residential Agent",
            titleAr: "وكيل عقارات سكنية أول",
            bioEn: "Bilingual residential specialist with twelve years of local market experience.",
            bioAr: "متخصص عقاري سكني ثنائي اللغة بخبرة اثني عشر عاماً في السوق المحلي.",
            email: "agent@estatepro.test",
            phone: "+971 50 555 0101",
            image: image("photo-1500648767791-00dcc994a43e"),
            specialization: "residential",
            experience: 12,
            propertiesCount: listingStates.length,
            rating: 4.9,
          },
          {
            id: "agent-maya",
            nameEn: "Maya Chen",
            nameAr: "مايا تشن",
            titleEn: "Commercial Property Advisor",
            titleAr: "مستشارة عقارات تجارية",
            email: "maya@estatepro.test",
            phone: "+971 50 555 0102",
            image: image("photo-1494790108377-be9c29b29330"),
            specialization: "commercial",
            experience: 7,
            propertiesCount: 1,
            rating: 4.5,
          },
        ],
      });

      const propertyData = listingStates.map((listingStatus, index) => {
        const published = listingStatus === "published";
        const scheduled = listingStatus === "scheduled";
        return {
          id: `property-${listingStatus}`,
          titleEn: `${listingStatus.replaceAll("_", " ")} demo home`,
          titleAr: `منزل تجريبي ${index + 1}`,
          descriptionEn:
            index === 0
              ? "Draft listing intentionally missing polish while retaining valid database fields."
              : "A coherent bilingual demonstration listing with generous rooms, daylight, transit access, and realistic lifecycle history.",
          descriptionAr:
            "عقار تجريبي متكامل ثنائي اللغة مع غرف واسعة وإضاءة طبيعية وسجل واقعي لحالة الإعلان.",
          price: index === 0 ? 1 : published && index % 2 ? 2_750 : 350_000 + index * 125_000,
          type: ["apartment", "villa", "house", "condo", "townhouse", "penthouse", "apartment"][index],
          status: published && index % 2 ? "rent" : "sale",
          bedrooms: index === 0 ? 0 : (index % 5) + 1,
          bathrooms: index === 0 ? 0 : (index % 4) + 1,
          area: index === 0 ? 1 : 700 + index * 350,
          locationEn: index % 2 ? "Dubai Marina, Dubai" : "Downtown, Dubai",
          locationAr: index % 2 ? "دبي مارينا، دبي" : "وسط مدينة دبي",
          addressEn: `${100 + index} Demo Boulevard`,
          addressAr: `${100 + index} شارع تجريبي`,
          cityEn: "Dubai",
          cityAr: "دبي",
          images: propertyImages.join(","),
          features: index === 0 ? "" : "Parking,Balcony,Security,Pool",
          yearBuilt: index === 0 ? null : 2018 + index,
          parking: index === 0 ? 0 : index % 3,
          featured: published,
          badge: published ? "new" : null,
          lat: index === 0 ? null : 25.2048 + index / 100,
          lng: index === 0 ? null : 55.2708 + index / 100,
          virtualTourUrl: published ? "https://my.matterport.com/show/?m=demo" : null,
          virtualTourImages: published ? propertyImages.join(",") : null,
          agentId: index === 6 ? "agent-maya" : "agent-omar",
          listingStatus,
          ownerUserId: index === 6 ? "user-buyer" : "user-agent",
          createdByUserId: index === 6 ? "user-buyer" : "user-agent",
          reviewedByUserId: ["changes_requested", "scheduled", "published", "rejected", "archived"].includes(listingStatus)
            ? "user-admin"
            : null,
          reviewNotes:
            listingStatus === "changes_requested"
              ? "Add a floor plan and clarify the service charge."
              : listingStatus === "rejected"
                ? "Duplicate ownership evidence was not accepted."
                : null,
          submittedAt: listingStatus === "draft" ? null : new Date(now.getTime() - 5 * day),
          reviewedAt: ["changes_requested", "scheduled", "published", "rejected", "archived"].includes(listingStatus)
            ? new Date(now.getTime() - 4 * day)
            : null,
          publishedAt: published ? new Date(now.getTime() - 3 * day) : null,
          rejectedAt: listingStatus === "rejected" ? new Date(now.getTime() - 3 * day) : null,
          archivedAt: listingStatus === "archived" ? new Date(now.getTime() - 2 * day) : null,
          scheduledPublishAt: scheduled ? new Date(now.getTime() + 2 * day) : null,
        };
      });
      await tx.property.createMany({ data: propertyData });

      await tx.propertyMedia.createMany({
        data: [
          { id: "media-cover", propertyId: "property-published", url: propertyImages[0], source: "external", type: "image", mimeType: "image/jpeg", sortOrder: 0, isCover: true },
          { id: "media-gallery", propertyId: "property-published", url: propertyImages[1], source: "external", type: "image", mimeType: "image/jpeg", sortOrder: 1 },
          { id: "media-video", propertyId: "property-pending_review", url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", source: "external", type: "video", mimeType: "video/mp4", sortOrder: 0 },
          { id: "media-floorplan", propertyId: "property-changes_requested", url: propertyImages[1], source: "external", type: "floorplan", mimeType: "image/jpeg", sortOrder: 0 },
          { id: "media-document", propertyId: "property-draft", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", source: "external", type: "document", mimeType: "application/pdf", sortOrder: 0 },
        ],
      });
      await tx.propertyAuditLog.createMany({
        data: listingStates.map((listingStatus, index) => ({
          id: `audit-${listingStatus}`,
          propertyId: `property-${listingStatus}`,
          actorUserId: index === 0 ? "user-agent" : "user-admin",
          actorName: index === 0 ? "Omar Agent" : "Amina Admin",
          action: index === 0 ? "listing_created" : `listing_${listingStatus}`,
          previousStatus: index === 0 ? null : "pending_review",
          newStatus: listingStatus,
          metadata: { source: "demo_seed", edgeCase: index === 0 },
        })),
      });

      await tx.inquiry.createMany({ data: [
        { id: "inquiry-property", name: "Layla Buyer", email: "buyer@estatepro.test", phone: "+971 50 555 0199", message: "Is the published home available this weekend?", propertyId: "property-published" },
        { id: "inquiry-general", name: "Walk-in Visitor", email: "visitor@example.test", message: "Please suggest an accessible rental." },
      ] });
      await tx.contactMessage.createMany({ data: [
        { id: "contact-complete", name: "Rami Visitor", email: "rami@example.test", phone: "+971 50 555 0188", subject: "Relocation", message: "I am relocating with my family next quarter." },
        { id: "contact-minimal", name: "Sara Visitor", email: "sara@example.test", message: "Please call me about rental options." },
      ] });
      await tx.review.createMany({ data: [
        { id: "review-five", propertyId: "property-published", authorName: "Happy Resident", rating: 5, comment: "Accurate listing and excellent viewing." },
        { id: "review-one", propertyId: "property-published", authorName: "Critical Visitor", rating: 1, comment: "The viewing slot was too short." },
      ] });
      await tx.newsletterSubscriber.createMany({ data: [
        { id: "newsletter-one", email: "subscriber@example.test" },
        { id: "newsletter-two", email: "buyer@estatepro.test" },
      ] });
      await tx.tour.createMany({ data: ["pending", "confirmed", "completed", "cancelled"].map((status, index) => ({
        id: `tour-${status}`,
        propertyId: "property-published",
        name: `${status} visitor`,
        email: `${status}@example.test`,
        phone: `+971 50 555 02${index}0`,
        date: new Date(now.getTime() + (index + 1) * day).toISOString().slice(0, 10),
        time: `${10 + index}:00`,
        notes: index === 0 ? null : `Demo ${status} tour`,
        tourType: index % 2 ? "virtual" : "in-person",
        status,
      })) });

      await tx.userFavorite.createMany({ data: [
        { id: "favorite-buyer", userId: "user-buyer", propertyId: "property-published" },
        { id: "favorite-agent", userId: "user-agent", propertyId: "property-scheduled" },
      ] });
      await tx.userComparison.createMany({ data: [
        { id: "comparison-one", userId: "user-buyer", propertyId: "property-published", position: 0 },
        { id: "comparison-two", userId: "user-buyer", propertyId: "property-scheduled", position: 1 },
        { id: "comparison-three", userId: "user-buyer", propertyId: "property-pending_review", position: 2 },
      ] });

      const saleFilters = { status: "sale", city: "Dubai", maxPrice: "1000000" };
      const rentFilters = { status: "rent", bedrooms: "2" };
      await tx.savedSearch.createMany({ data: [
        { id: "search-sale", userId: "user-buyer", name: "Dubai homes under 1M", filters: saleFilters, signature: savedSearchSignature("Dubai homes under 1M", saleFilters), notificationsEnabled: true },
        { id: "search-rent", userId: "user-buyer", name: "Two-bedroom rentals", filters: rentFilters, signature: savedSearchSignature("Two-bedroom rentals", rentFilters), notificationsEnabled: false },
      ] });
      await tx.userNotification.createMany({ data: [
        { id: "notification-unread", userId: "user-buyer", sourceId: "match-sale", type: "property_alert", title: "A new match is available", message: "A published home now matches your saved search.", actionUrl: "/properties/property-published", read: false },
        { id: "notification-read", userId: "user-buyer", sourceId: "tour-confirmed", type: "tour", title: "Tour confirmed", message: "Your virtual tour is confirmed.", actionUrl: "/my-tours", read: true },
      ] });
      await tx.propertyAlert.createMany({ data: [
        { id: "alert-instant", userId: "user-buyer", savedSearchId: "search-sale", name: "Instant Dubai matches", filters: saleFilters, signature: alertSignature("Instant Dubai matches", saleFilters, "instant"), frequency: "instant", enabled: true, currentMatchCount: 1, lastRunAt: new Date(now.getTime() - day), lastMatchedAt: now, nextRunAt: new Date(now.getTime() + day) },
        { id: "alert-daily", userId: "user-buyer", name: "Daily rentals", filters: rentFilters, signature: alertSignature("Daily rentals", rentFilters, "daily"), frequency: "daily", enabled: false, lastError: "Demo paused alert" },
        { id: "alert-weekly", userId: "user-agent", name: "Weekly premium homes", filters: { featured: "true" }, signature: alertSignature("Weekly premium homes", { featured: "true" }, "weekly"), frequency: "weekly", enabled: true, nextRunAt: new Date(now.getTime() + 7 * day) },
      ] });
      await tx.propertyAlertMatch.create({ data: { id: "alert-match-sale", alertId: "alert-instant", propertyId: "property-published", matchedAt: now } });

      await tx.conversation.createMany({ data: [
        { id: "conversation-property", propertyId: "property-published" },
        { id: "conversation-general" },
      ] });
      await tx.conversationParticipant.createMany({ data: [
        { id: "participant-property-buyer", conversationId: "conversation-property", userId: "user-buyer" },
        { id: "participant-property-agent", conversationId: "conversation-property", userId: "user-agent" },
        { id: "participant-general-admin", conversationId: "conversation-general", userId: "user-admin" },
        { id: "participant-general-agent", conversationId: "conversation-general", userId: "user-agent" },
      ] });
      await tx.message.createMany({ data: [
        { id: "message-read", conversationId: "conversation-property", senderId: "user-buyer", content: "Is Saturday morning available?", read: true },
        { id: "message-unread", conversationId: "conversation-property", senderId: "user-agent", content: "Yes, I can confirm 10:00 AM.", read: false },
        { id: "message-general", conversationId: "conversation-general", senderId: "user-admin", content: "Please review the new moderation queue.", read: false },
      ] });
      await tx.commuteProfile.createMany({ data: ["driving", "transit", "walking", "cycling"].map((transportMode, index) => ({
        id: `commute-${transportMode}`,
        userId: "user-buyer",
        destinationName: ["Office", "Metro", "School", "Park"][index],
        destinationLat: 25.19 + index / 100,
        destinationLng: 55.27 + index / 100,
        transportMode,
      })) });

      await tx.siteSetting.createMany({ data: [
        { id: "setting-hero-title", key: "hero.title", valueEn: "Find your place in Dubai", valueAr: "اعثر على مكانك في دبي", category: "hero", type: "text" },
        { id: "setting-hero-subtitle", key: "hero.subtitle", valueEn: "Verified homes for every stage of your move.", valueAr: "منازل موثوقة لكل مرحلة من انتقالك.", category: "hero", type: "text" },
        { id: "setting-site-name", key: "general.siteName", valueEn: "EstatePro", valueAr: "EstatePro", category: "general", type: "text" },
        { id: "setting-stat-properties", key: "stats.propertiesSold", valueEn: "1,200+", valueAr: "+١٬٢٠٠", category: "stats", type: "number" },
        { id: "setting-contact", key: "footer.email", valueEn: "hello@estatepro.test", valueAr: "hello@estatepro.test", category: "footer", type: "text" },
        { id: "setting-seo", key: "seo.description", valueEn: "Bilingual real estate discovery and listing management.", valueAr: "منصة ثنائية اللغة لاكتشاف وإدارة العقارات.", category: "seo", type: "text" },
        { id: "setting-theme", key: "theme.primaryColor", valueEn: "#0f766e", valueAr: "#0f766e", category: "general", type: "color" },
        { id: "setting-enabled", key: "general.showMarketStats", valueEn: "true", valueAr: "true", category: "general", type: "boolean" },
      ] });
      await tx.testimonial.createMany({ data: [
        { id: "testimonial-featured", authorEn: "Fatima Al-Nouri", authorAr: "فاطمة النوري", roleEn: "Home buyer", roleAr: "مشتري منزل", contentEn: "The bilingual guidance made our purchase simple.", contentAr: "جعلت الإرشادات ثنائية اللغة عملية الشراء سهلة.", avatar: image("photo-1534528741775-53994a69daeb"), rating: 5, featured: true, sortOrder: 1 },
        { id: "testimonial-critical", authorEn: "David Lee", authorAr: "ديفيد لي", roleEn: "Renter", roleAr: "مستأجر", contentEn: "Useful filters, though I wanted more viewing times.", contentAr: "مرشحات مفيدة، لكنني رغبت في أوقات مشاهدة أكثر.", avatar: MEDIA_ASSETS.avatarFallback, rating: 3, featured: false, sortOrder: 2 },
      ] });
      await tx.neighborhood.createMany({ data: [
        { id: "neighborhood-downtown", nameEn: "Downtown Dubai", nameAr: "وسط مدينة دبي", descEn: "Walkable towers, restaurants, and direct metro access.", descAr: "أبراج ومطاعم ومسارات مشاة مع وصول مباشر للمترو.", avgPrice: "AED 1.2M", propertyCount: 145, searchQuery: "Downtown Dubai", image: image("photo-1512453979798-5ea266f8880c"), featured: true, sortOrder: 1 },
        { id: "neighborhood-marina", nameEn: "Dubai Marina", nameAr: "دبي مارينا", descEn: "Waterfront living with family and nightlife options.", descAr: "حياة بحرية مع خيارات عائلية وترفيهية.", avgPrice: "AED 1.6M", propertyCount: 98, searchQuery: "Dubai Marina", image: image("photo-1526495124232-a04e1849168c"), featured: false, sortOrder: 2 },
      ] });
      await tx.propertyTypeConfig.createMany({ data: [
        ["Apartment", "شقة", "apartment", "Building2"],
        ["Villa", "فيلا", "villa", "Castle"],
        ["House", "منزل", "house", "Home"],
        ["Condo", "شقة ملكية", "condo", "Building"],
        ["Townhouse", "تاون هاوس", "townhouse", "Warehouse"],
        ["Penthouse", "بنتهاوس", "penthouse", "Crown"],
      ].map(([nameEn, nameAr, type, icon], index) => ({ id: `property-type-${type}`, nameEn, nameAr, type, icon, listingCount: propertyData.filter((property) => property.type === type).length, featured: index < 4, sortOrder: index + 1 })) });
      await tx.marketDataPoint.createMany({ data: [
        { id: "market-monthly", label: "Aug", value: 485, period: "monthly" },
        { id: "market-quarterly", label: "Q3", value: 492, period: "quarterly" },
        { id: "market-yearly", label: "2026", value: 510, period: "yearly" },
      ] });
      await tx.marketStat.createMany({ data: [
        { id: "market-stat-up", labelEn: "Average price", labelAr: "متوسط السعر", value: "AED 1.3M", change: "+4.2%", changeType: "up", sortOrder: 1 },
        { id: "market-stat-down", labelEn: "Days on market", labelAr: "أيام في السوق", value: "28", change: "-3 days", changeType: "down", sortOrder: 2 },
        { id: "market-stat-neutral", labelEn: "Active inventory", labelAr: "المخزون النشط", value: "2,450", change: "0%", changeType: "neutral", sortOrder: 3 },
      ] });
    },
    { timeout: 60_000 },
  );

  const counts = Object.fromEntries(
    await Promise.all(
      tables.map(async (table) => {
        const [{ count }] = await db.$queryRawUnsafe<Array<{ count: number }>>(
          `SELECT COUNT(*)::int AS count FROM "${table}"`,
        );
        return [table, count] as const;
      }),
    ),
  );
  const empty = Object.entries(counts).filter(([, count]) => count === 0);
  if (empty.length) throw new Error(`Unseeded tables: ${empty.map(([table]) => table).join(", ")}`);
  console.log(JSON.stringify({ database: "estatepro-demo", counts }, null, 2));
} finally {
  await db.$disconnect();
}
