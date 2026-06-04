"use client";

import { useI18n } from "@/lib/i18n/provider";
import { useRouter } from "@/lib/router";
import { useFavorites } from "@/lib/favorites";
import { useCompare } from "@/lib/compare";
import { useRecentlyViewed } from "@/lib/recently-viewed";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  ArrowLeft,
  Bed,
  Bath,
  Maximize,
  Calendar,
  Car,
  MapPin,
  Heart,
  Share2,
  CheckCircle,
  Send,
  Star,
  Eye,
  Play,
  Phone,
  Calculator,
  Copy,
  ExternalLink,
  Home,
  ChevronRight as ChevronRightIcon,
  Footprints,
  TrendingUp,
  Clock,
  MessageCircle,
  Route,
  Train,
  Bike,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { PropertyCard } from "@/components/real-estate/property-card";
import { PropertyGallery } from "@/components/real-estate/property-gallery";
import { PropertyReviews } from "@/components/real-estate/property-reviews";
import { ScheduleTourDialog } from "@/components/real-estate/schedule-tour-dialog";
import { SharePropertyDialog } from "@/components/real-estate/share-property-dialog";
import { ShareButtons } from "@/components/real-estate/share-buttons";
import { PropertyMap } from "@/components/real-estate/property-map";
import { PanoramicViewer } from "@/components/real-estate/panoramic-viewer";
import { toast } from "sonner";

import type { Property } from "@/components/real-estate/types/property";

