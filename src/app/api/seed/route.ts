import { NextResponse } from "next/server";
import crypto from "crypto";

// Simple SHA256 hash for passwords
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST() {
  try {
    const { db } = await import("@/lib/db");

    // ===== 1. Seed Admin User =====
    const adminPassword = hashPassword("admin123");
    await db.user.upsert({
      where: { email: "admin@estatepro.com" },
      update: {
        name: "Admin",
        password: adminPassword,
        role: "admin",
      },
      create: {
        email: "admin@estatepro.com",
        name: "Admin",
        password: adminPassword,
        role: "admin",
      },
    });

    // ===== 2. Seed Agents =====
    const agentsData = [
      {
        nameEn: "James Wilson",
        nameAr: "جيمس ويلسون",
        titleEn: "Senior Real Estate Agent",
        titleAr: "وكيل عقارات أول",
        bioEn:
          "With over 15 years of experience in the real estate market, James specializes in luxury residential properties. His keen eye for detail and deep market knowledge have helped countless clients find their dream homes.",
        bioAr:
          "خبرة تزيد عن 15 عاماً في سوق العقارات، يتخصص جيمس في العقارات السكنية الفاخرة. عينه الثاقبة للتفاصيل ومعرفته العميقة بالسوق ساعدت عدد لا يحصى من العملاء في العثور على منازل أحلامهم.",
        email: "james@estatepro.com",
        phone: "+1 (555) 234-5678",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
        specialization: "luxury",
        experience: 15,
        propertiesCount: 87,
        rating: 4.9,
      },
      {
        nameEn: "Maria Garcia",
        nameAr: "ماريا غارسيا",
        titleEn: "Commercial Property Specialist",
        titleAr: "أخصائي عقارات تجارية",
        bioEn:
          "Maria brings 10 years of expertise in commercial real estate, helping businesses find their perfect location. Her negotiation skills and market insight make her the go-to agent for commercial investments.",
        bioAr:
          "تجلب ماريا 10 سنوات من الخبرة في العقارات التجارية، وتساعد الشركات في العثور على موقعها المثالي. مهاراتها التفاوضية ورؤيتها للسوق تجعلها الوكيل المفضل للاستثمارات التجارية.",
        email: "maria@estatepro.com",
        phone: "+1 (555) 345-6789",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
        specialization: "commercial",
        experience: 10,
        propertiesCount: 64,
        rating: 4.8,
      },
      {
        nameEn: "Ahmed Hassan",
        nameAr: "أحمد حسن",
        titleEn: "Residential Sales Expert",
        titleAr: "خبير مبيعات سكنية",
        bioEn:
          "Ahmed has helped hundreds of families find their dream homes with his deep market knowledge and personalized approach. Fluent in Arabic and English, he serves a diverse clientele across the region.",
        bioAr:
          "ساعد أحمد مئات العائلات في العثور على منازل أحلامهم بمعرفته العميقة بالسوق ونهجه الشخصي. يتحدث العربية والإنجليزية بطلاقة، ويخدم عملاء متنوعين في جميع أنحاء المنطقة.",
        email: "ahmed@estatepro.com",
        phone: "+1 (555) 456-7890",
        image: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=400&q=80",
        specialization: "residential",
        experience: 8,
        propertiesCount: 52,
        rating: 4.7,
      },
      {
        nameEn: "Emily Thompson",
        nameAr: "إيميلي تومسون",
        titleEn: "Rental Property Manager",
        titleAr: "مدير عقارات إيجارية",
        bioEn:
          "Emily manages an extensive portfolio of rental properties and ensures both landlords and tenants have a smooth experience. Her organizational skills and attention to detail make every rental process seamless.",
        bioAr:
          "تدير إيميلي محفظة واسعة من العقارات الإيجارية وتضمن تجربة سلسة للمالكين والمستأجرين. مهاراتها التنظيمية واهتمامها بالتفاصيل تجعل كل عملية إيجار سلسة.",
        email: "emily@estatepro.com",
        phone: "+1 (555) 567-8901",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        specialization: "rentals",
        experience: 6,
        propertiesCount: 43,
        rating: 4.6,
      },
    ];

    const agents = [];
    for (const agentData of agentsData) {
      const existing = await db.agent.findFirst({ where: { email: agentData.email } });
      if (existing) {
        const updated = await db.agent.update({
          where: { id: existing.id },
          data: agentData,
        });
        agents.push(updated);
      } else {
        const created = await db.agent.create({ data: agentData });
        agents.push(created);
      }
    }

    // ===== 3. Seed Properties =====
    const propertyPhotos = [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1400&q=80",
    ];
    const gallery = (offset: number) => Array.from(
      { length: 4 },
      (_, index) => propertyPhotos[(offset + index) % propertyPhotos.length],
    ).join(",");
    const propertyImages = {
      penthouseNY: gallery(0), villaBH: gallery(1), condoMiami: gallery(2),
      townhouseChi: gallery(3), apartmentSF: gallery(4), houseAustin: gallery(0),
      apartmentDubai: gallery(1), studioSF: gallery(2), villaDubai: gallery(3),
      loftNY: gallery(4), waterfrontMiami: gallery(0), penthouseLA: gallery(1),
    };

    const features = [
      "Swimming Pool,Garden,Security System,Smart Home,Parking,Fireplace",
      "Gym,Concierge,Rooftop Terrace,Pet Friendly,Laundry,Elevator",
      "Central AC,Balcony,Walk-in Closet,Hardwood Floors,Energy Efficient,Storage",
      "Modern Kitchen,Marble Floors,Home Theater,Wine Cellar,Smart Locks,Solar Panels",
      "Open Floor Plan,High Ceilings,Recessed Lighting,Island Kitchen,Pantry,Attic",
      "Beach Access,Private Dock,Ocean View,Outdoor Kitchen,Fountain,Guest House",
    ];

    const propertyData = [
      {
        titleEn: "Luxury Penthouse in Manhattan",
        titleAr: "بنتهاوس فاخر في مانهاتن",
        descriptionEn:
          "Experience luxury living at its finest in this stunning penthouse located in the heart of Manhattan. Floor-to-ceiling windows offer breathtaking views of the city skyline. The open-concept living area features high ceilings and premium finishes throughout. The gourmet kitchen comes equipped with top-of-the-line appliances and marble countertops.",
        descriptionAr:
          "اختبر المعيشة الفاخرة في أبهى صورها في هذا البنتهاوس المذهل في قلب مانهاتن. توفر النوافذ من الأرض حتى السقف إطلالات خلابة على أفق المدينة. تتميز منطقة المعيشة المفتوحة بأسقف عالية وتشطيبات فاخرة في جميع أنحاء المنزل.",
        price: 2500000,
        type: "penthouse",
        status: "sale",
        bedrooms: 4,
        bathrooms: 3,
        area: 3200,
        locationEn: "Manhattan, New York",
        locationAr: "مانهاتن، نيويورك",
        addressEn: "432 Park Avenue",
        addressAr: "432 بارك أفينيو",
        cityEn: "New York",
        cityAr: "نيويورك",
        images: propertyImages.penthouseNY,
        features: features[0],
        yearBuilt: 2022,
        parking: 2,
        featured: true,
        badge: "premium",
        agentId: agents[0].id,
      },
      {
        titleEn: "Modern Villa in Beverly Hills",
        titleAr: "فيلا حديثة في بيفرلي هيلز",
        descriptionEn:
          "This spectacular modern villa combines contemporary design with luxurious comfort. Set on a private lot with landscaped gardens, this home features an open floor plan perfect for entertaining. The resort-style pool and spa create an outdoor oasis.",
        descriptionAr:
          "تجمع هذه الفيلا الحديثة المذهلة بين التصميم المعاصر والراحة الفاخرة. تقع على قطعة أرض خاصة مع حدائق منسقة، وتتميز هذه المنزل بخطة طابق مفتوحة مثالية للترفيه.",
        price: 4800000,
        type: "villa",
        status: "sale",
        bedrooms: 6,
        bathrooms: 5,
        area: 5500,
        locationEn: "Beverly Hills, Los Angeles",
        locationAr: "بيفرلي هيلز، لوس أنجلوس",
        addressEn: "1000 Sunset Boulevard",
        addressAr: "1000 شارع صنست",
        cityEn: "Los Angeles",
        cityAr: "لوس أنجلوس",
        images: propertyImages.villaBH,
        features: features[3],
        yearBuilt: 2021,
        parking: 3,
        featured: true,
        badge: "hot",
        agentId: agents[0].id,
      },
      {
        titleEn: "Beachfront Condo in Miami",
        titleAr: "شقة فاخرة على شاطئ ميامي",
        descriptionEn:
          "Wake up to stunning ocean views in this beautiful beachfront condo. The open-concept living space is flooded with natural light and features premium finishes. Enjoy resort-style amenities including a pool, fitness center, and private beach access.",
        descriptionAr:
          "استيقظ على إطلالات محيط خلابة في هذه الشقة الفاخرة المطلة على الشاطئ. غرفة المعيشة المفتوحة تفيئة بالضوء الطبيعي وتتميز بتشطيبات فاخرة.",
        price: 890000,
        type: "condo",
        status: "sale",
        bedrooms: 3,
        bathrooms: 2,
        area: 1800,
        locationEn: "South Beach, Miami",
        locationAr: "ساوث بيتش، ميامي",
        addressEn: "500 Ocean Drive",
        addressAr: "500 أوشن درايف",
        cityEn: "Miami",
        cityAr: "ميامي",
        images: propertyImages.condoMiami,
        features: features[1],
        yearBuilt: 2020,
        parking: 1,
        featured: true,
        badge: "new",
        agentId: agents[2].id,
      },
      {
        titleEn: "Cozy Townhouse in Chicago",
        titleAr: "منزل بلدة مريح في شيكاغو",
        descriptionEn:
          "Charming townhouse in the heart of Lincoln Park featuring modern updates while maintaining its historic character. Three levels of living space with a rooftop deck offering skyline views. Close to shops, restaurants, and public transit.",
        descriptionAr:
          "منزل بلدة ساحر في قلب لينكولن بارك يتميز بتحديثات حديثة مع الحفاظ على طابعه التاريخي. ثلاثة مستويات من مساحة المعيشة مع سطح على السطح يوفر إطلالات على الأفق.",
        price: 650000,
        type: "townhouse",
        status: "sale",
        bedrooms: 3,
        bathrooms: 2,
        area: 2200,
        locationEn: "Lincoln Park, Chicago",
        locationAr: "لينكولن بارك، شيكاغو",
        addressEn: "2045 N Clark Street",
        addressAr: "2045 شارع نورث كلارك",
        cityEn: "Chicago",
        cityAr: "شيكاغو",
        images: propertyImages.townhouseChi,
        features: features[4],
        yearBuilt: 2018,
        parking: 1,
        featured: true,
        badge: "new",
        agentId: agents[2].id,
      },
      {
        titleEn: "Executive Apartment for Rent",
        titleAr: "شقة تنفيذية للإيجار",
        descriptionEn:
          "Stunning executive apartment available for rent in Pacific Heights. Fully furnished with high-end furniture and state-of-the-art appliances. Building amenities include 24-hour concierge, gym, and rooftop terrace.",
        descriptionAr:
          "شقة تنفيذية مذهلة متاحة للإيجار في باسيفيك هايتس. مفروشة بالكامل بأثاث فاخر وأجهزة حديثة. تشمل مرافق المبنى خدمة كونسيرج على مدار الساعة وصالة رياضية وسطح.",
        price: 4500,
        type: "apartment",
        status: "rent",
        bedrooms: 2,
        bathrooms: 2,
        area: 1400,
        locationEn: "Pacific Heights, San Francisco",
        locationAr: "باسيفيك هايتس، سان فرانسيسكو",
        addressEn: "2800 Pacific Avenue",
        addressAr: "2800 شارع باسيفيك",
        cityEn: "San Francisco",
        cityAr: "سان فرانسيسكو",
        images: propertyImages.apartmentSF,
        features: features[1],
        yearBuilt: 2019,
        parking: 1,
        featured: true,
        badge: null,
        agentId: agents[3].id,
      },
      {
        titleEn: "Spacious Family Home in Austin",
        titleAr: "منزل عائلي واسع في أوستن",
        descriptionEn:
          "Beautiful family home with spacious rooms and a large backyard. Perfect for growing families, this home features an updated kitchen, hardwood floors throughout, and a finished basement. Located in a top-rated school district.",
        descriptionAr:
          "منزل عائلي جميل بغرف واسعة وفناء خلفي كبير. مثالي للعائلات المتنامية، يتميز هذا المنزل بمطبخ محدث وأرضيات خشبية وطابق سفلي مكتمل.",
        price: 720000,
        type: "house",
        status: "sale",
        bedrooms: 4,
        bathrooms: 3,
        area: 2800,
        locationEn: "West Lake Hills, Austin",
        locationAr: "ويست ليك هيلز، أوستن",
        addressEn: "2850 Westlake Drive",
        addressAr: "2850 شارع ويست ليك",
        cityEn: "Austin",
        cityAr: "أوستن",
        images: propertyImages.houseAustin,
        features: features[2],
        yearBuilt: 2017,
        parking: 2,
        featured: false,
        badge: null,
        agentId: agents[2].id,
      },
      {
        titleEn: "Luxury Apartment in Dubai Marina",
        titleAr: "شقة فاخرة في دبي مارينا",
        descriptionEn:
          "Luxurious apartment with panoramic marina views in one of Dubai's most sought-after locations. High-end finishes, smart home technology, and access to world-class amenities including infinity pool and private gym.",
        descriptionAr:
          "شقة فاخرة بإطلالات بانورامية على المارينا في أحد أرقى مواقع دبي. تشطيبات فاخرة وتكنولوجيا المنزل الذكي والوصول إلى مرافق عالمية المستوى.",
        price: 1250000,
        type: "apartment",
        status: "sale",
        bedrooms: 3,
        bathrooms: 2,
        area: 2100,
        locationEn: "Dubai Marina, Dubai",
        locationAr: "دبي مارينا، دبي",
        addressEn: "Marina Walk Tower",
        addressAr: "برج مارينا ووك",
        cityEn: "Dubai",
        cityAr: "دبي",
        images: propertyImages.apartmentDubai,
        features: features[5],
        yearBuilt: 2023,
        parking: 2,
        featured: true,
        badge: "hot",
        agentId: agents[0].id,
      },
      {
        titleEn: "Modern Studio for Rent",
        titleAr: "استوديو حديث للإيجار",
        descriptionEn:
          "Modern and stylish studio apartment in the heart of downtown. Perfect for young professionals, featuring an open layout, contemporary kitchen, and large windows with city views. Walking distance to major attractions.",
        descriptionAr:
          "شقة استوديو حديثة وأنيقة في قلب وسط المدينة. مثالية للمحترفين الشباب، تتميز بتخطيط مفتوح ومطبخ عصري ونوافذ كبيرة بإطلالات على المدينة.",
        price: 2200,
        type: "apartment",
        status: "rent",
        bedrooms: 1,
        bathrooms: 1,
        area: 650,
        locationEn: "Downtown, San Francisco",
        locationAr: "وسط المدينة، سان فرانسيسكو",
        addressEn: "555 Market Street",
        addressAr: "555 شارع ماركت",
        cityEn: "San Francisco",
        cityAr: "سان فرانسيسكو",
        images: propertyImages.studioSF,
        features: features[1],
        yearBuilt: 2021,
        parking: 0,
        featured: false,
        badge: null,
        agentId: agents[3].id,
      },
      {
        titleEn: "Elegant Villa with Private Pool",
        titleAr: "فيلا أنيقة بمسبح خاص",
        descriptionEn:
          "Stunning villa featuring a private pool, landscaped garden, and outdoor entertainment area. The interior boasts high ceilings, a grand foyer, and a chef's kitchen. Located in an exclusive gated community with 24/7 security.",
        descriptionAr:
          "فيلا مذهلة تتميز بمسبح خاص وحديقة منسقة ومنطقة ترفيه خارجية. يتميز الداخل بأسقف عالية ومدخل رئيسي ومطبخ احترافي.",
        price: 3200000,
        type: "villa",
        status: "sale",
        bedrooms: 5,
        bathrooms: 4,
        area: 4500,
        locationEn: "Palm Jumeirah, Dubai",
        locationAr: "نخلة جميرا، دبي",
        addressEn: "Shoreline Apartment",
        addressAr: "شقة الشاطئ",
        cityEn: "Dubai",
        cityAr: "دبي",
        images: propertyImages.villaDubai,
        features: features[0],
        yearBuilt: 2022,
        parking: 3,
        featured: true,
        badge: "premium",
        agentId: agents[0].id,
      },
      {
        titleEn: "Renovated Loft Apartment",
        titleAr: "شقة لوفت مجددة",
        descriptionEn:
          "Beautifully renovated loft apartment combining industrial charm with modern comfort. Exposed brick walls, soaring ceilings, and oversized windows create an airy, light-filled space. Chef's kitchen with premium appliances.",
        descriptionAr:
          "شقة لوفت مجددة بشكل جميل تجمع بين سحر التصميم الصناعي والراحة الحديثة. جدران من الطوب المكشوف وأسقف مرتفعة ونوافذ كبيرة الحجم.",
        price: 950000,
        type: "apartment",
        status: "sale",
        bedrooms: 2,
        bathrooms: 2,
        area: 1600,
        locationEn: "Brooklyn, New York",
        locationAr: "بروكلين، نيويورك",
        addressEn: "150 Wooster Street",
        addressAr: "150 شارع ووستر",
        cityEn: "New York",
        cityAr: "نيويورك",
        images: propertyImages.loftNY,
        features: features[2],
        yearBuilt: 2020,
        parking: 0,
        featured: false,
        badge: null,
        agentId: agents[1].id,
      },
      {
        titleEn: "Waterfront House in Seattle",
        titleAr: "منزل على الواجهة المائية في سياتل",
        descriptionEn:
          "Spectacular waterfront property with private dock and panoramic bay views. This stunning home features an open-concept layout, gourmet kitchen, and a master suite with a private balcony. Perfect for nature lovers.",
        descriptionAr:
          "عقار مذهل على الواجهة المائية مع رصيف خاص وإطلالات بانورامية على الخليج. يتميز هذا المنزل بتخطيط مفتوح ومطبخ ذواقة وجناح رئيسي مع شرفة خاصة.",
        price: 2800000,
        type: "house",
        status: "sale",
        bedrooms: 5,
        bathrooms: 4,
        area: 4000,
        locationEn: "Lake Washington, Seattle",
        locationAr: "بحيرة واشنطن، سياتل",
        addressEn: "3000 Lake Shore Drive",
        addressAr: "3000 شارع ليك شور",
        cityEn: "Seattle",
        cityAr: "سياتل",
        images: propertyImages.waterfrontMiami,
        features: features[5],
        yearBuilt: 2021,
        parking: 2,
        featured: false,
        badge: null,
        agentId: agents[2].id,
      },
      {
        titleEn: "Penthouse for Rent in LA",
        titleAr: "بنتهاوس للإيجار في لوس أنجلوس",
        descriptionEn:
          "Exclusive penthouse rental with wraparound terrace offering 360-degree city and mountain views. Premium finishes throughout, private elevator access, and a state-of-the-art kitchen. Building features include spa, pool, and valet parking.",
        descriptionAr:
          "إيجار بنتهاوس حصري مع شرفة محيطة توفر إطلالات على المدينة والجبال بزاوية 360 درجة. تشطيبات فاخرة ومصعد خاص ومطبخ حديث.",
        price: 8500,
        type: "penthouse",
        status: "rent",
        bedrooms: 3,
        bathrooms: 3,
        area: 2800,
        locationEn: "Beverly Hills, Los Angeles",
        locationAr: "بيفرلي هيلز، لوس أنجلوس",
        addressEn: "9000 Wilshire Boulevard",
        addressAr: "9000 شارع ويلشاير",
        cityEn: "Los Angeles",
        cityAr: "لوس أنجلوس",
        images: propertyImages.penthouseLA,
        features: features[3],
        yearBuilt: 2023,
        parking: 2,
        featured: true,
        badge: "new",
        agentId: agents[3].id,
      },
    ];

    // Delete existing properties and inquiries first (due to foreign key constraints)
    await db.inquiry.deleteMany();
    await db.review.deleteMany();
    await db.tour.deleteMany();
    await db.property.deleteMany();

    const createdProperties = await Promise.all(
      propertyData.map((p) => db.property.create({ data: p }))
    );

    // ===== 4. Seed SiteSettings =====
    const siteSettingsData = [
      // Hero
      { key: "hero.title", valueEn: "Find Your Dream Property", valueAr: "اعثر على عقار أحلامك", category: "hero", type: "text" },
      { key: "hero.subtitle", valueEn: "Discover exceptional properties in prime locations worldwide. From luxury penthouses to cozy family homes, we make your real estate dreams come true.", valueAr: "اكتشف عقارات استثنائية في مواقع رئيسية حول العالم. من البنتهاوسات الفاخرة إلى المنازل العائلية المريحة، نحقق أحلامك العقارية.", category: "hero", type: "text" },
      { key: "hero.eyebrow", valueEn: "Premium Real Estate", valueAr: "عقارات فاخرة", category: "hero", type: "text" },
      // Stats
      { key: "stats.propertiesSold", valueEn: "1,200+", valueAr: "+١,٢٠٠", category: "stats", type: "text" },
      { key: "stats.happyClients", valueEn: "5,000+", valueAr: "+٥,٠٠٠", category: "stats", type: "text" },
      { key: "stats.expertAgents", valueEn: "50+", valueAr: "+٥٠", category: "stats", type: "text" },
      // Market
      { key: "market.avgPrice", valueEn: "$485,000", valueAr: "$٤٨٥,٠٠٠", category: "market", type: "text" },
      { key: "market.inventory", valueEn: "2,450", valueAr: "٢,٤٥٠", category: "market", type: "text" },
      { key: "market.daysOnMarket", valueEn: "32", valueAr: "٣٢", category: "market", type: "text" },
      { key: "market.avgPriceChange", valueEn: "+5.2%", valueAr: "+٥.٢٪", category: "market", type: "text" },
      { key: "market.inventoryChange", valueEn: "-12%", valueAr: "-١٢٪", category: "market", type: "text" },
      { key: "market.daysOnMarketChange", valueEn: "-8 days", valueAr: "-٨ أيام", category: "market", type: "text" },
      // CTA
      { key: "cta.title", valueEn: "Ready to Find Your Dream Home?", valueAr: "هل أنت مستعد للعثور على منزل أحلامك؟", category: "general", type: "text" },
      { key: "cta.subtitle", valueEn: "Let our expert agents help you navigate the market and find the perfect property that fits your lifestyle and budget.", valueAr: "دع وكلاءنا الخبراء يساعدونك في التنقل في السوق والعثور على العقار المثالي الذي يناسب نمط حياتك وميزانيتك.", category: "general", type: "text" },
      // Footer
      { key: "footer.companyDesc", valueEn: "EstatePro is your trusted partner in finding the perfect property. With years of experience and a dedicated team, we make real estate simple and rewarding.", valueAr: "EstatePro هو شريكك الموثوق في العثور على العقار المثالي. بسنوات من الخبرة وفريق مخصص، نجعل العقارات بسيطة ومجزية.", category: "footer", type: "text" },
      { key: "footer.address", valueEn: "123 Real Estate Blvd, Suite 500, New York, NY 10001", valueAr: "١٢٣ شارع العقارات، جناح ٥٠٠، نيويورك، نيويورك ١٠٠٠١", category: "footer", type: "text" },
      { key: "footer.phone", valueEn: "+1 (555) 123-4567", valueAr: "+١ (٥٥٥) ١٢٣-٤٥٦٧", category: "footer", type: "text" },
      { key: "footer.email", valueEn: "info@estatepro.com", valueAr: "info@estatepro.com", category: "footer", type: "text" },
      // SEO
      { key: "seo.title", valueEn: "EstatePro - Find Your Dream Property | Premium Real Estate", valueAr: "EstatePro - اعثر على عقار أحلامك | عقارات فاخرة", category: "seo", type: "text" },
      { key: "seo.description", valueEn: "Discover exceptional properties in prime locations worldwide. EstatePro offers luxury homes, apartments, villas, and commercial properties with expert agent support.", valueAr: "اكتشف عقارات استثنائية في مواقع رئيسية حول العالم. يقدم EstatePro منازل فاخرة وشققاً وفيلا وعقارات تجارية مع دعم وكلاء خبراء.", category: "seo", type: "text" },
      // General
      { key: "general.siteName", valueEn: "EstatePro", valueAr: "EstatePro", category: "general", type: "text" },
    ];

    for (const setting of siteSettingsData) {
      await db.siteSetting.upsert({
        where: { key: setting.key },
        update: {
          valueEn: setting.valueEn,
          valueAr: setting.valueAr,
          category: setting.category,
          type: setting.type,
        },
        create: setting,
      });
    }

    // ===== 5. Seed Testimonials =====
    const testimonialsData = [
      {
        authorEn: "Sarah Mitchell",
        authorAr: "سارة ميتشل",
        roleEn: "Homeowner",
        roleAr: "مالكة منزل",
        contentEn:
          "EstatePro made finding our dream home an absolute breeze. James was incredibly knowledgeable and patient, showing us properties that perfectly matched our criteria. We couldn't be happier with our new home!",
        contentAr:
          "جعلت EstatePro العثور على منزل أحلامنا أمراً سهلاً للغاية. كان جيمس على دراية كبيرة وصبوراً، وأرانا عقارات تطابق معاييرنا بشكل مثالي. لا يمكن أن نكون أسعد بمنزلنا الجديد!",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
        rating: 5,
        featured: true,
        sortOrder: 1,
      },
      {
        authorEn: "Robert Chen",
        authorAr: "روبرت تشن",
        roleEn: "Investor",
        roleAr: "مستثمر",
        contentEn:
          "As a property investor, I've worked with many agencies. EstatePro stands out for their market insights and professional approach. Maria helped me acquire two commercial properties that have shown excellent returns.",
        contentAr:
          "كمستثمر عقاري، عملت مع العديد من الوكالات. تتميز EstatePro برؤيتها للسوق ونهجها المهني. ساعدتني ماريا في الاستحواذ على عقارين تجاريين أظهرا عوائد ممتازة.",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
        rating: 5,
        featured: true,
        sortOrder: 2,
      },
      {
        authorEn: "Fatima Al-Rashid",
        authorAr: "فاطمة الراشد",
        roleEn: "Business Owner",
        roleAr: "صاحبة أعمال",
        contentEn:
          "Finding the right commercial space was crucial for my business. Ahmed understood my requirements perfectly and found us an amazing location in record time. The entire process was seamless and stress-free.",
        contentAr:
          "كان العثور على المساحة التجارية المناسبة أمراً حاسماً لعملي. فهم أحمد متطلباتي بشكل مثالي ووجد لنا موقعاً مذهلاً في وقت قياسي. كانت العملية بأكملها سلسة وخالية من التوتر.",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        rating: 5,
        featured: true,
        sortOrder: 3,
      },
      {
        authorEn: "David Park",
        authorAr: "ديفيد بارك",
        roleEn: "First-time Buyer",
        roleAr: "مشترٍ لأول مرة",
        contentEn:
          "As a first-time homebuyer, I was nervous about the process. Emily walked me through every step with patience and expertise. She made what could have been overwhelming feel manageable and even exciting!",
        contentAr:
          "كمشترٍ منزل لأول مرة، كنت متوتراً بشأن العملية. أرشدتني إيميلي في كل خطوة بصبر وخبرة. جعلت ما كان يمكن أن يكون مرهقاً يبدو قابلاً للإدارة ومثيراً حتى!",
        avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=200&q=80",
        rating: 4,
        featured: true,
        sortOrder: 4,
      },
      {
        authorEn: "Lisa Rodriguez",
        authorAr: "ليزا رودريغز",
        roleEn: "Renter",
        roleAr: "مستأجرة",
        contentEn:
          "I was looking for the perfect rental and EstatePro delivered. Their extensive listings and Emily's keen understanding of my needs helped me find a beautiful apartment in the heart of the city. Highly recommended!",
        contentAr:
          "كنت أبحث عن الإيجار المثالي وEstatePro قدمت ذلك. قوائمهم الواسعة وفهم إيميلي العميق لاحتياجاتي ساعداني في العثور على شقة جميلة في قلب المدينة. أنصح بشدة!",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
        rating: 5,
        featured: false,
        sortOrder: 5,
      },
      {
        authorEn: "Michael Brown",
        authorAr: "مايكل براون",
        roleEn: "Luxury Homeowner",
        roleAr: "مالك منزل فاخر",
        contentEn:
          "The level of service at EstatePro is unmatched. From the initial consultation to closing, every detail was handled with precision and care. They truly understand the luxury market and deliver exceptional results.",
        contentAr:
          "مستوى الخدمة في EstatePro لا مثيل له. من الاستشارة الأولى إلى الإغلاق، تم التعامل مع كل تفصيلة بدقة وعناية. إنهم يفهمون حقاً سوق الفخامة ويقدمون نتائج استثنائية.",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
        rating: 5,
        featured: true,
        sortOrder: 6,
      },
      {
        authorEn: "Aisha Mohamed",
        authorAr: "عائشة محمد",
        roleEn: "Property Developer",
        roleAr: "مطورة عقارية",
        contentEn:
          "Working with EstatePro on our latest development project was outstanding. Their team provided valuable market analysis and helped us position our properties perfectly. Sales exceeded our projections by 30%.",
        contentAr:
          "العمل مع EstatePro في أحدث مشروع تطويري لدينا كان مميزاً. قدم فريقهم تحليلاً قيماً للسوق وساعدنا في وضع عقاراتنا بشكل مثالي. تجاوزت المبيعات توقعاتنا بنسبة ٣٠٪.",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        rating: 5,
        featured: false,
        sortOrder: 7,
      },
      {
        authorEn: "Thomas Anderson",
        authorAr: "توماس أندرسون",
        roleEn: "Relocation Client",
        roleAr: "عميل نقل",
        contentEn:
          "Relocating internationally seemed daunting, but EstatePro made it effortless. Their bilingual team and global network ensured I found the perfect home before I even arrived. Exceptional service from start to finish.",
        contentAr:
          "بدأ النقل الدولي مخيفاً، لكن EstatePro جعلته سهلاً. فريقهم ثنائي اللغة وشبكتهم العالمية ضمنت لي العثور على المنزل المثالي قبل حتى وصولي. خدمة استثنائية من البداية إلى النهاية.",
        avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=200&q=80",
        rating: 4,
        featured: false,
        sortOrder: 8,
      },
    ];

    // Delete existing testimonials
    await db.testimonial.deleteMany();

    const createdTestimonials = await Promise.all(
      testimonialsData.map((t) => db.testimonial.create({ data: t }))
    );

    // ===== 6. Seed Neighborhoods =====
    const neighborhoodsData = [
      {
        nameEn: "Downtown",
        nameAr: "وسط المدينة",
        descEn:
          "The vibrant heart of the city with world-class dining, entertainment, and cultural attractions. Perfect for urban professionals who want to be at the center of everything.",
        descAr:
          "القلب النابض للمدينة مع مطاعم عالمية المستوى وترفيه ومعالم ثقافية. مثالي للمحترفين الحضريين الذين يريدون أن يكونوا في مركز كل شيء.",
        avgPrice: "$450K - $1.2M",
        propertyCount: 186,
        searchQuery: "Downtown",
        image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1200&q=80",
        featured: true,
        sortOrder: 1,
      },
      {
        nameEn: "Waterfront",
        nameAr: "الواجهة البحرية",
        descEn:
          "Stunning waterfront living with breathtaking ocean and bay views. Enjoy beach access, marina lifestyle, and a relaxed coastal atmosphere just minutes from the city center.",
        descAr:
          "معيشة مذهلة على الواجهة البحرية مع إطلالات خلابة على المحيط والخليج. استمتع بالوصول إلى الشاطئ وأسلوب حياة المارينا وأجواء ساحلية هادئة على بعد دقائق من وسط المدينة.",
        avgPrice: "$680K - $2.5M",
        propertyCount: 124,
        searchQuery: "Waterfront",
        image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
        featured: true,
        sortOrder: 2,
      },
      {
        nameEn: "Suburbs",
        nameAr: "الضواحي",
        descEn:
          "Peaceful suburban communities with excellent schools, parks, and family-friendly amenities. Spacious homes with large yards in safe, welcoming neighborhoods.",
        descAr:
          "مجتمعات ضاحية هادئة مع مدارس ممتازة وحدائق ومرافق صديقة للعائلات. منازل واسعة مع فناءات كبيرة في أحياء آمنة ومرحبة.",
        avgPrice: "$320K - $750K",
        propertyCount: 245,
        searchQuery: "Suburbs",
        image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",
        featured: true,
        sortOrder: 3,
      },
      {
        nameEn: "Midtown",
        nameAr: "وسط المدينة الأوسط",
        descEn:
          "A thriving mix of residential and commercial spaces with excellent transit connections. Trendy restaurants, boutique shops, and a dynamic arts scene make this a sought-after location.",
        descAr:
          "مزيج مزدهر من المساحات السكنية والتجارية مع اتصالات ممتازة بالمواصلات. مطاعم عصرية ومتاجر بوتيك ومشهد فني ديناميكي يجعل هذا الموقع مطلوباً.",
        avgPrice: "$380K - $950K",
        propertyCount: 167,
        searchQuery: "Midtown",
        image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1200&q=80",
        featured: true,
        sortOrder: 4,
      },
    ];

    // Delete existing neighborhoods
    await db.neighborhood.deleteMany();

    const createdNeighborhoods = await Promise.all(
      neighborhoodsData.map((n) => db.neighborhood.create({ data: n }))
    );

    // ===== 7. Seed PropertyTypeConfig =====
    const propertyTypesData = [
      {
        nameEn: "Apartment",
        nameAr: "شقة",
        type: "apartment",
        icon: "Building2",
        listingCount: 156,
        featured: true,
        sortOrder: 1,
      },
      {
        nameEn: "Villa",
        nameAr: "فيلا",
        type: "villa",
        icon: "Castle",
        listingCount: 48,
        featured: true,
        sortOrder: 2,
      },
      {
        nameEn: "House",
        nameAr: "منزل",
        type: "house",
        icon: "Home",
        listingCount: 92,
        featured: true,
        sortOrder: 3,
      },
      {
        nameEn: "Condo",
        nameAr: "شقة ملكية",
        type: "condo",
        icon: "Building",
        listingCount: 73,
        featured: true,
        sortOrder: 4,
      },
      {
        nameEn: "Townhouse",
        nameAr: "منزل بلدة",
        type: "townhouse",
        icon: "Warehouse",
        listingCount: 35,
        featured: false,
        sortOrder: 5,
      },
      {
        nameEn: "Penthouse",
        nameAr: "بنتهاوس",
        type: "penthouse",
        icon: "Crown",
        listingCount: 18,
        featured: true,
        sortOrder: 6,
      },
    ];

    // Delete existing property type configs
    await db.propertyTypeConfig.deleteMany();

    const createdPropertyTypes = await Promise.all(
      propertyTypesData.map((pt) => db.propertyTypeConfig.create({ data: pt }))
    );

    // ===== 8. Seed MarketDataPoints =====
    const marketDataPointsData = [
      { label: "Jan", value: 420, period: "monthly" },
      { label: "Feb", value: 435, period: "monthly" },
      { label: "Mar", value: 445, period: "monthly" },
      { label: "Apr", value: 440, period: "monthly" },
      { label: "May", value: 460, period: "monthly" },
      { label: "Jun", value: 475, period: "monthly" },
      { label: "Jul", value: 465, period: "monthly" },
      { label: "Aug", value: 480, period: "monthly" },
      { label: "Sep", value: 490, period: "monthly" },
      { label: "Oct", value: 485, period: "monthly" },
      { label: "Nov", value: 495, period: "monthly" },
      { label: "Dec", value: 485, period: "monthly" },
    ];

    // Delete existing market data points
    await db.marketDataPoint.deleteMany();

    const createdMarketDataPoints = await Promise.all(
      marketDataPointsData.map((dp) => db.marketDataPoint.create({ data: dp }))
    );

    // ===== 9. Seed MarketStats =====
    const marketStatsData = [
      {
        labelEn: "Average Home Price",
        labelAr: "متوسط سعر المنزل",
        value: "$485,000",
        change: "+5.2%",
        changeType: "up",
        sortOrder: 1,
      },
      {
        labelEn: "Active Inventory",
        labelAr: "المخزون النشط",
        value: "2,450",
        change: "-12%",
        changeType: "down",
        sortOrder: 2,
      },
      {
        labelEn: "Days on Market",
        labelAr: "أيام في السوق",
        value: "32",
        change: "-8 days",
        changeType: "up",
        sortOrder: 3,
      },
    ];

    // Delete existing market stats
    await db.marketStat.deleteMany();

    const createdMarketStats = await Promise.all(
      marketStatsData.map((ms) => db.marketStat.create({ data: ms }))
    );

    // ===== 10. Seed ContactMessages cleanup (no data to seed, just ensure clean state) =====
    // Delete existing contact messages for a clean re-seed
    await db.contactMessage.deleteMany();

    return NextResponse.json({
      message: "Database seeded successfully",
      data: {
        user: 1,
        agents: agents.length,
        properties: createdProperties.length,
        siteSettings: siteSettingsData.length,
        testimonials: createdTestimonials.length,
        neighborhoods: createdNeighborhoods.length,
        propertyTypes: createdPropertyTypes.length,
        marketDataPoints: createdMarketDataPoints.length,
        marketStats: createdMarketStats.length,
      },
    });
  } catch (error) {
    console.error("Error seeding database:", error);
    return NextResponse.json(
      { error: "Failed to seed database", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Also support GET for easy browser/curl triggering
export async function GET() {
  return POST();
}
