import { MEDIA_ASSETS } from "@/lib/media-assets";

// ============================================================================
// Settings Helper Module
// Provides SERVER-SIDE functions to fetch SiteSetting values from Prisma and a
// DEFAULTS constant for safe fallbacks. Client components should use the
// dedicated settings hook instead of importing the database helpers below.
// ============================================================================

export const SETTINGS_DEFAULTS: Record<string, string> = {
  app_name: "EstatePro",
  app_description: "Discover your perfect property with EstatePro",
  site_url: "https://estatepro.app",
  founding_year: "2010",
  contact_address: "123 Real Estate Ave, Suite 100\nNew York, NY 10001",
  contact_phone: "+1 (555) 123-4567",
  contact_email: "info@estatepro.com",
  contact_lat: "40.720",
  contact_lng: "-73.990",
  social_facebook: "#",
  social_twitter: "#",
  social_instagram: "#",
  social_linkedin: "#",
  social_youtube: "#",
  hero_stat_properties_sold: "12K+",
  hero_stat_customer_rating: "98%",
  hero_stat_expert_agents: "250+",
  hero_image: MEDIA_ASSETS.hero,
  testimonial_quote_en:
    "EstatePro made finding our dream home an absolute breeze. The search tools are incredibly intuitive and the agents were super helpful throughout the entire process.",
  testimonial_quote_ar:
    "جعلت إستيت برو العثور على منزل أحلامنا أمراً سهلاً للغاية. أدوات البحث بديهية بشكل لا يصدق وكان الوكلاء مفيدين جداً طوال العملية بأكملها.",
  testimonial_name_en: "Sarah Johnson",
  testimonial_name_ar: "سارة جونسون",
  testimonial_role_en: "Home Buyer",
  testimonial_role_ar: "مشتري منزل",
  market_avg_home_price: "$685,000",
  market_avg_home_price_change: "+5.2%",
  market_inventory: "2,450",
  market_inventory_change: "-12%",
  market_days_on_market: "34",
  market_days_on_market_change: "-8%",
  market_avg_price: "562000",
  market_avg_price_change: "8.5%",
  market_median_price: "485000",
  market_median_price_change: "6.2%",
  market_price_per_sqft: "285",
  market_price_per_sqft_change: "4.8%",
  market_inventory_level: "1247",
  market_inventory_level_change: "-3.2%",
  market_activity_score: "78",
  market_activity_score_change: "5.1%",
  mortgage_default_rate: "6.5",
  mortgage_default_term: "30",
  mortgage_default_down: "20",
  placeholder_image: MEDIA_ASSETS.propertyFallback,
};

/** Get a single English setting value by key (server-side only). */
export async function getSetting(key: string): Promise<string | null> {
  const { db } = await import("@/lib/db");
  const setting = await db.siteSetting.findUnique({ where: { key } });
  return setting?.valueEn ?? null;
}

/** Get all English setting values as a key-value map (server-side only). */
export async function getSettings(): Promise<Record<string, string>> {
  const { db } = await import("@/lib/db");
  const settings = await db.siteSetting.findMany();
  return Object.fromEntries(
    settings.map((setting) => [setting.key, setting.valueEn])
  );
}

/** Get English settings filtered by category (server-side only). */
export async function getSettingsByGroup(
  group: string
): Promise<Record<string, string>> {
  const { db } = await import("@/lib/db");
  const settings = await db.siteSetting.findMany({
    where: { category: group },
  });
  return Object.fromEntries(
    settings.map((setting) => [setting.key, setting.valueEn])
  );
}
