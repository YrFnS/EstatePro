"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Building2,
  CalendarDays,
  Home,
  Inbox,
  LayoutDashboard,
  Loader2,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  MessageSquareQuote,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

type Section = "overview" | "properties" | "agents" | "content" | "settings";

interface OverviewPayload {
  counts: {
    properties: number;
    agents: number;
    users: number;
    inquiries: number;
    tours: number;
    pendingTours: number;
    messages: number;
  };
  recentTours: Array<{
    id: string;
    propertyId: string;
    name: string;
    email: string;
    date: string;
    time: string;
    status: string;
    createdAt: string;
  }>;
  recentInquiries: Array<{
    id: string;
    name: string;
    email: string;
    propertyId: string | null;
    message: string;
    createdAt: string;
  }>;
}

interface AgentSummary {
  id: string;
  nameEn: string;
  nameAr: string;
  titleEn: string;
  titleAr: string;
  bioEn: string;
  bioAr: string;
  email: string;
  phone: string;
  image: string;
  specialization: string;
  experience: number;
  propertiesCount: number;
  rating: number;
  _count?: { properties: number };
}

interface PropertySummary {
  id: string;
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
  images: string;
  features: string;
  yearBuilt: number | null;
  parking: number;
  featured: boolean;
  badge: string | null;
  lat: number | null;
  lng: number | null;
  virtualTourUrl: string | null;
  virtualTourImages: string | null;
  agentId: string | null;
  agent?: Pick<AgentSummary, "id" | "nameEn" | "nameAr" | "email" | "phone" | "image"> | null;
}

interface Testimonial {
  id: string;
  authorEn: string;
  authorAr: string;
  roleEn: string;
  roleAr: string;
  contentEn: string;
  contentAr: string;
  avatar: string;
  rating: number;
  featured: boolean;
  sortOrder: number;
}

interface Neighborhood {
  id: string;
  nameEn: string;
  nameAr: string;
  descEn: string;
  descAr: string;
  avgPrice: string;
  propertyCount: number;
  searchQuery: string;
  image: string;
  featured: boolean;
  sortOrder: number;
}

interface SiteSetting {
  id: string;
  key: string;
  valueEn: string;
  valueAr: string;
  category: string;
  type: string;
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
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof payload.error === "string" ? payload.error : "Request failed"
    );
  }
  return payload as T;
}