// Mortgage calculation helper
function calculateMonthlyPayment(price: number): number {
  const loanAmount = price * 0.8;
  const monthlyRate = 0.065 / 12;
  const numPayments = 30 * 12;
  if (monthlyRate === 0) return loanAmount / numPayments;
  return (
    (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
    (Math.pow(1 + monthlyRate, numPayments) - 1)
  );
}

// Scroll-reveal wrapper — Framer Motion ONLY for scroll-triggered reveals, NOT hover
function RevealSection({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function PropertyDetailPage() {
  const { t, locale } = useI18n();
  const { params, back, navigate } = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isInCompare, toggleCompare, compareCount } = useCompare();
  const { addViewed } = useRecentlyViewed();
  const [property, setProperty] = useState<Property | null>(null);
  const [similarProperties, setSimilarProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [inquiryForm, setInquiryForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchProperty = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/properties/${params.id}`);
      const data = await res.json();
      
      // Check if API returned an error
      if (!res.ok || data.error) {
        setProperty(null);
        return;
      }
      
      setProperty(data);

      // Add to recently viewed
      addViewed(data.id);

      // Fetch similar properties
      const simRes = await fetch(`/api/properties?type=${data.type}&limit=3`);
      const simData = await simRes.json();
      setSimilarProperties((simData.properties || []).filter((p: any) => p.id !== data.id));
    } catch {
      setProperty(null);
    } finally {
      setLoading(false);
    }
  }, [params.id, addViewed]);

  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);



  const handleInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    setSubmitting(true);
    try {
      await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...inquiryForm,
          propertyId: property.id,
        }),
      });
      toast.success(t("contact.successMessage"));
      setInquiryForm({ name: "", email: "", phone: "", message: "" });
    } catch {
      toast.error("Failed to send inquiry");
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = useCallback(() => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href).then(() => {
        toast.success(t("propertyDetail.linkCopied"));
      });
    }
  }, [t]);

  const handleEmailShare = useCallback(() => {
    if (typeof window !== "undefined" && property) {
      const title = locale === "ar" ? property.titleAr : property.titleEn;
      const subject = encodeURIComponent(`Check out: ${title}`);
      const body = encodeURIComponent(`Take a look at this property: ${window.location.href}`);
      window.open(`mailto:?subject=${subject}&body=${body}`);
    }
  }, [locale, property]);

  const handleFavoriteToggle = useCallback(() => {
    if (!property) return;
    const nowFav = toggleFavorite(property.id);
    toast(
      nowFav ? t("propertyDetail.savedProperty") : t("propertyDetail.saveProperty"),
      nowFav ? `❤️ ${locale === "ar" ? property.titleAr : property.titleEn}` : `💔 ${locale === "ar" ? property.titleAr : property.titleEn}`
    );
  }, [property, toggleFavorite, t, locale]);

  const handleCompareToggle = useCallback(() => {
    if (!property) return;
    const result = toggleCompare(property.id);
    const inCompare = isInCompare(property.id);
    if (result === false && !inCompare) {
      toast.warning(t("common.selectUpTo3"));
      return;
    }
    toast(
      inCompare ? t("common.removed") : t("common.added"),
      inCompare ? `📊 ${locale === "ar" ? property.titleAr : property.titleEn}` : `📊 ${locale === "ar" ? property.titleAr : property.titleEn}`
    );
  }, [property, toggleCompare, isInCompare, t, locale]);



  if (loading) {
    return (
      <div className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <Skeleton className="h-6 w-64 mb-6" />
          <Skeleton className="h-96 w-full mb-6 rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-40 w-full" />
            </div>
            <Skeleton className="h-80 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="py-16 text-center container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-4">{t("common.noResults")}</h2>
        <Button onClick={back}>{t("common.back")}</Button>
      </div>
    );
  }

  const title = locale === "ar" ? property.titleAr : property.titleEn;
  const description = locale === "ar" ? property.descriptionAr : property.descriptionEn;
  const location = locale === "ar" ? property.locationAr : property.locationEn;
  const address = locale === "ar" ? property.addressAr : property.addressEn;
  const imageList = property.images ? property.images.split(",") : [];
  const featuresList = property.features ? property.features.split(",") : [];
  const statusLabel = property.status === "sale" ? t("common.forSale") : t("common.forRent");
  const statusColor = property.status === "sale" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground";
  const favorited = isFavorite(property.id);
  const inCompare = isInCompare(property.id);
  const monthlyPayment = calculateMonthlyPayment(property.price);
  const formattedDate = property.createdAt
    ? new Date(property.createdAt).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";
  const updatedDate = property.updatedAt
    ? new Date(property.updatedAt).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div className="py-8 md:py-12">
      <div className="container mx-auto px-4">
        {/* Breadcrumbs */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  className="cursor-pointer"
                  onClick={() => navigate("home")}
                >
                  <Home className="w-3.5 h-3.5 inline-block me-1" />
                  {t("common.home")}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink
                  className="cursor-pointer"
                  onClick={() => navigate("properties")}
                >
                  {t("common.properties")}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage className="truncate max-w-[200px]">
                  {title}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </motion.div>

        {/* Back Button */}
        <Button variant="ghost" onClick={back} className="mb-4 gap-2">
          <ArrowLeft className="w-4 h-4" />
          {t("common.back")}
        </Button>

        {/* Image Gallery — Prominent hero */}
        <PropertyGallery
          images={imageList}
          title={title}
          statusLabel={statusLabel}
          statusColor={statusColor}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title, Price & Action Buttons */}
            <RevealSection>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">{title}</h1>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{address}, {location}</span>
                  </div>
                  {/* Property ID and dates */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                        {t("propertyDetail.propertyId")}
                      </Badge>
                      {property.id ? property.id.slice(0, 8).toUpperCase() : "—"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {t("propertyDetail.listedOn")}: {formattedDate}
                    </span>
                    {property.updatedAt && (
                      <span className="flex items-center gap-1">
                        {t("propertyDetail.lastUpdated")}: {updatedDate}
                      </span>
                    )}
                  </div>
                  {/* Share & Save buttons near title */}
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className={`gap-1.5 transition-all duration-200 ${favorited ? "bg-red-50 hover:bg-red-100 border-red-200 text-red-600 dark:bg-red-950/30 dark:border-red-800/50 dark:text-red-400" : ""}`}
                      onClick={handleFavoriteToggle}
                    >
                      <Heart className={`w-4 h-4 transition-all duration-200 ${favorited ? "fill-red-500 text-red-500 scale-110" : ""}`} />
                      {favorited ? t("propertyDetail.saved") : t("propertyDetail.save")}
                    </Button>

                    <SharePropertyDialog
                      propertyId={property.id}
                      propertyTitle={title}
                      trigger={
                        <Button variant="outline" size="sm" className="gap-1.5">
                          <Share2 className="w-4 h-4" />
                          {t("propertyDetail.share")}
                        </Button>
                      }
                    />

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1.5">
                          <Copy className="w-4 h-4" />
                          {t("propertyDetail.more")}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
                          <Copy className="w-4 h-4 me-2" />
                          {t("propertyDetail.shareLink")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleEmailShare} className="cursor-pointer">
                          <Send className="w-4 h-4 me-2" />
                          {t("propertyDetail.shareViaEmail")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => window.print()}
                          className="cursor-pointer"
                        >
                          <ExternalLink className="w-4 h-4 me-2" />
                          {t("propertyDetail.printFlyer")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Social Share Buttons */}
                  <div className="mt-3">
                    <ShareButtons
                      propertyTitle={title}
                      propertyUrl={typeof window !== "undefined" ? window.location.href : ""}
                      propertyImage={imageList[0] || undefined}
                    />
                  </div>
                </div>
                <div className="text-start sm:text-end">
                  <div className="text-3xl font-bold text-primary">
                    {t("common.currency")}{property.price.toLocaleString()}
                    {property.status === "rent" && <span className="text-base font-normal text-muted-foreground">{t("common.perMonth")}</span>}
                  </div>
                  <Badge variant="secondary" className="mt-1">{t(`properties.${property.type}`)}</Badge>
                </div>
              </div>
            </RevealSection>

            {/* Overview Stats */}
            <RevealSection delay={0.05}>
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4">{t("propertyDetail.overview")}</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <Bed className="w-5 h-5 text-primary mx-auto mb-1" />
                      <div className="text-xl font-bold">{property.bedrooms}</div>
                      <div className="text-xs text-muted-foreground">{t("common.beds")}</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <Bath className="w-5 h-5 text-primary mx-auto mb-1" />
                      <div className="text-xl font-bold">{property.bathrooms}</div>
                      <div className="text-xs text-muted-foreground">{t("common.baths")}</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <Maximize className="w-5 h-5 text-primary mx-auto mb-1" />
                      <div className="text-xl font-bold">{property.area}</div>
                      <div className="text-xs text-muted-foreground">{t("common.sqft")}</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <Calendar className="w-5 h-5 text-primary mx-auto mb-1" />
                      <div className="text-xl font-bold">{property.yearBuilt || "—"}</div>
                      <div className="text-xs text-muted-foreground">{t("propertyDetail.yearBuilt")}</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <Car className="w-5 h-5 text-primary mx-auto mb-1" />
                      <div className="text-xl font-bold">{property.parking}</div>
                      <div className="text-xs text-muted-foreground">{t("propertyDetail.parking")}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </RevealSection>

            {/* Description */}
            <RevealSection delay={0.1}>
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4">{t("propertyDetail.description")}</h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{description}</p>
                </CardContent>
              </Card>
            </RevealSection>

            {/* Features */}
            {featuresList.length > 0 && (
              <RevealSection delay={0.1}>
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold mb-4">{t("propertyDetail.amenities")}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {featuresList.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-sm">{feature.trim()}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </RevealSection>
            )}

            {/* Virtual Tour Section */}
            <RevealSection delay={0.15}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">{t("propertyDetail.virtualTour")}</h2>
                    {(property.virtualTourImages || property.virtualTourUrl) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => navigate("virtual-tour", { propertyId: property.id })}
                      >
                        <Maximize className="w-4 h-4" />
                        {t("virtualTour.openFullTour")}
                      </Button>
                    )}
                  </div>
                  {(property.virtualTourImages || property.virtualTourUrl) ? (
                    <PanoramicViewer
                      images={
                        property.virtualTourImages
                          ? property.virtualTourImages.split(",").map((url: string) => url.trim()).filter(Boolean)
                          : property.virtualTourUrl
                            ? [property.virtualTourUrl]
                            : imageList
                      }
                      autoRotate={true}
                      roomLabels={
                        property.virtualTourImages
                          ? property.virtualTourImages.split(",").map((_: string, idx: number) =>
                              locale === "ar"
                                ? [t("property.rooms.livingRoom"), t("property.rooms.masterBedroom"), t("property.rooms.kitchen"), t("property.rooms.bathroom"), t("property.rooms.balcony"), t("property.rooms.diningRoom"), t("property.rooms.guestRoom"), t("property.rooms.study"), t("property.rooms.garage"), t("property.rooms.garden")][idx]
                                : [t("property.rooms.livingRoom"), t("property.rooms.masterBedroom"), t("property.rooms.kitchen"), t("property.rooms.bathroom"), t("property.rooms.balcony"), t("property.rooms.diningRoom"), t("property.rooms.guestRoom"), t("property.rooms.study"), t("property.rooms.garage"), t("property.rooms.garden")][idx]
                            )
                          : undefined
                      }
                      onOpenFullTour={() => navigate("virtual-tour", { propertyId: property.id })}
                    />
                  ) : (
                    <div className="relative h-64 sm:h-80 rounded-xl overflow-hidden bg-primary flex items-center justify-center">
                      {/* Subtle dot pattern */}
                      <div className="absolute inset-0 opacity-10" style={{
                        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)`,
                        backgroundSize: "32px 32px",
                      }} />

                      <div className="relative z-10 text-center">
                        <div className="w-20 h-20 rounded-full bg-white/15 flex items-center justify-center mx-auto mb-4 border border-white/20">
                          <Play className="w-8 h-8 text-primary-foreground ms-1" />
                        </div>
                        <p className="text-white/80 text-sm mb-4 max-w-sm">
                          {t("virtualTour.noTourAvailable")}
                        </p>
                        <p className="text-white/60 text-xs max-w-sm">
                          {t("virtualTour.noTourDesc")}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </RevealSection>

            {/* Map Section */}
            <RevealSection delay={0.15}>
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4">{t("propertyDetail.location")}</h2>
                  {property.lat && property.lng ? (
                    <PropertyMap
                      properties={[{
                        id: property.id,
                        titleEn: property.titleEn,
                        titleAr: property.titleAr,
                        price: property.price,
                        lat: property.lat,
                        lng: property.lng,
                        type: property.type,
                        status: property.status,
                        images: property.images,
                        bedrooms: property.bedrooms,
                        bathrooms: property.bathrooms,
                        area: property.area,
                        locationEn: property.locationEn,
                        locationAr: property.locationAr,
                      }]}
                      height="h-[300px]"
                      singleProperty={true}
                    />
                  ) : (
                    <div className="h-64 rounded-xl bg-muted flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <MapPin className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">{address}, {location}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </RevealSection>

            {/* Walk Score Section — data not available from API */}
            <RevealSection delay={0.2}>
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-5">{t("walkScore.title")}</h2>
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Footprints className="w-10 h-10 text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {t("propertyDetail.scoresNotAvailable")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </RevealSection>

            {/* Price History Section */}
            <RevealSection delay={0.2}>
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-5">{t("priceHistory.title")}</h2>

                  {/* Current Price & Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {/* Current Price */}
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                      <p className="text-xs text-muted-foreground mb-1">{t("priceHistory.currentPrice")}</p>
                      <p className="text-xl font-bold text-primary">
                        {t("common.currency")}{property.price.toLocaleString()}
                      </p>
                    </div>

                    {/* Days on Market & Price/sqft */}
                    <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">{t("priceHistory.daysOnMarket")}</p>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="text-lg font-bold">
                          {property.createdAt
                            ? Math.max(1, Math.floor((Date.now() - new Date(property.createdAt).getTime()) / (1000 * 60 * 60 * 24)))
                            : "—"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("priceHistory.pricePerSqft")}: {t("common.currency")}{Math.round(property.price / property.area).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Price History — not available */}
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <TrendingUp className="w-10 h-10 text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {t("propertyDetail.noPriceHistory")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </RevealSection>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Agent Card — No gradient, design tokens */}
            {property.agent && (
              <RevealSection delay={0.1}>
                <Card className="overflow-hidden">
                  {/* Clean header with design tokens */}
                  <div className="bg-primary p-4">
                    <h2 className="text-lg font-semibold text-primary-foreground">{t("propertyDetail.contactAgent")}</h2>
                    <p className="text-primary-foreground/80 text-sm">{t("propertyDetail.scheduleVisit")}</p>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <img
                        src={property.agent.image || `https://placehold.co/80x80/e2e8f0/64748b?text=Agent`}
                        alt={locale === "ar" ? property.agent.nameAr : property.agent.nameEn}
                        className="w-14 h-14 rounded-full object-cover border-2 border-primary/20"
                      />
                      <div>
                        <p className="font-semibold">{locale === "ar" ? property.agent.nameAr : property.agent.nameEn}</p>
                        <p className="text-sm text-muted-foreground">{locale === "ar" ? property.agent.titleAr : property.agent.titleEn}</p>
                        {property.agent.rating > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < Math.round(property.agent.rating) ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                            ))}
                            <span className="text-xs text-muted-foreground ms-1">{property.agent.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Send className="w-3.5 h-3.5" /> {property.agent.email}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5" /> {property.agent.phone}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1.5"
                        onClick={() => navigate("agents")}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {t("agents.viewProperties")}
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 gap-1.5"
                        onClick={() => {
                          window.open(`tel:${property.agent.phone}`);
                        }}
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {t("propertyDetail.call")}
                      </Button>
                    </div>
                    {/* Schedule Tour Button — btn-gold */}
                    <ScheduleTourDialog
                      propertyId={property.id}
                      propertyTitle={title}
                      trigger={
                        <Button className="w-full mt-3 btn-gold gap-2" size="sm">
                          <Calendar className="w-4 h-4" />
                          {t("tour.scheduleTour")}
                        </Button>
                      }
                    />
                    {/* Message Agent Button */}
                    <Button
                      variant="outline"
                      className="w-full mt-2 gap-2"
                      size="sm"
                      onClick={() => navigate("messaging", { agentId: property.agent!.id, propertyId: property.id })}
                    >
                      <MessageCircle className="w-4 h-4" />
                      {t("messaging.messageAgent")}
                    </Button>
                  </CardContent>
                </Card>
              </RevealSection>
            )}

            {/* Schedule Tour Card (always visible when no agent) — No gradient, design tokens */}
            {!property.agent && (
              <RevealSection delay={0.1}>
                <Card className="overflow-hidden">
                  <div className="bg-primary p-4">
                    <h2 className="text-lg font-semibold text-primary-foreground">{t("tour.scheduleTour")}</h2>
                    <p className="text-primary-foreground/80 text-sm">{t("propertyDetail.scheduleVisit")}</p>
                  </div>
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t("propertyDetail.bookTourDesc")}
                    </p>
                    <ScheduleTourDialog
                      propertyId={property.id}
                      propertyTitle={title}
                      trigger={
                        <Button className="w-full btn-gold gap-2">
                          <Calendar className="w-4 h-4" />
                          {t("tour.scheduleTour")}
                        </Button>
                      }
                    />
                  </CardContent>
                </Card>
              </RevealSection>
            )}

            {/* Mortgage Estimate Widget */}
            <RevealSection delay={0.15}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold">{t("propertyDetail.mortgageEstimate")}</h2>
                  </div>
                  <Separator className="mb-4" />
                  <div className="text-center mb-4">
                    <p className="text-sm text-muted-foreground mb-1">{t("propertyDetail.estimatedMonthly")}</p>
                    <p className="text-3xl font-bold text-primary">
                      {t("common.currency")}{Math.round(monthlyPayment).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("propertyDetail.atRate")}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    <div className="bg-muted/50 rounded-xl p-2.5 text-center">
                      <p className="text-xs text-muted-foreground">{t("calculator.loanAmount")}</p>
                      <p className="font-semibold">
                        {t("common.currency")}{Math.round(property.price * 0.8).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-2.5 text-center">
                      <p className="text-xs text-muted-foreground">{t("calculator.downPayment")}</p>
                      <p className="font-semibold">
                        {t("common.currency")}{Math.round(property.price * 0.2).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => navigate("calculator")}
                  >
                    <Calculator className="w-4 h-4" />
                    {t("propertyDetail.fullMortgageCalculator")}
                  </Button>
                </CardContent>
              </Card>
            </RevealSection>

            {/* Commute Times Card */}
            <RevealSection delay={0.18}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Route className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold">{t("commute.commuteTimes")}</h2>
                  </div>
                  <Separator className="mb-4" />
                  {property.lat && property.lng ? (
                    <>
                      <div className="space-y-2.5 mb-4">
                        {[
                          { name: t("commute.downtown"), lat: 40.758, lng: -73.9855 },
                          { name: t("commute.airport"), lat: 40.6413, lng: -73.7781 },
                          { name: t("commute.centralStation"), lat: 40.7527, lng: -73.9772 },
                        ].map((dest) => {
                          const R = 6371;
                          const dLat = (dest.lat - property.lat!) * Math.PI / 180;
                          const dLng = (dest.lng - property.lng!) * Math.PI / 180;
                          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                            Math.cos(property.lat! * Math.PI / 180) * Math.cos(dest.lat * Math.PI / 180) *
                            Math.sin(dLng/2) * Math.sin(dLng/2);
                          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                          const dist = R * c;
                          const drivingTime = Math.round((dist / 40) * 1.3 * 60);
                          const indicator = drivingTime < 15 ? "🟢" : drivingTime < 30 ? "🟡" : drivingTime < 45 ? "🟠" : "🔴";

                          return (
                            <div key={dest.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{indicator}</span>
                                <span className="text-xs font-medium">{dest.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Car className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs font-semibold">{drivingTime} {t("commute.minutes")}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => navigate("commute")}
                      >
                        <Route className="w-4 h-4" />
                        {t("commute.openCalculator")}
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <MapPin className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">
                        {t("propertyDetail.locationNotAvailable")}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </RevealSection>

            {/* Inquiry Form */}
            <RevealSection delay={0.2}>
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4">{t("propertyDetail.requestInfo")}</h2>
                  <form onSubmit={handleInquiry} className="space-y-3">
                    <Input
                      placeholder={t("propertyDetail.name")}
                      value={inquiryForm.name}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                      required
                    />
                    <Input
                      type="email"
                      placeholder={t("propertyDetail.email")}
                      value={inquiryForm.email}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                      required
                    />
                    <Input
                      type="tel"
                      placeholder={t("propertyDetail.phone")}
                      value={inquiryForm.phone}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                    />
                    <Textarea
                      placeholder={t("propertyDetail.message")}
                      value={inquiryForm.message}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                      rows={4}
                      required
                    />
                    <Button type="submit" className="w-full btn-gold" disabled={submitting}>
                      {submitting ? t("common.loading") : t("propertyDetail.send")}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </RevealSection>
          </div>
        </div>

        {/* Similar Properties */}
        {similarProperties.length > 0 && (
          <RevealSection delay={0.1}>
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">{t("propertyDetail.similarProperties")}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {similarProperties.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            </div>
          </RevealSection>
        )}

        {/* Property Reviews */}
        <RevealSection delay={0.15}>
          <PropertyReviews propertyId={property.id} />
        </RevealSection>
      </div>

    </div>
  );
}
