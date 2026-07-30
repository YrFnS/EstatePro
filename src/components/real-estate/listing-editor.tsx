"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter as useNextRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Bath,
  Bed,
  Building2,
  Calendar,
  Car,
  CheckCircle2,
  FileText,
  Globe,
  Loader2,
  MapPin,
  Maximize,
  Save,
  Send,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n/provider";
import { useRouter } from "@/lib/router";
import { cn } from "@/lib/utils";
import {
  PropertyMediaManager,
  type ListingMediaItem,
} from "@/components/real-estate/property-media-manager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

interface ListingEditorProps {
  listingId?: string;
}

interface ListingForm {
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: string;
  type: string;
  marketStatus: "sale" | "rent";
  bedrooms: string;
  bathrooms: string;
  area: string;
  locationEn: string;
  locationAr: string;
  addressEn: string;
  addressAr: string;
  cityEn: string;
  cityAr: string;
  features: string;
  yearBuilt: string;
  parking: string;
  lat: string;
  lng: string;
  virtualTourUrl: string;
  virtualTourImages: string;
}

interface SubmissionIssue {
  field: string;
  code: string;
  message: string;
}

interface ListingDetail {
  id: string;
  listingStatus: string;
  reviewNotes: string | null;
  completion: number;
  submissionIssues: SubmissionIssue[];
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: number;
  type: string;
  status: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  locationEn: string;
  locationAr: string;
  addressEn: string;
  addressAr: string;
  cityEn: string;
  cityAr: string;
  features: string;
  yearBuilt: number | null;
  parking: number;
  lat: number | null;
  lng: number | null;
  virtualTourUrl: string | null;
  virtualTourImages: string | null;
  media: ListingMediaItem[];
}

const emptyForm: ListingForm = {
  titleEn: "",
  titleAr: "",
  descriptionEn: "",
  descriptionAr: "",
  price: "",
  type: "apartment",
  marketStatus: "sale",
  bedrooms: "1",
  bathrooms: "1",
  area: "",
  locationEn: "",
  locationAr: "",
  addressEn: "",
  addressAr: "",
  cityEn: "",
  cityAr: "",
  features: "",
  yearBuilt: "",
  parking: "0",
  lat: "",
  lng: "",
  virtualTourUrl: "",
  virtualTourImages: "",
};

const editableStatuses = new Set([
  "draft",
  "changes_requested",
  "rejected",
]);

function numberOrNull(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formPayload(form: ListingForm) {
  return {
    titleEn: form.titleEn.trim(),
    titleAr: form.titleAr.trim(),
    descriptionEn: form.descriptionEn.trim(),
    descriptionAr: form.descriptionAr.trim(),
    price: Number(form.price) || 0,
    type: form.type,
    status: form.marketStatus,
    bedrooms: Number(form.bedrooms) || 0,
    bathrooms: Number(form.bathrooms) || 0,
    area: Number(form.area) || 0,
    locationEn: form.locationEn.trim(),
    locationAr: form.locationAr.trim(),
    addressEn: form.addressEn.trim(),
    addressAr: form.addressAr.trim(),
    cityEn: form.cityEn.trim(),
    cityAr: form.cityAr.trim(),
    features: form.features.trim(),
    yearBuilt: numberOrNull(form.yearBuilt),
    parking: Number(form.parking) || 0,
    lat: numberOrNull(form.lat),
    lng: numberOrNull(form.lng),
    virtualTourUrl: form.virtualTourUrl.trim() || null,
    virtualTourImages: form.virtualTourImages.trim() || null,
  };
}

function listingToForm(listing: ListingDetail): ListingForm {
  return {
    titleEn: listing.titleEn,
    titleAr: listing.titleAr,
    descriptionEn: listing.descriptionEn,
    descriptionAr: listing.descriptionAr,
    price: listing.price > 0 ? String(listing.price) : "",
    type: listing.type || "apartment",
    marketStatus: listing.status === "rent" ? "rent" : "sale",
    bedrooms: String(listing.bedrooms ?? 0),
    bathrooms: String(listing.bathrooms ?? 0),
    area: listing.area > 0 ? String(listing.area) : "",
    locationEn: listing.locationEn,
    locationAr: listing.locationAr,
    addressEn: listing.addressEn,
    addressAr: listing.addressAr,
    cityEn: listing.cityEn,
    cityAr: listing.cityAr,
    features: listing.features || "",
    yearBuilt: listing.yearBuilt ? String(listing.yearBuilt) : "",
    parking: String(listing.parking ?? 0),
    lat: listing.lat == null ? "" : String(listing.lat),
    lng: listing.lng == null ? "" : String(listing.lng),
    virtualTourUrl: listing.virtualTourUrl || "",
    virtualTourImages: listing.virtualTourImages || "",
  };
}

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    ...options,
    headers: {
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
      ...(options?.headers || {}),
    },
  });
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const error = new Error(
      typeof payload.error === "string" ? payload.error : "Request failed"
    ) as Error & { issues?: SubmissionIssue[] };
    if (Array.isArray(payload.issues)) {
      error.issues = payload.issues as SubmissionIssue[];
    }
    throw error;
  }
  return payload as T;
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required,
  icon,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-2">
        {icon}
        {label}
        {required ? <span className="text-destructive">*</span> : null}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function statusVariant(status: string) {
  if (status === "published") return "default" as const;
  if (status === "pending_review" || status === "scheduled") return "secondary" as const;
  if (status === "rejected" || status === "changes_requested") return "destructive" as const;
  return "outline" as const;
}

