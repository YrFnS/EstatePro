"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bath,
  Bed,
  Building2,
  Calculator,
  Calendar,
  Car,
  CheckCircle2,
  Heart,
  Loader2,
  MapPin,
  Maximize,
  MessageCircle,
  Phone,
  PlayCircle,
  Send,
  Share2,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useCompare } from "@/lib/compare";
import { useFavorites } from "@/lib/favorites";
import { useI18n } from "@/lib/i18n/provider";
import { useRecentlyViewed } from "@/lib/recently-viewed";
import { useRouter } from "@/lib/router";
import { cn } from "@/lib/utils";
import { PropertyCard } from "@/components/real-estate/property-card";
import { PropertyGallery } from "@/components/real-estate/property-gallery";
import { PropertyMap } from "@/components/real-estate/property-map";
import { PropertyReviews } from "@/components/real-estate/property-reviews";
import { ScheduleTourDialog } from "@/components/real-estate/schedule-tour-dialog";
import { SharePropertyDialog } from "@/components/real-estate/share-property-dialog";
import type { Property } from "@/components/real-estate/types/property";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

function monthlyPayment(price: number): number {
  const principal = price * 0.8;
  const rate = 0.065 / 12;
  const payments = 30 * 12;
  if (principal <= 0) return 0;
  return (
    (principal * rate * Math.pow(1 + rate, payments)) /
    (Math.pow(1 + rate, payments) - 1)
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function DetailStat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Bed;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-background p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function PropertyDetailPage() {
  const { t, locale } = useI18n();
  const { params, back, navigate } = useRouter();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isInCompare, toggleCompare } = useCompare();
  const { addViewed } = useRecentlyViewed();
  const [property, setProperty] = useState<Property | null>(null);
  const [similar, setSimilar] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [inquiry, setInquiry] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const copy = useCallback(
    (key: string, fallback: string) => {
      const translated = t(key);
      return translated === key ? fallback : translated;
    },
    [t]
  );

  useEffect(() => {
    if (!user) return;
    setInquiry((current) => ({
      ...current,
      name: current.name || user.name,
      email: current.email || user.email,
    }));
  }, [user]);

  const load = useCallback(async () => {
    if (!params.id) {
      setError(copy("property.notFound", "Property not found"));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/properties/${encodeURIComponent(params.id)}`, {
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error || "Property not found");
      }

      const loaded = payload as Property;
      setProperty(loaded);
      addViewed(loaded.id);

      const similarResponse = await fetch(
        `/api/properties?type=${encodeURIComponent(loaded.type)}&limit=4`,
        { cache: "no-store" }
      );
      if (similarResponse.ok) {
        const similarPayload = await similarResponse.json();
        setSimilar(
          (similarPayload.properties || [])
            .filter((item: Property) => item.id !== loaded.id)
            .slice(0, 3)
        );
      }
    } catch (caught) {
      console.error(caught);
      setProperty(null);
      setSimilar([]);
      setError(
        caught instanceof Error
          ? caught.message
          : copy("property.notFound", "Property not found")
      );
    } finally {
      setLoading(false);
    }
  }, [addViewed, copy, params.id]);

  useEffect(() => {
    load();
  }, [load]);

  const submitInquiry = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!property || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...inquiry, propertyId: property.id }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to send inquiry");
      }
      toast.success(copy("contact.successMessage", "Inquiry sent successfully"));
      setInquiry((current) => ({ ...current, phone: "", message: "" }));
    } catch (caught) {
      toast.error(
        caught instanceof Error
          ? caught.message
          : copy("contact.failed", "Failed to send inquiry")
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12">
        <Skeleton className="mb-5 h-9 w-44" />
        <Skeleton className="mb-8 h-[420px] w-full rounded-3xl" />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-52 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-[520px] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!property || error) {
    return (
      <div className="container mx-auto flex min-h-[55vh] flex-col items-center justify-center px-4 text-center">
        <Building2 className="mb-4 h-14 w-14 text-muted-foreground/35" />
        <h1 className="text-2xl font-bold">{copy("property.notFound", "Property not found")}</h1>
        <p className="mt-2 max-w-md text-muted-foreground">{error}</p>
        <Button className="mt-6" onClick={() => navigate("properties")}>
          {copy("property.browse", "Browse properties")}
        </Button>
      </div>
    );
  }

  const title = locale === "ar" ? property.titleAr : property.titleEn;
  const description =
    locale === "ar" ? property.descriptionAr : property.descriptionEn;
  const location = locale === "ar" ? property.locationAr : property.locationEn;
  const address = locale === "ar" ? property.addressAr : property.addressEn;
  const agent = property.agent ?? null;
  const agentName = agent
    ? locale === "ar"
      ? agent.nameAr
      : agent.nameEn
    : "";
  const agentTitle = agent
    ? locale === "ar"
      ? agent.titleAr
      : agent.titleEn
    : "";
  const imageList = property.images
    ? property.images.split(",").map((item) => item.trim()).filter(Boolean)
    : [];
  const features = property.features
    ? property.features.split(",").map((item) => item.trim()).filter(Boolean)
    : [];
  const panoramas = property.virtualTourImages
    ? property.virtualTourImages.split(",").map((item) => item.trim()).filter(Boolean)
    : [];
  const hasTour = Boolean(property.virtualTourUrl || panoramas.length);
  const favorite = isFavorite(property.id);
  const compared = isInCompare(property.id);
  const estimatedPayment = monthlyPayment(property.price);
  const statusLabel =
    property.status === "sale" ? t("common.forSale") : t("common.forRent");

  const saveFavorite = () => {
    const saved = toggleFavorite(property.id);
    toast.success(
      saved
        ? copy("propertyDetail.savedProperty", "Property saved")
        : copy("propertyDetail.removedProperty", "Property removed from favorites")
    );
  };

  const saveCompare = () => {
    const wasCompared = isInCompare(property.id);
    const result = toggleCompare(property.id);
    if (!wasCompared && !result) {
      toast.warning(t("common.selectUpTo3"));
      return;
    }
    toast.success(
      wasCompared ? t("common.removeFromCompare") : t("common.addToCompare")
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={back} className="gap-2">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t("common.back")}
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={saveFavorite}
            aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={favorite}
          >
            <Heart className={cn("h-4 w-4", favorite && "fill-red-500 text-red-500")} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={saveCompare}
            aria-label={compared ? t("common.removeFromCompare") : t("common.addToCompare")}
            aria-pressed={compared}
          >
            <CheckCircle2 className={cn("h-4 w-4", compared && "text-primary")} />
          </Button>
          <SharePropertyDialog
            propertyId={property.id}
            propertyTitle={title}
            trigger={
              <Button variant="outline" size="icon" aria-label={t("share.share")}>
                <Share2 className="h-4 w-4" />
              </Button>
            }
          />
        </div>
      </div>

      <PropertyGallery
        images={imageList}
        title={title}
        statusLabel={statusLabel}
        statusColor={
          property.status === "sale"
            ? "bg-primary text-primary-foreground"
            : "bg-slate-700 text-white"
        }
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="min-w-0 space-y-8">
          <section>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{statusLabel}</Badge>
              <Badge variant="outline" className="capitalize">
                {copy(`properties.${property.type}`, property.type)}
              </Badge>
              {property.featured ? (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  {copy("property.verified", "Verified")}
                </Badge>
              ) : null}
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">{title}</h1>
            <p className="mt-3 flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              {location}{address ? ` · ${address}` : ""}
            </p>
            <div className="mt-5 flex items-end gap-2">
              <span className="text-3xl font-bold text-primary md:text-4xl">
                {t("common.currency")}
                {property.price.toLocaleString(locale === "ar" ? "ar-IQ" : "en-US")}
              </span>
              {property.status === "rent" ? (
                <span className="pb-1 text-muted-foreground">{t("common.perMonth")}</span>
              ) : null}
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <DetailStat icon={Bed} value={String(property.bedrooms)} label={t("properties.bedrooms")} />
            <DetailStat icon={Bath} value={String(property.bathrooms)} label={t("properties.bathrooms")} />
            <DetailStat icon={Maximize} value={`${property.area.toLocaleString()} ${t("common.sqft")}`} label={copy("propertyDetail.livingArea", "Living area")} />
            <DetailStat icon={Car} value={String(property.parking)} label={copy("propertyDetail.parking", "Parking spaces")} />
          </section>

          <Card className="rounded-2xl border-border/70">
            <CardHeader><CardTitle>{copy("propertyDetail.description", "About this property")}</CardTitle></CardHeader>
            <CardContent>
              <p className="whitespace-pre-line leading-7 text-muted-foreground">{description}</p>
            </CardContent>
          </Card>

          {features.length ? (
            <Card className="rounded-2xl border-border/70">
              <CardHeader><CardTitle>{copy("propertyDetail.features", "Features and amenities")}</CardTitle></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 rounded-xl bg-muted/40 p-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    {feature}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card className="rounded-2xl border-border/70">
            <CardHeader className="flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>{copy("propertyDetail.location", "Location")}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">{location}</p>
              </div>
              <MapPin className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              {property.lat != null && property.lng != null ? (
                <PropertyMap properties={[property]} singleProperty height="h-[360px]" />
              ) : (
                <div className="flex h-48 items-center justify-center rounded-xl bg-muted/40 text-sm text-muted-foreground">
                  {copy("mapView.noLocationData", "Map coordinates are not available for this property.")}
                </div>
              )}
            </CardContent>
          </Card>

          <PropertyReviews propertyId={property.id} />

          {similar.length ? (
            <section>
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">{copy("propertyDetail.similarProperties", "Similar properties")}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{copy("propertyDetail.similarSubtitle", "More listings that may fit your search.")}</p>
                </div>
                <Button variant="outline" onClick={() => navigate("properties", { type: property.type })}>
                  {t("common.viewAll")}
                </Button>
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {similar.map((item) => <PropertyCard key={item.id} property={item} />)}
              </div>
            </section>
          ) : null}
        </main>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Card className="rounded-2xl border-border/70 shadow-sm">
            <CardContent className="p-5">
              {agent ? (
                <>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-14 w-14">
                      {agent.image ? <AvatarImage src={agent.image} alt={agentName} /> : null}
                      <AvatarFallback>{initials(agentName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{agentName}</p>
                      <p className="truncate text-sm text-muted-foreground">{agentTitle}</p>
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {agent.rating.toFixed(1)}
                      </div>
                    </div>
                  </div>
                  <Separator className="my-5" />
                  <div className="grid gap-2">
                    <Button
                      onClick={() =>
                        navigate("messaging", {
                          agentId: agent.id,
                          propertyId: property.id,
                        })
                      }
                      className="gap-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {copy("propertyDetail.messageAgent", "Message agent")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open(`tel:${agent.phone}`)}
                      className="gap-2"
                    >
                      <Phone className="h-4 w-4" />
                      {agent.phone}
                    </Button>
                    <ScheduleTourDialog
                      propertyId={property.id}
                      propertyTitle={title}
                      trigger={
                        <Button variant="outline" className="w-full gap-2">
                          <Calendar className="h-4 w-4" />
                          {copy("tour.schedule", "Schedule a tour")}
                        </Button>
                      }
                    />
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <Building2 className="mx-auto mb-3 h-9 w-9 text-muted-foreground/40" />
                  <p className="font-semibold">{copy("propertyDetail.noAgent", "Agent not assigned")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{copy("propertyDetail.contactOffice", "Contact the EstatePro team for assistance.")}</p>
                  <Button className="mt-4" onClick={() => navigate("contact")}>
                    {t("common.contact")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {hasTour ? (
            <Card className="overflow-hidden rounded-2xl border-primary/25 bg-primary/5">
              <CardContent className="p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <PlayCircle className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{copy("virtualTour.title", "Virtual property tour")}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{copy("virtualTour.subtitle", "Explore rooms and spaces before scheduling a visit.")}</p>
                <Button className="mt-4 w-full" onClick={() => navigate("virtual-tour", { propertyId: property.id })}>
                  {copy("virtualTour.start", "Start virtual tour")}
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <Card className="rounded-2xl border-border/70">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Calculator className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{copy("propertyDetail.estimatedPayment", "Estimated monthly payment")}</p>
                  <p className="text-xl font-bold">{t("common.currency")}{Math.round(estimatedPayment).toLocaleString()}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{copy("propertyDetail.paymentAssumption", "Estimate assumes 20% down, a 30-year term, and 6.5% interest.")}</p>
              <Button variant="outline" className="mt-4 w-full" onClick={() => navigate("calculator")}>
                {t("common.calculator")}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/70">
            <CardHeader><CardTitle className="text-base">{copy("contact.inquiry", "Ask about this property")}</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={submitInquiry} className="space-y-3">
                <Input required value={inquiry.name} onChange={(event) => setInquiry((current) => ({ ...current, name: event.target.value }))} placeholder={copy("contact.name", "Name")} />
                <Input required type="email" value={inquiry.email} onChange={(event) => setInquiry((current) => ({ ...current, email: event.target.value }))} placeholder={copy("contact.email", "Email")} />
                <Input value={inquiry.phone} onChange={(event) => setInquiry((current) => ({ ...current, phone: event.target.value }))} placeholder={copy("contact.phone", "Phone")} />
                <Textarea required value={inquiry.message} onChange={(event) => setInquiry((current) => ({ ...current, message: event.target.value }))} placeholder={copy("contact.message", "How can we help?")} rows={4} />
                <Button className="w-full gap-2" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {copy("contact.send", "Send inquiry")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
