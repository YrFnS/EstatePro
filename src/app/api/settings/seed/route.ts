import { NextResponse } from "next/server";

const DEFAULT_SETTINGS = [
  // General Group
  { key: "app_name", value: "EstatePro", group: "general", label: "App Name" },
  { key: "app_description", value: "Discover your perfect property with EstatePro", group: "general", label: "App Description" },
  { key: "site_url", value: "https://estatepro.app", group: "general", label: "Site URL" },
  { key: "founding_year", value: "2010", group: "general", label: "Founding Year" },

  // Contact Group
  { key: "contact_address", value: "123 Real Estate Ave, Suite 100\nNew York, NY 10001", group: "contact", label: "Address" },
  { key: "contact_phone", value: "+1 (555) 123-4567", group: "contact", label: "Phone" },
  { key: "contact_email", value: "info@estatepro.com", group: "contact", label: "Email" },
  { key: "contact_lat", value: "40.720", group: "contact", label: "Map Latitude" },
  { key: "contact_lng", value: "-73.990", group: "contact", label: "Map Longitude" },

  // Social Group
  { key: "social_facebook", value: "#", group: "social", label: "Facebook URL" },
  { key: "social_twitter", value: "#", group: "social", label: "Twitter/X URL" },
  { key: "social_instagram", value: "#", group: "social", label: "Instagram URL" },
  { key: "social_linkedin", value: "#", group: "social", label: "LinkedIn URL" },
  { key: "social_youtube", value: "#", group: "social", label: "YouTube URL" },

  // Hero/Stats Group
  { key: "hero_stat_properties_sold", value: "12K+", group: "hero", label: "Properties Sold Stat" },
  { key: "hero_stat_customer_rating", value: "98%", group: "hero", label: "Customer Rating Stat" },
  { key: "hero_stat_expert_agents", value: "250+", group: "hero", label: "Expert Agents Stat" },
  { key: "hero_image", value: "/hero-image.png", group: "hero", label: "Hero Background Image" },
  { key: "testimonial_quote_en", value: "EstatePro made finding our dream home an absolute breeze. The search tools are incredibly intuitive and the agents were super helpful throughout the entire process.", group: "hero", label: "Testimonial Quote (EN)" },
  { key: "testimonial_quote_ar", value: "جعلت إستيت برو العثور على منزل أحلامنا أمراً سهلاً للغاية. أدوات البحث بديهية بشكل لا يصدق وكان الوكلاء مفيدين جداً طوال العملية بأكملها.", group: "hero", label: "Testimonial Quote (AR)" },
  { key: "testimonial_name_en", value: "Sarah Johnson", group: "hero", label: "Testimonial Name (EN)" },
  { key: "testimonial_name_ar", value: "سارة جونسون", group: "hero", label: "Testimonial Name (AR)" },
  { key: "testimonial_role_en", value: "Home Buyer", group: "hero", label: "Testimonial Role (EN)" },
  { key: "testimonial_role_ar", value: "مشتري منزل", group: "hero", label: "Testimonial Role (AR)" },

  // Market Group
  { key: "market_avg_home_price", value: "$685,000", group: "market", label: "Avg Home Price" },
  { key: "market_avg_home_price_change", value: "+5.2%", group: "market", label: "Avg Home Price Change" },
  { key: "market_inventory", value: "2,450", group: "market", label: "Inventory Level" },
  { key: "market_inventory_change", value: "-12%", group: "market", label: "Inventory Change" },
  { key: "market_days_on_market", value: "34", group: "market", label: "Days on Market" },
  { key: "market_days_on_market_change", value: "-8%", group: "market", label: "Days on Market Change" },
  { key: "market_avg_price", value: "562000", group: "market", label: "Average Price (numeric)" },
  { key: "market_avg_price_change", value: "8.5%", group: "market", label: "Average Price Change" },
  { key: "market_median_price", value: "485000", group: "market", label: "Median Price" },
  { key: "market_median_price_change", value: "6.2%", group: "market", label: "Median Price Change" },
  { key: "market_price_per_sqft", value: "285", group: "market", label: "Price Per SqFt" },
  { key: "market_price_per_sqft_change", value: "4.8%", group: "market", label: "Price Per SqFt Change" },
  { key: "market_inventory_level", value: "1247", group: "market", label: "Inventory Level (numeric)" },
  { key: "market_inventory_level_change", value: "-3.2%", group: "market", label: "Inventory Level Change" },
  { key: "market_activity_score", value: "78", group: "market", label: "Market Activity Score" },
  { key: "market_activity_score_change", value: "5.1%", group: "market", label: "Market Activity Score Change" },

  // Mortgage Group
  { key: "mortgage_default_rate", value: "6.5", group: "mortgage", label: "Default Interest Rate %" },
  { key: "mortgage_default_term", value: "30", group: "mortgage", label: "Default Loan Term (years)" },
  { key: "mortgage_default_down", value: "20", group: "mortgage", label: "Default Down Payment %" },

  // Appearance Group
  { key: "placeholder_image", value: "https://placehold.co/800x600/e2e8f0/64748b?text=No+Image", group: "appearance", label: "Placeholder Image URL" },
];

// POST /api/settings/seed - Seed all default settings (idempotent)
export async function POST() {
  try {
    const { db } = await import("@/lib/db");

    const results = await Promise.all(
      DEFAULT_SETTINGS.map((setting) =>
        db.setting.upsert({
          where: { key: setting.key },
          update: {
            value: setting.value,
            group: setting.group,
            label: setting.label,
          },
          create: {
            key: setting.key,
            value: setting.value,
            group: setting.group,
            label: setting.label,
          },
        })
      )
    );

    return NextResponse.json({
      message: "Settings seeded successfully",
      count: results.length,
      settings: results,
    });
  } catch (error) {
    console.error("[SETTINGS_SEED]", error);
    return NextResponse.json(
      { error: "Failed to seed settings" },
      { status: 500 }
    );
  }
}
