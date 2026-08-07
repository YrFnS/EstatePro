"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Archive,
  Building2,
  CalendarClock,
  Check,
  ChevronLeft,
  Clock3,
  Eye,
  FileEdit,
  Image as ImageIcon,
  Loader2,
  LogIn,
  LogOut,
  MessageSquare,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Star,
  X,
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface ListingOwner {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
}

interface ListingMedia {
  id: string;
  url: string;
  type: string;
  isCover: boolean;
  sortOrder: number;
}

interface AuditEvent {
  id: string;
  actorName: string | null;
  action: string;
  previousStatus: string | null;
  newStatus: string | null;
  createdAt: string;
}

interface ModerationListing {
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
  cityEn: string;
  cityAr: string;
  listingStatus: string;
  reviewNotes: string | null;
  submittedAt: string | null;
  updatedAt: string;
  scheduledPublishAt: string | null;
  completion: number;
  owner: ListingOwner | null;
  agent: { id: string; nameEn: string; nameAr: string; email: string } | null;
  media: ListingMedia[];
  auditLogs: AuditEvent[];
  _count: {
    inquiries: number;
    reviews: number;
    favoritedBy: number;
  };
}

interface QueuePayload {
  listings: ModerationListing[];
  counts: Record<string, number>;
  total: number;
  currentPage: number;
  totalPages: number;
}

type ModerationAction =
  | "approve"
  | "request_changes"
  | "reject"
  | "schedule"
  | "archive"
  | "reopen";

const queueStatuses = [
  "pending_review",
  "changes_requested",
  "scheduled",
  "published",
  "rejected",
  "draft",
  "archived",
] as const;

const statusStyles: Record<string, string> = {
  pending_review: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  changes_requested: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  scheduled: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  published: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  draft: "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300",
  archived: "bg-muted text-muted-foreground",
};

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
    const message = typeof payload.error === "string" ? payload.error : "Request failed";
    if (Array.isArray(payload.issues)) {
      const issues = (payload.issues as Array<{ message?: string }>)
        .map((issue) => issue.message)
        .filter(Boolean)
        .join(" ");
      throw new Error(issues ? `${message}: ${issues}` : message);
    }
    throw new Error(message);
  }
  return payload as T;
}