function AdminLogin({ onAuthenticated }: { onAuthenticated: (user: AdminUser) => void }) {
  const { locale } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await api<{ user: AdminUser }>("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      onAuthenticated(result.user);
      toast.success(locale === "ar" ? "تم تسجيل الدخول" : "Signed in successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md rounded-3xl border-border/70 shadow-xl">
        <CardContent className="p-8 md:p-10">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">
              {locale === "ar" ? "إدارة EstatePro" : "EstatePro Administration"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {locale === "ar"
                ? "استخدم حساب مسؤول معتمد للمتابعة."
                : "Use an authorized administrator account to continue."}
            </p>
          </div>
          <form onSubmit={submit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="admin-email">{locale === "ar" ? "البريد الإلكتروني" : "Email"}</Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">{locale === "ar" ? "كلمة المرور" : "Password"}</Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <Button className="w-full gap-2" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              {locale === "ar" ? "تسجيل الدخول" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

function OverviewSection() {
  const { locale } = useI18n();
  const [data, setData] = useState<OverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api<OverviewPayload>("/api/admin/overview"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  const metrics = [
    { label: locale === "ar" ? "العقارات" : "Properties", value: data.counts.properties, icon: Building2 },
    { label: locale === "ar" ? "الوكلاء" : "Agents", value: data.counts.agents, icon: Users },
    { label: locale === "ar" ? "المستخدمون" : "Users", value: data.counts.users, icon: Home },
    { label: locale === "ar" ? "الاستفسارات" : "Inquiries", value: data.counts.inquiries, icon: Inbox },
    { label: locale === "ar" ? "الجولات" : "Tours", value: data.counts.tours, icon: CalendarDays },
    { label: locale === "ar" ? "جولات معلقة" : "Pending tours", value: data.counts.pendingTours, icon: CalendarDays },
    { label: locale === "ar" ? "رسائل التواصل" : "Contact messages", value: data.counts.messages, icon: MessageSquareQuote },
  ];

  return (
    <div className="space-y-8">
      <SectionHeading
        title={locale === "ar" ? "نظرة عامة" : "Overview"}
        description={locale === "ar" ? "حالة المنصة والطلبات الأخيرة." : "Platform health and the latest customer activity."}
        action={
          <Button variant="outline" onClick={load} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {locale === "ar" ? "تحديث" : "Refresh"}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="rounded-2xl border-border/70">
            <CardContent className="p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <metric.icon className="h-5 w-5" />
              </div>
              <p className="text-sm text-muted-foreground">{metric.label}</p>
              <p className="mt-1 text-3xl font-bold">{metric.value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-2xl border-border/70">
          <CardHeader><CardTitle>{locale === "ar" ? "أحدث الاستفسارات" : "Recent inquiries"}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.recentInquiries.length ? data.recentInquiries.map((item) => (
              <div key={item.id} className="rounded-xl border p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{item.name}</p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString(locale === "ar" ? "ar-IQ" : "en-US")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{item.email}</p>
                <p className="mt-2 line-clamp-2 text-sm">{item.message}</p>
              </div>
            )) : <p className="text-sm text-muted-foreground">{locale === "ar" ? "لا توجد استفسارات." : "No inquiries yet."}</p>}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70">
          <CardHeader><CardTitle>{locale === "ar" ? "أحدث الجولات" : "Recent tours"}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.recentTours.length ? data.recentTours.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl border p-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{item.name}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{item.email}</p>
                  <p className="mt-2 text-sm">{item.date} · {item.time}</p>
                </div>
                <Badge variant="outline" className="shrink-0">{item.status}</Badge>
              </div>
            )) : <p className="text-sm text-muted-foreground">{locale === "ar" ? "لا توجد جولات." : "No tours yet."}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type PropertyDraft = {
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: string;
  type: string;
  status: "sale" | "rent";
  bedrooms: string;
  bathrooms: string;
  area: string;
  locationEn: string;
  locationAr: string;
  addressEn: string;
  addressAr: string;
  cityEn: string;
  cityAr: string;
  images: string;
  features: string;
  yearBuilt: string;
  parking: string;
  featured: boolean;
  badge: string;
  lat: string;
  lng: string;
  virtualTourUrl: string;
  virtualTourImages: string;
  agentId: string;
};

const emptyProperty: PropertyDraft = {
  titleEn: "",
  titleAr: "",
  descriptionEn: "",
  descriptionAr: "",
  price: "",
  type: "apartment",
  status: "sale",
  bedrooms: "1",
  bathrooms: "1",
  area: "",
  locationEn: "",
  locationAr: "",
  addressEn: "",
  addressAr: "",
  cityEn: "",
  cityAr: "",
  images: "",
  features: "",
  yearBuilt: "",
  parking: "0",
  featured: false,
  badge: "",
  lat: "",
  lng: "",
  virtualTourUrl: "",
  virtualTourImages: "",
  agentId: "",
};

function propertyToDraft(property: PropertySummary): PropertyDraft {
  return {
    titleEn: property.titleEn,
    titleAr: property.titleAr,
    descriptionEn: property.descriptionEn,
    descriptionAr: property.descriptionAr,
    price: String(property.price),
    type: property.type,
    status: property.status === "rent" ? "rent" : "sale",
    bedrooms: String(property.bedrooms),
    bathrooms: String(property.bathrooms),
    area: String(property.area),
    locationEn: property.locationEn,
    locationAr: property.locationAr,
    addressEn: property.addressEn,
    addressAr: property.addressAr,
    cityEn: property.cityEn,
    cityAr: property.cityAr,
    images: property.images,
    features: property.features,
    yearBuilt: property.yearBuilt ? String(property.yearBuilt) : "",
    parking: String(property.parking),
    featured: property.featured,
    badge: property.badge || "",
    lat: property.lat == null ? "" : String(property.lat),
    lng: property.lng == null ? "" : String(property.lng),
    virtualTourUrl: property.virtualTourUrl || "",
    virtualTourImages: property.virtualTourImages || "",
    agentId: property.agentId || "",
  };
}

function numberOrNull(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function PropertyManager() {
  const { locale } = useI18n();
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PropertyDraft>(emptyProperty);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ limit: "48" });
      if (search.trim()) query.set("search", search.trim());
      const [propertyResult, agentResult] = await Promise.all([
        api<{ properties: PropertySummary[] }>(`/api/admin/properties?${query}`),
        api<{ agents: AgentSummary[] }>("/api/admin/agents"),
      ]);
      setProperties(propertyResult.properties || []);
      setAgents(agentResult.agents || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load properties");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyProperty);
    setDialogOpen(true);
  };

  const openEdit = (property: PropertySummary) => {
    setEditingId(property.id);
    setDraft(propertyToDraft(property));
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...draft,
        price: Number(draft.price),
        bedrooms: Number(draft.bedrooms),
        bathrooms: Number(draft.bathrooms),
        area: Number(draft.area),
        yearBuilt: numberOrNull(draft.yearBuilt),
        parking: Number(draft.parking || 0),
        badge: draft.badge || null,
        lat: numberOrNull(draft.lat),
        lng: numberOrNull(draft.lng),
        virtualTourUrl: draft.virtualTourUrl || null,
        virtualTourImages: draft.virtualTourImages || null,
        agentId: draft.agentId || null,
      };
      await api(editingId ? `/api/admin/properties/${editingId}` : "/api/admin/properties", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      toast.success(locale === "ar" ? "تم حفظ العقار" : "Property saved");
      setDialogOpen(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save property");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (property: PropertySummary) => {
    if (!window.confirm(locale === "ar" ? "حذف هذا العقار نهائياً؟" : "Permanently delete this property?")) return;
    try {
      await api(`/api/admin/properties/${property.id}`, { method: "DELETE" });
      toast.success(locale === "ar" ? "تم حذف العقار" : "Property deleted");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete property");
    }
  };

  const setField = <K extends keyof PropertyDraft>(key: K, value: PropertyDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  return (
    <div>
      <SectionHeading
        title={locale === "ar" ? "إدارة العقارات" : "Property management"}
        description={locale === "ar" ? "إنشاء وتعديل ونشر قوائم العقارات." : "Create, edit, assign, and publish property listings."}
        action={<Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />{locale === "ar" ? "عقار جديد" : "New property"}</Button>}
      />

      <form
        className="mb-6 flex gap-2"
        onSubmit={(event) => { event.preventDefault(); load(); }}
      >
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} className="ps-9" placeholder={locale === "ar" ? "بحث في العقارات" : "Search properties"} />
        </div>
        <Button variant="outline">{locale === "ar" ? "بحث" : "Search"}</Button>
      </form>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-24 rounded-2xl" />)}</div>
      ) : !properties.length ? (
        <Card className="rounded-2xl border-dashed"><CardContent className="p-10 text-center text-muted-foreground">{locale === "ar" ? "لا توجد عقارات." : "No properties found."}</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {properties.map((property) => {
            const image = property.images?.split(",").map((item) => item.trim()).find(Boolean);
            return (
              <Card key={property.id} className="rounded-2xl border-border/70">
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <div className="h-20 w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:w-28">
                    {image ? <img src={image} alt={property.titleEn} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Building2 className="h-6 w-6 text-muted-foreground/40" /></div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold">{locale === "ar" ? property.titleAr : property.titleEn}</p>
                      <Badge variant="outline">{property.status}</Badge>
                      {property.featured ? <Badge>{locale === "ar" ? "مميز" : "Featured"}</Badge> : null}
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{locale === "ar" ? property.locationAr : property.locationEn}</p>
                    <p className="mt-2 text-sm font-semibold">${property.price.toLocaleString()}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" size="icon" onClick={() => openEdit(property)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" onClick={() => remove(property)} className="text-destructive hover:text-destructive" aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? (locale === "ar" ? "تعديل العقار" : "Edit property") : (locale === "ar" ? "عقار جديد" : "New property")}</DialogTitle></DialogHeader>
          <div className="grid gap-5 py-2 md:grid-cols-2">
            {([
              ["titleEn", "Title (English)"], ["titleAr", "العنوان بالعربية"],
              ["locationEn", "Location (English)"], ["locationAr", "الموقع بالعربية"],
              ["addressEn", "Address (English)"], ["addressAr", "العنوان بالعربية"],
              ["cityEn", "City (English)"], ["cityAr", "المدينة بالعربية"],
            ] as Array<[keyof PropertyDraft, string]>).map(([key, fieldLabel]) => (
              <div key={key} className="space-y-2"><Label>{fieldLabel}</Label><Input value={String(draft[key])} onChange={(event) => setField(key, event.target.value as never)} /></div>
            ))}
            <div className="space-y-2 md:col-span-2"><Label>Description (English)</Label><Textarea value={draft.descriptionEn} onChange={(event) => setField("descriptionEn", event.target.value)} rows={4} /></div>
            <div className="space-y-2 md:col-span-2"><Label>الوصف بالعربية</Label><Textarea value={draft.descriptionAr} onChange={(event) => setField("descriptionAr", event.target.value)} rows={4} /></div>
            {([
              ["price", "Price"], ["bedrooms", "Bedrooms"], ["bathrooms", "Bathrooms"], ["area", "Area (sq ft)"], ["yearBuilt", "Year built"], ["parking", "Parking"], ["lat", "Latitude"], ["lng", "Longitude"],
            ] as Array<[keyof PropertyDraft, string]>).map(([key, fieldLabel]) => (
              <div key={key} className="space-y-2"><Label>{fieldLabel}</Label><Input type="number" value={String(draft[key])} onChange={(event) => setField(key, event.target.value as never)} /></div>
            ))}
            <div className="space-y-2"><Label>Type</Label><Select value={draft.type} onValueChange={(value) => setField("type", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["apartment", "villa", "house", "condo", "townhouse", "penthouse"].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Status</Label><Select value={draft.status} onValueChange={(value: "sale" | "rent") => setField("status", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sale">Sale</SelectItem><SelectItem value="rent">Rent</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Agent</Label><Select value={draft.agentId || "none"} onValueChange={(value) => setField("agentId", value === "none" ? "" : value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Unassigned</SelectItem>{agents.map((agent) => <SelectItem key={agent.id} value={agent.id}>{agent.nameEn}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Badge</Label><Input value={draft.badge} onChange={(event) => setField("badge", event.target.value)} placeholder="new, hot, premium" /></div>
            <div className="space-y-2 md:col-span-2"><Label>Image URLs (comma separated)</Label><Textarea value={draft.images} onChange={(event) => setField("images", event.target.value)} rows={3} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Features (comma separated)</Label><Textarea value={draft.features} onChange={(event) => setField("features", event.target.value)} rows={3} /></div>
            <div className="space-y-2"><Label>Virtual tour URL</Label><Input value={draft.virtualTourUrl} onChange={(event) => setField("virtualTourUrl", event.target.value)} /></div>
            <div className="space-y-2"><Label>Panorama URLs</Label><Input value={draft.virtualTourImages} onChange={(event) => setField("virtualTourImages", event.target.value)} /></div>
            <div className="flex items-center justify-between rounded-xl border p-4 md:col-span-2"><div><Label htmlFor="property-featured">Featured listing</Label><p className="text-xs text-muted-foreground">Show this property in promoted sections.</p></div><Switch id="property-featured" checked={draft.featured} onCheckedChange={(value) => setField("featured", value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}Save property</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type AgentDraft = {
  nameEn: string;
  nameAr: string;
  titleEn: string;
  titleAr: string;
  bioEn: string;
  bioAr: string;
  email: string;
  phone: string;
  image: string;
  specialization: string;
  experience: string;
  propertiesCount: string;
  rating: string;
};

const emptyAgent: AgentDraft = {
  nameEn: "", nameAr: "", titleEn: "", titleAr: "", bioEn: "", bioAr: "", email: "", phone: "", image: "", specialization: "residential", experience: "0", propertiesCount: "0", rating: "0",
};

function AgentManager() {
  const { locale } = useI18n();
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AgentDraft>(emptyAgent);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
      const result = await api<{ agents: AgentSummary[] }>(`/api/admin/agents${query}`);
      setAgents(result.agents || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load agents");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditingId(null); setDraft(emptyAgent); setDialogOpen(true); };
  const openEdit = (agent: AgentSummary) => {
    setEditingId(agent.id);
    setDraft({
      nameEn: agent.nameEn, nameAr: agent.nameAr, titleEn: agent.titleEn, titleAr: agent.titleAr,
      bioEn: agent.bioEn, bioAr: agent.bioAr, email: agent.email, phone: agent.phone, image: agent.image,
      specialization: agent.specialization, experience: String(agent.experience), propertiesCount: String(agent.propertiesCount), rating: String(agent.rating),
    });
    setDialogOpen(true);
  };

  const setField = <K extends keyof AgentDraft>(key: K, value: AgentDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      await api(editingId ? `/api/admin/agents/${editingId}` : "/api/admin/agents", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify({
          ...draft,
          experience: Number(draft.experience),
          propertiesCount: Number(draft.propertiesCount),
          rating: Number(draft.rating),
        }),
      });
      toast.success(locale === "ar" ? "تم حفظ الوكيل" : "Agent saved");
      setDialogOpen(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save agent");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (agent: AgentSummary) => {
    if (!window.confirm(locale === "ar" ? "حذف هذا الوكيل؟" : "Delete this agent? Assigned properties will become unassigned.")) return;
    try {
      await api(`/api/admin/agents/${agent.id}`, { method: "DELETE" });
      toast.success(locale === "ar" ? "تم حذف الوكيل" : "Agent deleted");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete agent");
    }
  };

  return (
    <div>
      <SectionHeading
        title={locale === "ar" ? "إدارة الوكلاء" : "Agent management"}
        description={locale === "ar" ? "إدارة ملفات الوكلاء وربطهم بالعقارات." : "Maintain agent profiles and their property assignments."}
        action={<Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />{locale === "ar" ? "وكيل جديد" : "New agent"}</Button>}
      />
      <form className="mb-6 flex gap-2" onSubmit={(event) => { event.preventDefault(); load(); }}><div className="relative flex-1"><Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="ps-9" /></div><Button variant="outline">Search</Button></form>
      {loading ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-64 rounded-2xl" />)}</div> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id} className="rounded-2xl border-border/70"><CardContent className="p-5">
              <div className="flex items-start gap-3"><div className="h-12 w-12 overflow-hidden rounded-xl bg-muted">{agent.image ? <img src={agent.image} alt={agent.nameEn} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Users className="h-5 w-5 text-muted-foreground/50" /></div>}</div><div className="min-w-0 flex-1"><p className="truncate font-semibold">{locale === "ar" ? agent.nameAr : agent.nameEn}</p><p className="truncate text-sm text-muted-foreground">{locale === "ar" ? agent.titleAr : agent.titleEn}</p></div></div>
              <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-muted/40 p-3 text-center text-xs"><div><p className="font-bold">{agent.experience}</p><p className="text-muted-foreground">Years</p></div><div><p className="font-bold">{agent.rating.toFixed(1)}</p><p className="text-muted-foreground">Rating</p></div><div><p className="font-bold">{agent._count?.properties ?? agent.propertiesCount}</p><p className="text-muted-foreground">Listings</p></div></div>
              <p className="mt-4 truncate text-sm text-muted-foreground">{agent.email}</p>
              <div className="mt-5 flex gap-2"><Button variant="outline" className="flex-1 gap-2" onClick={() => openEdit(agent)}><Pencil className="h-4 w-4" />Edit</Button><Button variant="outline" size="icon" onClick={() => remove(agent)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></div>
            </CardContent></Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>{editingId ? "Edit agent" : "New agent"}</DialogTitle></DialogHeader><div className="grid gap-5 py-2 md:grid-cols-2">
        {([ ["nameEn", "Name (English)"], ["nameAr", "الاسم بالعربية"], ["titleEn", "Title (English)"], ["titleAr", "المسمى بالعربية"], ["email", "Email"], ["phone", "Phone"], ["image", "Image URL"], ["specialization", "Specialization"] ] as Array<[keyof AgentDraft, string]>).map(([key, fieldLabel]) => <div key={key} className="space-y-2"><Label>{fieldLabel}</Label><Input value={draft[key]} onChange={(event) => setField(key, event.target.value)} /></div>)}
        <div className="space-y-2 md:col-span-2"><Label>Biography (English)</Label><Textarea value={draft.bioEn} onChange={(event) => setField("bioEn", event.target.value)} rows={4} /></div><div className="space-y-2 md:col-span-2"><Label>السيرة بالعربية</Label><Textarea value={draft.bioAr} onChange={(event) => setField("bioAr", event.target.value)} rows={4} /></div>
        {([ ["experience", "Years of experience"], ["propertiesCount", "Displayed property count"], ["rating", "Rating (0-5)"] ] as Array<[keyof AgentDraft, string]>).map(([key, fieldLabel]) => <div key={key} className="space-y-2"><Label>{fieldLabel}</Label><Input type="number" value={draft[key]} onChange={(event) => setField(key, event.target.value)} /></div>)}
      </div><DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}Save agent</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}

type ContentMode = "testimonials" | "neighborhoods";

type TestimonialDraft = Omit<Testimonial, "id" | "rating" | "sortOrder"> & { rating: string; sortOrder: string };
type NeighborhoodDraft = Omit<Neighborhood, "id" | "propertyCount" | "sortOrder"> & { propertyCount: string; sortOrder: string };

const emptyTestimonial: TestimonialDraft = { authorEn: "", authorAr: "", roleEn: "", roleAr: "", contentEn: "", contentAr: "", avatar: "", rating: "5", featured: false, sortOrder: "0" };
const emptyNeighborhood: NeighborhoodDraft = { nameEn: "", nameAr: "", descEn: "", descAr: "", avgPrice: "", propertyCount: "0", searchQuery: "", image: "", featured: false, sortOrder: "0" };

function ContentManager() {
  const { locale } = useI18n();
  const [mode, setMode] = useState<ContentMode>("testimonials");
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testimonialDraft, setTestimonialDraft] = useState<TestimonialDraft>(emptyTestimonial);
  const [neighborhoodDraft, setNeighborhoodDraft] = useState<NeighborhoodDraft>(emptyNeighborhood);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [testimonialResult, neighborhoodResult] = await Promise.all([
        api<{ testimonials: Testimonial[] }>("/api/admin/testimonials"),
        api<{ neighborhoods: Neighborhood[] }>("/api/admin/neighborhoods"),
      ]);
      setTestimonials(testimonialResult.testimonials || []);
      setNeighborhoods(neighborhoodResult.neighborhoods || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load content");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditingId(null); setTestimonialDraft(emptyTestimonial); setNeighborhoodDraft(emptyNeighborhood); setDialogOpen(true); };
  const openTestimonial = (item: Testimonial) => { setMode("testimonials"); setEditingId(item.id); setTestimonialDraft({ ...item, rating: String(item.rating), sortOrder: String(item.sortOrder) }); setDialogOpen(true); };
  const openNeighborhood = (item: Neighborhood) => { setMode("neighborhoods"); setEditingId(item.id); setNeighborhoodDraft({ ...item, propertyCount: String(item.propertyCount), sortOrder: String(item.sortOrder) }); setDialogOpen(true); };

  const save = async () => {
    setSaving(true);
    try {
      if (mode === "testimonials") {
        await api(editingId ? `/api/admin/testimonials/${editingId}` : "/api/admin/testimonials", { method: editingId ? "PUT" : "POST", body: JSON.stringify({ ...testimonialDraft, rating: Number(testimonialDraft.rating), sortOrder: Number(testimonialDraft.sortOrder) }) });
      } else {
        await api(editingId ? `/api/admin/neighborhoods/${editingId}` : "/api/admin/neighborhoods", { method: editingId ? "PUT" : "POST", body: JSON.stringify({ ...neighborhoodDraft, propertyCount: Number(neighborhoodDraft.propertyCount), sortOrder: Number(neighborhoodDraft.sortOrder) }) });
      }
      toast.success(locale === "ar" ? "تم حفظ المحتوى" : "Content saved");
      setDialogOpen(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save content");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (kind: ContentMode, id: string) => {
    if (!window.confirm(locale === "ar" ? "حذف هذا المحتوى؟" : "Delete this content item?")) return;
    try {
      await api(`/api/admin/${kind}/${id}`, { method: "DELETE" });
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete content");
    }
  };

  return (
    <div>
      <SectionHeading title={locale === "ar" ? "إدارة المحتوى" : "Content management"} description={locale === "ar" ? "الشهادات والأحياء الظاهرة في الموقع." : "Testimonials and neighborhood content displayed across the site."} action={<Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />New {mode === "testimonials" ? "testimonial" : "neighborhood"}</Button>} />
      <div className="mb-6 flex gap-2"><Button variant={mode === "testimonials" ? "default" : "outline"} onClick={() => setMode("testimonials")}>Testimonials</Button><Button variant={mode === "neighborhoods" ? "default" : "outline"} onClick={() => setMode("neighborhoods")}>Neighborhoods</Button></div>
      {loading ? <Skeleton className="h-80 rounded-2xl" /> : mode === "testimonials" ? (
        <div className="grid gap-4 lg:grid-cols-2">{testimonials.map((item) => <Card key={item.id} className="rounded-2xl"><CardContent className="p-5"><div className="flex items-start justify-between gap-4"><div><p className="font-semibold">{locale === "ar" ? item.authorAr || item.authorEn : item.authorEn}</p><p className="text-sm text-muted-foreground">{locale === "ar" ? item.roleAr || item.roleEn : item.roleEn}</p></div>{item.featured ? <Badge>Featured</Badge> : null}</div><p className="mt-4 line-clamp-3 text-sm">{locale === "ar" ? item.contentAr || item.contentEn : item.contentEn}</p><div className="mt-5 flex gap-2"><Button variant="outline" className="flex-1 gap-2" onClick={() => openTestimonial(item)}><Pencil className="h-4 w-4" />Edit</Button><Button variant="outline" size="icon" className="text-destructive" onClick={() => remove("testimonials", item.id)}><Trash2 className="h-4 w-4" /></Button></div></CardContent></Card>)}</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">{neighborhoods.map((item) => <Card key={item.id} className="overflow-hidden rounded-2xl"><CardContent className="p-5"><div className="flex items-start justify-between gap-4"><div><p className="font-semibold">{locale === "ar" ? item.nameAr || item.nameEn : item.nameEn}</p><p className="text-sm text-muted-foreground">{item.avgPrice} · {item.propertyCount} properties</p></div>{item.featured ? <Badge>Featured</Badge> : null}</div><p className="mt-4 line-clamp-3 text-sm">{locale === "ar" ? item.descAr || item.descEn : item.descEn}</p><div className="mt-5 flex gap-2"><Button variant="outline" className="flex-1 gap-2" onClick={() => openNeighborhood(item)}><Pencil className="h-4 w-4" />Edit</Button><Button variant="outline" size="icon" className="text-destructive" onClick={() => remove("neighborhoods", item.id)}><Trash2 className="h-4 w-4" /></Button></div></CardContent></Card>)}</div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>{editingId ? "Edit" : "Create"} {mode === "testimonials" ? "testimonial" : "neighborhood"}</DialogTitle></DialogHeader>{mode === "testimonials" ? (
        <div className="grid gap-4 py-2 md:grid-cols-2">{([ ["authorEn", "Author (English)"], ["authorAr", "المؤلف بالعربية"], ["roleEn", "Role (English)"], ["roleAr", "الدور بالعربية"], ["avatar", "Avatar URL"], ["rating", "Rating"], ["sortOrder", "Sort order"] ] as Array<[keyof TestimonialDraft, string]>).map(([key, fieldLabel]) => <div key={key} className="space-y-2"><Label>{fieldLabel}</Label><Input value={String(testimonialDraft[key])} onChange={(event) => setTestimonialDraft((current) => ({ ...current, [key]: event.target.value }))} /></div>)}<div className="space-y-2 md:col-span-2"><Label>Content (English)</Label><Textarea value={testimonialDraft.contentEn} onChange={(event) => setTestimonialDraft((current) => ({ ...current, contentEn: event.target.value }))} /></div><div className="space-y-2 md:col-span-2"><Label>المحتوى بالعربية</Label><Textarea value={testimonialDraft.contentAr} onChange={(event) => setTestimonialDraft((current) => ({ ...current, contentAr: event.target.value }))} /></div><div className="flex items-center justify-between rounded-xl border p-4 md:col-span-2"><Label>Featured</Label><Switch checked={testimonialDraft.featured} onCheckedChange={(value) => setTestimonialDraft((current) => ({ ...current, featured: value }))} /></div></div>
      ) : (
        <div className="grid gap-4 py-2 md:grid-cols-2">{([ ["nameEn", "Name (English)"], ["nameAr", "الاسم بالعربية"], ["avgPrice", "Average price"], ["propertyCount", "Property count"], ["searchQuery", "Search query"], ["image", "Image URL"], ["sortOrder", "Sort order"] ] as Array<[keyof NeighborhoodDraft, string]>).map(([key, fieldLabel]) => <div key={key} className="space-y-2"><Label>{fieldLabel}</Label><Input value={String(neighborhoodDraft[key])} onChange={(event) => setNeighborhoodDraft((current) => ({ ...current, [key]: event.target.value }))} /></div>)}<div className="space-y-2 md:col-span-2"><Label>Description (English)</Label><Textarea value={neighborhoodDraft.descEn} onChange={(event) => setNeighborhoodDraft((current) => ({ ...current, descEn: event.target.value }))} /></div><div className="space-y-2 md:col-span-2"><Label>الوصف بالعربية</Label><Textarea value={neighborhoodDraft.descAr} onChange={(event) => setNeighborhoodDraft((current) => ({ ...current, descAr: event.target.value }))} /></div><div className="flex items-center justify-between rounded-xl border p-4 md:col-span-2"><Label>Featured</Label><Switch checked={neighborhoodDraft.featured} onCheckedChange={(value) => setNeighborhoodDraft((current) => ({ ...current, featured: value }))} /></div></div>
      )}<DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}Save</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}

function SettingsManager() {
  const { locale } = useI18n();
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api<{ settings: SiteSetting[] }>("/api/admin/settings");
      setSettings(result.settings || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const groups = useMemo(() => {
    const grouped = new Map<string, SiteSetting[]>();
    settings.forEach((setting) => grouped.set(setting.category, [...(grouped.get(setting.category) || []), setting]));
    return Array.from(grouped.entries());
  }, [settings]);

  const save = async () => {
    setSaving(true);
    try {
      await api("/api/admin/settings", { method: "PUT", body: JSON.stringify({ settings: settings.map(({ key, valueEn, valueAr }) => ({ key, valueEn, valueAr })) }) });
      toast.success(locale === "ar" ? "تم حفظ الإعدادات" : "Settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <SectionHeading title={locale === "ar" ? "إعدادات الموقع" : "Site settings"} description={locale === "ar" ? "النصوص العامة وإعدادات الواجهة باللغتين." : "Global content and bilingual interface values."} action={<Button onClick={save} disabled={saving}>{saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}{locale === "ar" ? "حفظ" : "Save changes"}</Button>} />
      {loading ? <Skeleton className="h-96 rounded-2xl" /> : !groups.length ? <Card className="rounded-2xl border-dashed"><CardContent className="p-10 text-center text-muted-foreground">No settings have been configured.</CardContent></Card> : <div className="space-y-6">{groups.map(([category, rows]) => <Card key={category} className="rounded-2xl"><CardHeader><CardTitle className="capitalize">{category}</CardTitle></CardHeader><CardContent className="space-y-5">{rows.map((setting) => <div key={setting.id} className="grid gap-3 border-b pb-5 last:border-0 last:pb-0 md:grid-cols-[220px_1fr_1fr]"><div><p className="font-mono text-sm font-medium">{setting.key}</p><Badge variant="outline" className="mt-2 text-[10px]">{setting.type}</Badge></div><div className="space-y-2"><Label>English</Label><Textarea value={setting.valueEn} onChange={(event) => setSettings((current) => current.map((item) => item.id === setting.id ? { ...item, valueEn: event.target.value } : item))} rows={2} /></div><div className="space-y-2"><Label>العربية</Label><Textarea dir="rtl" value={setting.valueAr} onChange={(event) => setSettings((current) => current.map((item) => item.id === setting.id ? { ...item, valueAr: event.target.value } : item))} rows={2} /></div></div>)}</CardContent></Card>)}</div>}
    </div>
  );
}

export function AdminDashboard() {
  const { locale, dir } = useI18n();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [section, setSection] = useState<Section>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    api<{ user: AdminUser }>("/api/admin/me")
      .then((result) => setUser(result.user))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  const logout = async () => {
    try {
      await api("/api/admin/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  };

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  }
  if (!user) return <AdminLogin onAuthenticated={setUser} />;

  const navigation = [
    { key: "overview" as const, label: locale === "ar" ? "نظرة عامة" : "Overview", icon: LayoutDashboard },
    { key: "properties" as const, label: locale === "ar" ? "العقارات" : "Properties", icon: Building2 },
    { key: "agents" as const, label: locale === "ar" ? "الوكلاء" : "Agents", icon: Users },
    { key: "content" as const, label: locale === "ar" ? "المحتوى" : "Content", icon: MessageSquareQuote },
    { key: "settings" as const, label: locale === "ar" ? "الإعدادات" : "Settings", icon: Settings },
  ];

  const navigationList = (
    <nav className="space-y-1">
      {navigation.map((item) => (
        <button
          type="button"
          key={item.key}
          onClick={() => { setSection(item.key); setMobileOpen(false); }}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm font-medium transition-colors",
            section === item.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </button>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-muted/20" dir={dir}>
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden"><Menu className="h-5 w-5" /></Button></SheetTrigger>
              <SheetContent side={dir === "rtl" ? "right" : "left"}><SheetHeader><SheetTitle>EstatePro Admin</SheetTitle></SheetHeader><div className="mt-6">{navigationList}</div></SheetContent>
            </Sheet>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><ShieldCheck className="h-5 w-5" /></div>
            <div><p className="font-bold">EstatePro Admin</p><p className="text-xs text-muted-foreground">{user.email}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => window.location.assign("/")} className="gap-2"><Home className="h-4 w-4" /><span className="hidden sm:inline">{locale === "ar" ? "عرض الموقع" : "View site"}</span></Button>
            <Button variant="ghost" size="sm" onClick={logout} className="gap-2 text-destructive hover:text-destructive"><LogOut className="h-4 w-4" /><span className="hidden sm:inline">{locale === "ar" ? "خروج" : "Sign out"}</span></Button>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="hidden min-h-[calc(100vh-4rem)] border-e bg-background p-4 lg:block">
          {navigationList}
          <div className="mt-8 rounded-2xl bg-muted/50 p-4 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">{user.name}</p>
            <p className="mt-1">{locale === "ar" ? "جلسة مسؤول محمية" : "Protected administrator session"}</p>
          </div>
        </aside>
        <main className="min-w-0 p-4 md:p-8 xl:p-10">
          {section === "overview" ? <OverviewSection /> : null}
          {section === "properties" ? <PropertyManager /> : null}
          {section === "agents" ? <AgentManager /> : null}
          {section === "content" ? <ContentManager /> : null}
          {section === "settings" ? <SettingsManager /> : null}
        </main>
      </div>
    </div>
  );
}
