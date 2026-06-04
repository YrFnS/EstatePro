// ============================================================================
// Settings Helper Module
// Provides SERVER-SIDE functions to fetch settings from the database
// and a DEFAULTS constant for client-side fallback values
//
// IMPORTANT: The async functions in this file (getSetting, getSettings, getSettingsByGroup)
// can ONLY be used in server-side code (API routes, server components, server actions).
// They import db which uses fs/path and cannot be bundled for the client.
//
// For client-side code, use the useSettings hook from @/lib/use-settings instead.
// ============================================================================

/**
 * Default settings values for client-side fallback when settings
 * haven't been loaded yet or are missing from the database.
 */
export const SETTINGS_DEFAULTS: Record<string, string> = {
  // General Group
  app_name: "EstatePro",
  app_description: "Discover your perfect property with EstatePro",
  site_url: "https://estatepro.app",
  founding_year: "2010",

  // Contact Group
  contact_address: "123 Real Estate Ave, Suite 100\nNew York, NY 10001",
  contact_phone: "+1 (555) 123-4567",
  contact_email: "info@estatepro.com",
  contact_lat: "40.720",
  contact_lng: "-73.990",

  // Social Group
  social_facebook: "#",
  social_twitter: "#",
  social_instagram: "#",
  social_linkedin: "#",
  social_youtube: "#",

  // Hero/Stats Group
  hero_stat_properties_sold: "12K+",
  hero_stat_customer_rating: "98%",
  hero_stat_expert_agents: "250+",
  hero_image: "/hero-image.png",
  testimonial_quote_en:
    "EstatePro made finding our dream home an absolute breeze. The search tools are incredibly intuitive and the agents were super helpful throughout the entire process.",
  testimonial_quote_ar:
    "جعلت إستيت برو العثور على منزل أحلامنا أمراً سهلاً للغاية. أدوات البحث بديهية بشكل لا يصدق وكان الوكلاء مفيدين جداً طوال العملية بأكملها.",
  testimonial_name_en: "Sarah Johnson",
  testimonial_name_ar: "سارة جونسون",
  testimonial_role_en: "Home Buyer",
  testimonial_role_ar: "مشتري منزل",

  // Market Group
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

  // Mortgage Group
  mortgage_default_rate: "6.5",
  mortgage_default_term: "30",
  mortgage_default_down: "20",

  // Appearance Group
  placeholder_image:
    "https://placehold.co/800x600/e2e8f0/64748b?text=No+Image",
};

/**
 * Get a single setting value by key (SERVER-SIDE ONLY)
 */
export async function getSetting(key: string): Promise<string | null> {
  const { db } = await import("@/lib/db");
  const setting = await db.setting.findUnique({ where: { key } });
  return setting?.value ?? null;
}

/**
 * Get all settings as a key-value map (SERVER-SIDE ONLY)
 */
export async function getSettings(): Promise<Record<string, string>> {
  const { db } = await import("@/lib/db");
  const settings = await db.setting.findMany();
  return Object.fromEntries(settings.map((s) => [s.key, s.value]));
}

/**
 * Get settings filtered by group as a key-value map (SERVER-SIDE ONLY)
 */
export async function getSettingsByGroup(
  group: string
): Promise<Record<string, string>> {
  const { db } = await import("@/lib/db");
  const settings = await db.setting.findMany({ where: { group } });
  return Object.fromEntries(settings.map((s) => [s.key, s.value]));
}