export function ListingEditor({ listingId }: ListingEditorProps) {
  const { locale } = useI18n();
  const { navigate, back } = useRouter();
  const nextRouter = useNextRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [propertyId, setPropertyId] = useState(listingId || "");
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [form, setForm] = useState<ListingForm>(emptyForm);
  const [loading, setLoading] = useState(Boolean(listingId));
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mediaCount, setMediaCount] = useState(0);
  const [issues, setIssues] = useState<SubmissionIssue[]>([]);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const payload = await api<{ listing: ListingDetail }>(
        `/api/account/listings/${encodeURIComponent(id)}`
      );
      setListing(payload.listing);
      setForm(listingToForm(payload.listing));
      setMediaCount(
        payload.listing.media.filter((item) => item.type === "image").length
      );
      setIssues(payload.listing.submissionIssues || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load listing");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (listingId && user?.id) void load(listingId);
  }, [listingId, load, user?.id]);

  const setField = <K extends keyof ListingForm>(key: K, value: ListingForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setIssues((current) => current.filter((issue) => issue.field !== key));
  };

  const editable =
    !listing ||
    user?.role === "admin" ||
    editableStatuses.has(listing.listingStatus);

  const calculatedCompletion = useMemo(() => {
    const checks = [
      form.titleEn.trim(),
      form.titleAr.trim(),
      form.descriptionEn.trim(),
      form.descriptionAr.trim(),
      Number(form.price) > 0,
      form.type,
      form.marketStatus,
      Number(form.area) > 0,
      form.locationEn.trim(),
      form.locationAr.trim(),
      form.addressEn.trim(),
      form.addressAr.trim(),
      form.cityEn.trim(),
      form.cityAr.trim(),
      mediaCount > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [form, mediaCount]);

  const saveDetails = async (): Promise<string | null> => {
    if (!form.titleEn.trim() && !form.titleAr.trim()) {
      toast.error(locale === "ar" ? "أضف عنواناً للإعلان" : "Add a listing title first");
      return null;
    }

    setSaving(true);
    try {
      if (!propertyId) {
        const payload = await api<{ listing: ListingDetail }>(
          "/api/account/listings",
          {
            method: "POST",
            body: JSON.stringify({
              listing: formPayload(form),
              action: "save_draft",
            }),
          }
        );
        setPropertyId(payload.listing.id);
        setListing(payload.listing);
        setIssues(payload.listing.submissionIssues || []);
        nextRouter.replace(`/my-listings/${encodeURIComponent(payload.listing.id)}/edit`);
        toast.success(locale === "ar" ? "تم حفظ المسودة" : "Draft created");
        return payload.listing.id;
      }

      const payload = await api<{ listing: ListingDetail }>(
        `/api/account/listings/${encodeURIComponent(propertyId)}`,
        {
          method: "PUT",
          body: JSON.stringify({ listing: formPayload(form) }),
        }
      );
      if (payload.listing) {
        setListing(payload.listing);
        setIssues(payload.listing.submissionIssues || []);
      }
      toast.success(locale === "ar" ? "تم حفظ التغييرات" : "Changes saved");
      return propertyId;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save listing");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const submitForReview = async () => {
    setSubmitting(true);
    try {
      const id = await saveDetails();
      if (!id) return;
      const payload = await api<{ listing: ListingDetail }>(
        `/api/account/listings/${encodeURIComponent(id)}/actions`,
        {
          method: "POST",
          body: JSON.stringify({ action: "submit" }),
        }
      );
      setListing((current) => current ? { ...current, ...payload.listing, listingStatus: "pending_review" } : current);
      setIssues([]);
      toast.success(
        locale === "ar"
          ? "تم إرسال الإعلان للمراجعة"
          : "Listing submitted for review"
      );
      nextRouter.push("/my-listings");
    } catch (error) {
      const typed = error as Error & { issues?: SubmissionIssue[] };
      if (typed.issues) setIssues(typed.issues);
      toast.error(typed.message || "Failed to submit listing");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <Skeleton className="mb-6 h-12 w-72" />
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Skeleton className="h-[720px] rounded-3xl" />
          <Skeleton className="h-72 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-20 text-center">
        <Building2 className="mx-auto h-14 w-14 text-muted-foreground/40" />
        <h1 className="mt-5 text-2xl font-bold">
          {locale === "ar" ? "سجّل الدخول لإضافة عقار" : "Sign in to create a listing"}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {locale === "ar"
            ? "يتم حفظ المسودات وربطها بحسابك حتى تتمكن من متابعتها من أي جهاز."
            : "Drafts are attached to your account so you can continue them from any device."}
        </p>
        <Button className="mt-6" onClick={() => navigate("home")}>
          {locale === "ar" ? "العودة للرئيسية" : "Back to home"}
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 md:py-12">
      <Button variant="ghost" className="mb-5 gap-2" onClick={back}>
        <ArrowLeft className="h-4 w-4" />
        {locale === "ar" ? "رجوع" : "Back"}
      </Button>

      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(listing?.listingStatus || "draft")} className="capitalize">
              {(listing?.listingStatus || "draft").replaceAll("_", " ")}
            </Badge>
            {propertyId ? <Badge variant="outline">ID {propertyId.slice(-8)}</Badge> : null}
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {propertyId
              ? locale === "ar" ? "تعديل الإعلان" : "Edit listing"
              : locale === "ar" ? "إضافة عقار" : "Create a property listing"}
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {locale === "ar"
              ? "احفظ مسودة، أضف الوسائط، ثم أرسل الإعلان للمراجعة قبل نشره."
              : "Save a draft, add media, and submit it for review before publication."}
          </p>
        </div>
        <div className="min-w-64 rounded-2xl border bg-card p-4">
          <div className="flex items-center justify-between text-sm">
            <span>{locale === "ar" ? "اكتمال الإعلان" : "Listing completion"}</span>
            <strong>{calculatedCompletion}%</strong>
          </div>
          <Progress value={calculatedCompletion} className="mt-3" />
        </div>
      </div>

      {listing?.reviewNotes ? (
        <Card className="mb-6 rounded-2xl border-amber-300 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20">
          <CardContent className="flex gap-3 p-5">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold">
                {locale === "ar" ? "ملاحظات المراجعة" : "Review feedback"}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{listing.reviewNotes}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!editable ? (
        <Card className="mb-6 rounded-2xl">
          <CardContent className="flex gap-3 p-5">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-semibold">
                {locale === "ar" ? "الإعلان للعرض فقط" : "This listing is read-only"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {locale === "ar"
                  ? "لا يمكن تعديل الإعلان أثناء المراجعة أو بعد جدولة النشر. يمكنك إدارته من صفحة إعلاناتي."
                  : "Listings cannot be edited while under review or scheduled. Manage its workflow from My Listings."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Card className="rounded-3xl">
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />{locale === "ar" ? "المعلومات الأساسية" : "Basic information"}</CardTitle></CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <Field id="listing-title-en" label="Title (English)" value={form.titleEn} onChange={(value) => setField("titleEn", value)} required icon={<Globe className="h-4 w-4" />} />
              <Field id="listing-title-ar" label="العنوان بالعربية" value={form.titleAr} onChange={(value) => setField("titleAr", value)} required icon={<Globe className="h-4 w-4" />} />
              <div className="space-y-2 md:col-span-2"><Label>Description (English)</Label><Textarea rows={5} value={form.descriptionEn} onChange={(event) => setField("descriptionEn", event.target.value)} /></div>
              <div className="space-y-2 md:col-span-2"><Label>الوصف بالعربية</Label><Textarea dir="rtl" rows={5} value={form.descriptionAr} onChange={(event) => setField("descriptionAr", event.target.value)} /></div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" />{locale === "ar" ? "تفاصيل العقار" : "Property details"}</CardTitle></CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              <Field id="listing-price" label={locale === "ar" ? "السعر" : "Price"} value={form.price} onChange={(value) => setField("price", value)} type="number" required />
              <div className="space-y-2"><Label>{locale === "ar" ? "نوع العقار" : "Property type"}</Label><Select value={form.type} onValueChange={(value) => setField("type", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["apartment", "villa", "house", "condo", "townhouse", "penthouse"].map((type) => <SelectItem value={type} key={type} className="capitalize">{type}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>{locale === "ar" ? "نوع العرض" : "Listing type"}</Label><Select value={form.marketStatus} onValueChange={(value: "sale" | "rent") => setField("marketStatus", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sale">For sale</SelectItem><SelectItem value="rent">For rent</SelectItem></SelectContent></Select></div>
              <Field id="listing-bedrooms" label={locale === "ar" ? "غرف النوم" : "Bedrooms"} value={form.bedrooms} onChange={(value) => setField("bedrooms", value)} type="number" icon={<Bed className="h-4 w-4" />} />
              <Field id="listing-bathrooms" label={locale === "ar" ? "الحمامات" : "Bathrooms"} value={form.bathrooms} onChange={(value) => setField("bathrooms", value)} type="number" icon={<Bath className="h-4 w-4" />} />
              <Field id="listing-area" label={locale === "ar" ? "المساحة" : "Area (sq ft)"} value={form.area} onChange={(value) => setField("area", value)} type="number" required icon={<Maximize className="h-4 w-4" />} />
              <Field id="listing-year" label={locale === "ar" ? "سنة البناء" : "Year built"} value={form.yearBuilt} onChange={(value) => setField("yearBuilt", value)} type="number" icon={<Calendar className="h-4 w-4" />} />
              <Field id="listing-parking" label={locale === "ar" ? "مواقف السيارات" : "Parking spaces"} value={form.parking} onChange={(value) => setField("parking", value)} type="number" icon={<Car className="h-4 w-4" />} />
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" />{locale === "ar" ? "الموقع" : "Location"}</CardTitle></CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <Field id="location-en" label="Location (English)" value={form.locationEn} onChange={(value) => setField("locationEn", value)} required />
              <Field id="location-ar" label="الموقع بالعربية" value={form.locationAr} onChange={(value) => setField("locationAr", value)} required />
              <Field id="address-en" label="Address (English)" value={form.addressEn} onChange={(value) => setField("addressEn", value)} required />
              <Field id="address-ar" label="العنوان بالعربية" value={form.addressAr} onChange={(value) => setField("addressAr", value)} required />
              <Field id="city-en" label="City (English)" value={form.cityEn} onChange={(value) => setField("cityEn", value)} required />
              <Field id="city-ar" label="المدينة بالعربية" value={form.cityAr} onChange={(value) => setField("cityAr", value)} required />
              <Field id="latitude" label="Latitude" value={form.lat} onChange={(value) => setField("lat", value)} type="number" />
              <Field id="longitude" label="Longitude" value={form.lng} onChange={(value) => setField("lng", value)} type="number" />
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />{locale === "ar" ? "معلومات إضافية" : "Additional information"}</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2"><Label>{locale === "ar" ? "المميزات مفصولة بفواصل" : "Features, separated by commas"}</Label><Textarea rows={3} value={form.features} onChange={(event) => setField("features", event.target.value)} /></div>
              <div className="grid gap-5 md:grid-cols-2">
                <Field id="virtual-tour-url" label="Virtual tour URL" value={form.virtualTourUrl} onChange={(value) => setField("virtualTourUrl", value)} />
                <Field id="virtual-tour-images" label="Panorama URLs" value={form.virtualTourImages} onChange={(value) => setField("virtualTourImages", value)} />
              </div>
            </CardContent>
          </Card>

          {propertyId ? (
            <Card className="rounded-3xl">
              <CardHeader><CardTitle>{locale === "ar" ? "الصور والوسائط" : "Images and media"}</CardTitle></CardHeader>
              <CardContent>
                <PropertyMediaManager propertyId={propertyId} editable={editable} onChange={(items) => setMediaCount(items.filter((item) => item.type === "image").length)} />
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-3xl border-dashed"><CardContent className="p-8 text-center"><Save className="mx-auto h-9 w-9 text-muted-foreground/40" /><p className="mt-3 font-medium">{locale === "ar" ? "احفظ المسودة لإضافة الصور" : "Save the draft to add media"}</p><p className="mt-1 text-sm text-muted-foreground">{locale === "ar" ? "سيتم إنشاء مساحة آمنة خاصة بهذا الإعلان للصور والفيديو والمخططات." : "A private listing workspace will be created for images, video, and floor plans."}</p></CardContent></Card>
          )}
        </div>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <Card className="rounded-3xl">
            <CardHeader><CardTitle className="text-lg">{locale === "ar" ? "الإجراءات" : "Actions"}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {editable ? (
                <>
                  <Button type="button" variant="outline" className="w-full gap-2" disabled={saving || submitting} onClick={() => void saveDetails()}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{propertyId ? (locale === "ar" ? "حفظ التغييرات" : "Save changes") : (locale === "ar" ? "حفظ كمسودة" : "Save draft")}</Button>
                  <Button type="button" className="w-full gap-2" disabled={saving || submitting || !propertyId} onClick={() => void submitForReview()}>{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{locale === "ar" ? "إرسال للمراجعة" : "Submit for review"}</Button>
                </>
              ) : null}
              {propertyId ? <Button type="button" variant="ghost" className="w-full" onClick={() => navigate("property-detail", { id: propertyId })}>{locale === "ar" ? "معاينة الإعلان" : "Preview listing"}</Button> : null}
              <Button type="button" variant="ghost" className="w-full" onClick={() => navigate("my-listings")}>{locale === "ar" ? "إعلاناتي" : "My listings"}</Button>
            </CardContent>
          </Card>

          {issues.length ? (
            <Card className="rounded-3xl border-destructive/30">
              <CardHeader><CardTitle className="flex items-center gap-2 text-base text-destructive"><AlertCircle className="h-4 w-4" />{locale === "ar" ? "مطلوب قبل الإرسال" : "Required before submission"}</CardTitle></CardHeader>
              <CardContent><ul className="space-y-2 text-sm text-muted-foreground">{issues.map((issue) => <li key={`${issue.field}-${issue.code}`} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />{issue.message}</li>)}</ul></CardContent>
            </Card>
          ) : propertyId ? (
            <Card className="rounded-3xl border-primary/20 bg-primary/5"><CardContent className="flex gap-3 p-5"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><p className="font-semibold">{locale === "ar" ? "جاهز للمراجعة" : "Ready for review"}</p><p className="mt-1 text-sm text-muted-foreground">{locale === "ar" ? "احفظ آخر التغييرات ثم أرسل الإعلان إلى فريق المراجعة." : "Save the latest changes and submit the listing to the moderation team."}</p></div></CardContent></Card>
          ) : null}

          <Card className="rounded-3xl bg-muted/40">
            <CardContent className="p-5 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">{locale === "ar" ? "ماذا يحدث بعد الإرسال؟" : "What happens after submission?"}</p>
              <ol className="mt-3 space-y-2">
                <li>1. {locale === "ar" ? "يتحقق الفريق من البيانات والصور." : "The team checks details and media."}</li>
                <li>2. {locale === "ar" ? "قد يطلب تعديلات مع ملاحظات واضحة." : "Changes may be requested with clear feedback."}</li>
                <li>3. {locale === "ar" ? "بعد الموافقة يتم النشر فوراً أو في الموعد المحدد." : "Approval publishes immediately or at the scheduled time."}</li>
              </ol>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