function localDate(value: string | null, locale: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString(locale === "ar" ? "ar-IQ" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function titleFor(listing: ModerationListing, locale: string) {
  return locale === "ar"
    ? listing.titleAr || listing.titleEn || "إعلان بدون عنوان"
    : listing.titleEn || listing.titleAr || "Untitled listing";
}

function coverFor(listing: ModerationListing) {
  return (
    listing.media.find((item) => item.type === "image" && item.isCover)?.url ||
    listing.media.find((item) => item.type === "image")?.url ||
    ""
  );
}

function LoginPanel({ onAuthenticated }: { onAuthenticated: (user: AdminUser) => void }) {
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md rounded-3xl shadow-xl">
        <CardContent className="p-8">
          <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-5 text-center text-2xl font-bold">
            {locale === "ar" ? "مراجعة إعلانات EstatePro" : "EstatePro Listing Review"}
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {locale === "ar" ? "تتطلب هذه الصفحة جلسة مسؤول محمية." : "This workspace requires a protected administrator session."}
          </p>
          <form className="mt-7 space-y-4" onSubmit={submit}>
            <div className="space-y-2"><Label htmlFor="moderation-email">Email</Label><Input id="moderation-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="moderation-password">Password</Label><Input id="moderation-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
            <Button className="w-full gap-2" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}{locale === "ar" ? "دخول" : "Sign in"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function ListingModerationPage() {
  const { locale, dir } = useI18n();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [listings, setListings] = useState<ModerationListing[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [status, setStatus] = useState("pending_review");
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ModerationListing | null>(null);
  const [action, setAction] = useState<ModerationAction | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [publishAt, setPublishAt] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ user: AdminUser }>("/api/admin/me")
      .then((result) => setUser(result.user))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const parameters = new URLSearchParams({ limit: "48" });
      if (status !== "all") parameters.set("listingStatus", status);
      if (search.trim()) parameters.set("search", search.trim());
      const payload = await api<QueuePayload>(`/api/admin/listings?${parameters.toString()}`);
      setListings(payload.listings || []);
      setCounts(payload.counts || {});
      setSelected((current) =>
        current
          ? payload.listings.find((item) => item.id === current.id) || current
          : null
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load queue");
    } finally {
      setLoading(false);
    }
  }, [search, status, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const openAction = (listing: ModerationListing, nextAction: ModerationAction) => {
    setSelected(listing);
    setAction(nextAction);
    setReviewNotes(listing.reviewNotes || "");
    setPublishAt("");
  };

  const submitAction = async () => {
    if (!selected || !action) return;
    setSaving(true);
    try {
      await api(`/api/admin/listings/${encodeURIComponent(selected.id)}/moderate`, {
        method: "POST",
        body: JSON.stringify({
          action,
          reviewNotes,
          publishAt: action === "schedule" && publishAt ? new Date(publishAt).toISOString() : undefined,
        }),
      });
      toast.success(locale === "ar" ? "تم تحديث حالة الإعلان" : "Listing review updated");
      setAction(null);
      setSelected(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Moderation failed");
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    try {
      await api("/api/admin/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  };

  const total = useMemo(() => Object.values(counts).reduce((sum, count) => sum + count, 0), [counts]);

  if (checking) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  if (!user) return <LoginPanel onAuthenticated={setUser} />;

  return (
    <div className="min-h-screen bg-muted/20" dir={dir}>
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => window.location.assign("/admin")} aria-label="Back"><ChevronLeft className="h-5 w-5" /></Button>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><ShieldCheck className="h-5 w-5" /></div>
            <div><p className="font-bold">{locale === "ar" ? "مراجعة الإعلانات" : "Listing Moderation"}</p><p className="text-xs text-muted-foreground">{user.email}</p></div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => void load()}><RefreshCw className="h-4 w-4" /><span className="hidden sm:inline">{locale === "ar" ? "تحديث" : "Refresh"}</span></Button>
            <Button variant="ghost" size="sm" className="gap-2 text-destructive" onClick={() => void logout()}><LogOut className="h-4 w-4" /><span className="hidden sm:inline">{locale === "ar" ? "خروج" : "Sign out"}</span></Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-8 md:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant="secondary" className="mb-3 rounded-full">{total} {locale === "ar" ? "إعلان" : "listings"}</Badge>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{locale === "ar" ? "قائمة المراجعة" : "Review Queue"}</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">{locale === "ar" ? "تحقق من التفاصيل والوسائط وسجل التغييرات قبل النشر." : "Inspect details, media, ownership, and audit history before publication."}</p>
          </div>
          <Card className="rounded-2xl"><CardContent className="flex gap-6 p-4 text-center"><div><p className="text-xs text-muted-foreground">Pending</p><p className="text-2xl font-bold text-amber-600">{counts.pending_review || 0}</p></div><div><p className="text-xs text-muted-foreground">Changes</p><p className="text-2xl font-bold text-orange-600">{counts.changes_requested || 0}</p></div><div><p className="text-xs text-muted-foreground">Scheduled</p><p className="text-2xl font-bold text-violet-600">{counts.scheduled || 0}</p></div></CardContent></Card>
        </div>

        <Card className="mt-7 rounded-2xl">
          <CardContent className="p-4">
            <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); setSearch(searchDraft.trim()); }}>
              <div className="relative flex-1"><Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} className="ps-9" placeholder={locale === "ar" ? "بحث في الإعلانات أو المدن" : "Search listings or cities"} /></div>
              <Button variant="outline">{locale === "ar" ? "بحث" : "Search"}</Button>
            </form>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              <Button size="sm" variant={status === "all" ? "default" : "outline"} onClick={() => setStatus("all")}>All ({total})</Button>
              {queueStatuses.map((item) => <Button key={item} size="sm" variant={status === item ? "default" : "outline"} className="shrink-0 capitalize" onClick={() => setStatus(item)}>{item.replaceAll("_", " ")} ({counts[item] || 0})</Button>)}
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="mt-6 grid gap-5 xl:grid-cols-2">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-72 rounded-3xl" />)}</div>
        ) : !listings.length ? (
          <Card className="mt-6 rounded-3xl border-dashed"><CardContent className="p-14 text-center"><Check className="mx-auto h-12 w-12 text-primary/50" /><h2 className="mt-4 text-xl font-semibold">{locale === "ar" ? "لا توجد إعلانات في هذه القائمة" : "This queue is clear"}</h2></CardContent></Card>
        ) : (
          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            {listings.map((listing) => {
              const cover = coverFor(listing);
              return (
                <Card key={listing.id} className="overflow-hidden rounded-3xl border-border/70">
                  <CardContent className="p-0">
                    <div className="grid sm:grid-cols-[210px_minmax(0,1fr)]">
                      <div className="relative min-h-52 bg-muted">
                        {cover ? <img src={cover} alt={titleFor(listing, locale)} className="h-full w-full object-cover" /> : <div className="flex h-full min-h-52 items-center justify-center"><ImageIcon className="h-10 w-10 text-muted-foreground/40" /></div>}
                        <Badge className={cn("absolute start-3 top-3 border-0 capitalize", statusStyles[listing.listingStatus])}>{listing.listingStatus.replaceAll("_", " ")}</Badge>
                        {listing.media.find((item) => item.isCover) ? <Badge variant="secondary" className="absolute bottom-3 start-3 gap-1"><Star className="h-3 w-3 fill-current" />Cover</Badge> : null}
                      </div>
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0"><h2 className="truncate text-lg font-semibold">{titleFor(listing, locale)}</h2><p className="mt-1 truncate text-sm text-muted-foreground">{locale === "ar" ? listing.locationAr || listing.cityAr : listing.locationEn || listing.cityEn}</p></div>
                          <Badge variant="outline" className="capitalize">{listing.status}</Badge>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground"><Badge variant="secondary">{listing.type}</Badge><Badge variant="secondary">{listing.bedrooms} beds</Badge><Badge variant="secondary">{listing.bathrooms} baths</Badge><Badge variant="secondary">{listing.area.toLocaleString()} sq ft</Badge></div>
                        <div className="mt-4"><div className="flex justify-between text-xs text-muted-foreground"><span>Completeness</span><span>{listing.completion}%</span></div><Progress value={listing.completion} className="mt-2" /></div>
                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-muted-foreground">Owner</p><p className="truncate font-medium">{listing.owner?.name || "Unassigned"}</p><p className="truncate text-xs text-muted-foreground">{listing.owner?.email}</p></div><div><p className="text-xs text-muted-foreground">Submitted</p><p className="font-medium">{localDate(listing.submittedAt, locale)}</p></div></div>
                        <div className="mt-4 flex gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1"><ImageIcon className="h-3.5 w-3.5" />{listing.media.length}</span><span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{listing._count.inquiries}</span><span className="flex items-center gap-1"><Star className="h-3.5 w-3.5" />{listing._count.favoritedBy}</span></div>
                        {listing.reviewNotes ? <p className="mt-4 line-clamp-2 rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">{listing.reviewNotes}</p> : null}
                        <div className="mt-5 flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" className="gap-1" onClick={() => setSelected(listing)}><Eye className="h-3.5 w-3.5" />Details</Button>
                          {listing.listingStatus === "pending_review" ? <><Button size="sm" className="gap-1" onClick={() => openAction(listing, "approve")}><Check className="h-3.5 w-3.5" />Approve</Button><Button variant="outline" size="sm" className="gap-1" onClick={() => openAction(listing, "request_changes")}><FileEdit className="h-3.5 w-3.5" />Changes</Button></> : null}
                          {["changes_requested", "rejected", "draft", "archived"].includes(listing.listingStatus) ? <Button variant="outline" size="sm" className="gap-1" onClick={() => openAction(listing, "reopen")}><RotateCcw className="h-3.5 w-3.5" />Reopen</Button> : null}
                          {listing.listingStatus === "scheduled" ? <><Button size="sm" className="gap-1" onClick={() => openAction(listing, "approve")}><Check className="h-3.5 w-3.5" />Publish now</Button><Button variant="outline" size="sm" className="gap-1" onClick={() => openAction(listing, "reopen")}><RotateCcw className="h-3.5 w-3.5" />Reopen</Button><Button variant="outline" size="sm" className="gap-1" onClick={() => openAction(listing, "archive")}><Archive className="h-3.5 w-3.5" />Archive</Button></> : null}
                          {listing.listingStatus === "published" ? <><Button variant="outline" size="sm" className="gap-1" onClick={() => openAction(listing, "reopen")}><RotateCcw className="h-3.5 w-3.5" />Reopen</Button><Button variant="outline" size="sm" className="gap-1" onClick={() => openAction(listing, "archive")}><Archive className="h-3.5 w-3.5" />Archive</Button></> : null}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={Boolean(selected) && !action} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
          {selected ? <><DialogHeader><DialogTitle>{titleFor(selected, locale)}</DialogTitle><DialogDescription>Review listing details, media, and moderation history.</DialogDescription></DialogHeader><div className="grid gap-6 lg:grid-cols-[1fr_320px]"><div className="space-y-5"><div className="grid gap-3 sm:grid-cols-2">{selected.media.map((item) => <div key={item.id} className="relative overflow-hidden rounded-2xl bg-muted"><div className="aspect-[4/3]">{item.type === "image" ? <img src={item.url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><ImageIcon className="h-10 w-10 text-muted-foreground/40" /></div>}</div>{item.isCover ? <Badge className="absolute start-2 top-2">Cover</Badge> : null}</div>)}</div><Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader><CardContent className="space-y-4 text-sm"><div><p className="font-medium">English</p><p className="mt-1 whitespace-pre-wrap text-muted-foreground">{selected.descriptionEn}</p></div><div dir="rtl"><p className="font-medium">العربية</p><p className="mt-1 whitespace-pre-wrap text-muted-foreground">{selected.descriptionAr}</p></div></CardContent></Card></div><aside className="space-y-4"><Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">Listing details</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><p><span className="text-muted-foreground">Price:</span> ${selected.price.toLocaleString()}</p><p><span className="text-muted-foreground">Owner:</span> {selected.owner?.name || "—"}</p><p><span className="text-muted-foreground">Agent:</span> {selected.agent?.nameEn || "—"}</p><p><span className="text-muted-foreground">Status:</span> {selected.listingStatus.replaceAll("_", " ")}</p><p><span className="text-muted-foreground">Updated:</span> {localDate(selected.updatedAt, locale)}</p></CardContent></Card><Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">Audit history</CardTitle></CardHeader><CardContent className="space-y-3">{selected.auditLogs.length ? selected.auditLogs.map((event) => <div key={event.id} className="border-s pb-3 ps-3 text-xs"><p className="font-medium">{event.action.replaceAll("_", " ")}</p><p className="mt-1 text-muted-foreground">{event.actorName || "System"} · {localDate(event.createdAt, locale)}</p>{event.previousStatus || event.newStatus ? <p className="mt-1 text-muted-foreground">{event.previousStatus || "new"} → {event.newStatus || "—"}</p> : null}</div>) : <p className="text-sm text-muted-foreground">No audit events.</p>}</CardContent></Card></aside></div><DialogFooter className="flex-wrap"><Button variant="outline" onClick={() => window.location.assign(`/properties/${encodeURIComponent(selected.id)}`)}><Eye className="me-2 h-4 w-4" />Preview</Button>{selected.listingStatus === "pending_review" ? <><Button variant="destructive" onClick={() => openAction(selected, "reject")}><X className="me-2 h-4 w-4" />Reject</Button><Button variant="outline" onClick={() => openAction(selected, "schedule")}><CalendarClock className="me-2 h-4 w-4" />Schedule</Button><Button onClick={() => openAction(selected, "approve")}><Check className="me-2 h-4 w-4" />Approve</Button></> : null}{selected.listingStatus === "scheduled" ? <><Button variant="outline" onClick={() => openAction(selected, "reopen")}><RotateCcw className="me-2 h-4 w-4" />Reopen</Button><Button variant="outline" onClick={() => openAction(selected, "archive")}><Archive className="me-2 h-4 w-4" />Archive</Button><Button onClick={() => openAction(selected, "approve")}><Check className="me-2 h-4 w-4" />Publish now</Button></> : null}</DialogFooter></> : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selected) && Boolean(action)} onOpenChange={(open) => { if (!open) { setAction(null); setSelected(null); } }}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle className="capitalize">{action?.replaceAll("_", " ")} listing</DialogTitle><DialogDescription>Confirm this moderation decision and add optional review notes.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            {action === "schedule" ? <div className="space-y-2"><Label htmlFor="publish-at">Publication date and time</Label><Input id="publish-at" type="datetime-local" value={publishAt} min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)} onChange={(event) => setPublishAt(event.target.value)} /></div> : null}
            <div className="space-y-2"><Label htmlFor="review-notes">{action === "request_changes" || action === "reject" ? "Review notes (required)" : "Review notes"}</Label><Textarea id="review-notes" rows={5} value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} placeholder="Explain the decision or required changes..." /></div>
            {action === "reject" ? <div className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" /><p>Rejecting keeps the listing in the owner workspace with your notes so it can be corrected and resubmitted.</p></div> : null}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => { setAction(null); setSelected(null); }}>Cancel</Button><Button variant={action === "reject" ? "destructive" : "default"} disabled={saving || ((action === "request_changes" || action === "reject") && reviewNotes.trim().length < 3) || (action === "schedule" && !publishAt)} onClick={() => void submitAction()}>{saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : action === "schedule" ? <Clock3 className="me-2 h-4 w-4" /> : null}Confirm</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
