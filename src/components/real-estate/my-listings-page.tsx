"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  Building2,
  CheckCircle2,
  Clock3,
  Copy,
  Eye,
  FileEdit,
  Heart,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n/provider";
import { useRouter } from "@/lib/router";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface ListingMediaSummary {
  id: string;
  url: string;
  type: string;
  isCover: boolean;
  sortOrder: number;
}

interface AccountListing {
  id: string;
  titleEn: string;
  titleAr: string;
  price: number;
  type: string;
  status: string;
  listingStatus: string;
  reviewNotes: string | null;
  locationEn: string;
  locationAr: string;
  cityEn: string;
  cityAr: string;
  updatedAt: string;
  submittedAt: string | null;
  publishedAt: string | null;
  scheduledPublishAt: string | null;
  completion: number;
  media: ListingMediaSummary[];
  _count: {
    inquiries: number;
    reviews: number;
    favoritedBy: number;
  };
}

interface ListingPayload {
  listings: AccountListing[];
  counts: Record<string, number>;
  total: number;
  currentPage: number;
  totalPages: number;
}

interface SubmissionIssue {
  field: string;
  message: string;
}

const statuses = [
  "all",
  "draft",
  "pending_review",
  "changes_requested",
  "scheduled",
  "published",
  "rejected",
  "archived",
] as const;

const statusStyles: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300",
  pending_review: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  changes_requested: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  scheduled: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  published: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  archived: "bg-muted text-muted-foreground",
};

function localDate(value: string | null, locale: string): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(locale === "ar" ? "ar-IQ" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
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
    if (Array.isArray(payload.issues)) error.issues = payload.issues as SubmissionIssue[];
    throw error;
  }
  return payload as T;
}

function titleFor(listing: AccountListing, locale: string) {
  return locale === "ar"
    ? listing.titleAr || listing.titleEn || "إعلان بدون عنوان"
    : listing.titleEn || listing.titleAr || "Untitled listing";
}

function locationFor(listing: AccountListing, locale: string) {
  return locale === "ar"
    ? listing.locationAr || listing.cityAr || listing.locationEn
    : listing.locationEn || listing.cityEn || listing.locationAr;
}

function coverFor(listing: AccountListing) {
  return (
    listing.media.find((item) => item.type === "image" && item.isCover)?.url ||
    listing.media.find((item) => item.type === "image")?.url ||
    ""
  );
}

export function MyListingsPage() {
  const { locale } = useI18n();
  const { navigate } = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [listings, setListings] = useState<AccountListing[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<(typeof statuses)[number]>("all");
  const [query, setQuery] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const parameters = new URLSearchParams({ limit: "48" });
      if (status !== "all") parameters.set("status", status);
      if (query.trim()) parameters.set("search", query.trim());
      const payload = await request<ListingPayload>(
        `/api/account/listings?${parameters.toString()}`
      );
      setListings(payload.listings || []);
      setCounts(payload.counts || {});
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load listings");
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [query, status, user?.id]);

  useEffect(() => {
    if (!authLoading) void load();
  }, [authLoading, load]);

  const totalListings = useMemo(
    () => Object.values(counts).reduce((total, count) => total + count, 0),
    [counts]
  );

  const action = async (
    listing: AccountListing,
    name: "submit" | "archive" | "restore" | "withdraw" | "duplicate"
  ) => {
    if (
      name === "archive" &&
      !window.confirm(
        locale === "ar"
          ? "أرشفة هذا الإعلان وإخفاؤه من الموقع؟"
          : "Archive this listing and remove it from public view?"
      )
    ) {
      return;
    }

    setBusyId(listing.id);
    try {
      const payload = await request<{ listing: AccountListing }>(
        `/api/account/listings/${encodeURIComponent(listing.id)}/actions`,
        {
          method: "POST",
          body: JSON.stringify({ action: name }),
        }
      );
      if (name === "duplicate" && payload.listing?.id) {
        toast.success(locale === "ar" ? "تم إنشاء نسخة كمسودة" : "Draft copy created");
        navigate("edit-listing", { id: payload.listing.id });
        return;
      }
      toast.success(
        locale === "ar" ? "تم تحديث حالة الإعلان" : "Listing status updated"
      );
      await load();
    } catch (error) {
      const typed = error as Error & { issues?: SubmissionIssue[] };
      if (typed.issues?.length) {
        toast.error(`${typed.message}: ${typed.issues.map((issue) => issue.message).join(" ")}`);
      } else {
        toast.error(typed.message || "Listing action failed");
      }
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (listing: AccountListing) => {
    if (
      !window.confirm(
        locale === "ar"
          ? "حذف هذه المسودة نهائياً؟ لا يمكن التراجع عن ذلك."
          : "Permanently delete this draft? This cannot be undone."
      )
    ) {
      return;
    }
    setBusyId(listing.id);
    try {
      await request(
        `/api/account/listings/${encodeURIComponent(listing.id)}`,
        { method: "DELETE" }
      );
      toast.success(locale === "ar" ? "تم حذف الإعلان" : "Listing deleted");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete listing");
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <Skeleton className="h-12 w-72" />
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-96 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-20 text-center">
        <Building2 className="mx-auto h-14 w-14 text-muted-foreground/40" />
        <h1 className="mt-5 text-2xl font-bold">
          {locale === "ar" ? "سجّل الدخول لإدارة إعلاناتك" : "Sign in to manage your listings"}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {locale === "ar"
            ? "المسودات والمراجعات والإعلانات المنشورة مرتبطة بحسابك."
            : "Drafts, reviews, and published properties are securely attached to your account."}
        </p>
        <Button className="mt-6" onClick={() => navigate("home")}>
          {locale === "ar" ? "العودة للرئيسية" : "Back to home"}
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10 md:py-14">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant="secondary" className="mb-3 rounded-full">
            {totalListings} {locale === "ar" ? "إعلان" : "listings"}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {locale === "ar" ? "إعلاناتي" : "My Listings"}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {locale === "ar"
              ? "تابع المسودات والمراجعات والنشر والنتائج من مكان واحد."
              : "Manage drafts, review feedback, publication, and listing performance from one workspace."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => void load()}>
            <RefreshCw className="h-4 w-4" />
            {locale === "ar" ? "تحديث" : "Refresh"}
          </Button>
          <Button className="gap-2" onClick={() => navigate("list-property")}>
            <Plus className="h-4 w-4" />
            {locale === "ar" ? "إعلان جديد" : "New listing"}
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["draft", locale === "ar" ? "المسودات" : "Drafts", FileEdit],
          ["pending_review", locale === "ar" ? "قيد المراجعة" : "In review", Clock3],
          ["published", locale === "ar" ? "منشور" : "Published", CheckCircle2],
          ["archived", locale === "ar" ? "مؤرشف" : "Archived", Archive],
        ].map(([key, label, Icon]) => (
          <Card key={String(key)} className="rounded-2xl border-border/70">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{String(label)}</p>
                <p className="text-2xl font-bold">{counts[String(key)] || 0}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8 rounded-2xl">
        <CardContent className="p-4">
          <form
            className="flex flex-col gap-3 md:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              setQuery(searchDraft.trim());
            }}
          >
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                className="ps-9"
                placeholder={locale === "ar" ? "بحث في إعلاناتي" : "Search my listings"}
              />
            </div>
            <Button variant="outline">{locale === "ar" ? "بحث" : "Search"}</Button>
          </form>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {statuses.map((item) => (
              <Button
                type="button"
                key={item}
                size="sm"
                variant={status === item ? "default" : "outline"}
                className="shrink-0 capitalize"
                onClick={() => setStatus(item)}
              >
                {item === "all"
                  ? locale === "ar" ? "الكل" : "All"
                  : item.replaceAll("_", " ")}
                {item !== "all" ? ` (${counts[item] || 0})` : ""}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-[430px] rounded-3xl" />
          ))}
        </div>
      ) : !listings.length ? (
        <Card className="mt-7 rounded-3xl border-dashed">
          <CardContent className="flex flex-col items-center p-14 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/35" />
            <h2 className="mt-4 text-xl font-semibold">
              {locale === "ar" ? "لا توجد إعلانات هنا" : "No listings here"}
            </h2>
            <p className="mt-2 max-w-md text-muted-foreground">
              {locale === "ar"
                ? "أنشئ مسودة جديدة وأضف التفاصيل والصور ثم أرسلها للمراجعة."
                : "Create a draft, add its details and media, then submit it for review."}
            </p>
            <Button className="mt-6 gap-2" onClick={() => navigate("list-property")}>
              <Plus className="h-4 w-4" />
              {locale === "ar" ? "إعلان جديد" : "Create listing"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing) => {
            const cover = coverFor(listing);
            const busy = busyId === listing.id;
            const canEdit = ["draft", "changes_requested", "rejected"].includes(listing.listingStatus);
            const canDelete = canEdit;
            return (
              <Card key={listing.id} className="group overflow-hidden rounded-3xl border-border/70">
                <div className="relative aspect-[16/10] bg-muted">
                  {cover ? (
                    <img src={cover} alt={titleFor(listing, locale)} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground/45"><ImageIcon className="h-10 w-10" /><span className="text-sm">{locale === "ar" ? "لا توجد صورة" : "No image"}</span></div>
                  )}
                  <Badge className={cn("absolute start-3 top-3 border-0 capitalize", statusStyles[listing.listingStatus])}>
                    {listing.listingStatus.replaceAll("_", " ")}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="absolute end-3 top-3 h-9 w-9 bg-background/90 backdrop-blur" disabled={busy}>
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canEdit ? <DropdownMenuItem onClick={() => navigate("edit-listing", { id: listing.id })}><FileEdit className="me-2 h-4 w-4" />{locale === "ar" ? "تعديل" : "Edit"}</DropdownMenuItem> : null}
                      <DropdownMenuItem onClick={() => navigate("property-detail", { id: listing.id })}><Eye className="me-2 h-4 w-4" />{locale === "ar" ? "معاينة" : "Preview"}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => void action(listing, "duplicate")}><Copy className="me-2 h-4 w-4" />{locale === "ar" ? "إنشاء نسخة" : "Duplicate"}</DropdownMenuItem>
                      {listing.listingStatus === "pending_review" ? <DropdownMenuItem onClick={() => void action(listing, "withdraw")}><Undo2 className="me-2 h-4 w-4" />{locale === "ar" ? "سحب من المراجعة" : "Withdraw review"}</DropdownMenuItem> : null}
                      {listing.listingStatus === "archived" ? <DropdownMenuItem onClick={() => void action(listing, "restore")}><RotateCcw className="me-2 h-4 w-4" />{locale === "ar" ? "استعادة" : "Restore"}</DropdownMenuItem> : null}
                      {["draft", "changes_requested", "rejected", "published"].includes(listing.listingStatus) ? <DropdownMenuItem onClick={() => void action(listing, "archive")}><Archive className="me-2 h-4 w-4" />{locale === "ar" ? "أرشفة" : "Archive"}</DropdownMenuItem> : null}
                      {canDelete ? <><DropdownMenuSeparator /><DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => void remove(listing)}><Trash2 className="me-2 h-4 w-4" />{locale === "ar" ? "حذف نهائي" : "Delete permanently"}</DropdownMenuItem></> : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold">{titleFor(listing, locale)}</h2>
                      <p className="mt-1 truncate text-sm text-muted-foreground">{locationFor(listing, locale)}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 capitalize">{listing.status}</Badge>
                  </div>
                  <p className="mt-4 text-xl font-bold text-primary">${listing.price.toLocaleString()}</p>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-muted-foreground"><span>{locale === "ar" ? "اكتمال البيانات" : "Completeness"}</span><span>{listing.completion}%</span></div>
                    <Progress value={listing.completion} className="mt-2" />
                  </div>
                  {listing.reviewNotes && ["changes_requested", "rejected"].includes(listing.listingStatus) ? (
                    <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50/70 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/20">
                      <p className="font-medium">{locale === "ar" ? "ملاحظات المراجعة" : "Review feedback"}</p>
                      <p className="mt-1 line-clamp-3 text-muted-foreground">{listing.reviewNotes}</p>
                    </div>
                  ) : null}
                  {listing.listingStatus === "scheduled" ? (
                    <p className="mt-4 rounded-xl bg-violet-50 p-3 text-sm text-violet-800 dark:bg-violet-950/30 dark:text-violet-300">
                      {locale === "ar" ? "موعد النشر" : "Publishes"}: {localDate(listing.scheduledPublishAt, locale)}
                    </p>
                  ) : null}
                  <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-muted/50 p-3 text-center text-xs text-muted-foreground">
                    <div><Heart className="mx-auto h-4 w-4" /><strong className="mt-1 block text-foreground">{listing._count.favoritedBy}</strong></div>
                    <div><MessageSquare className="mx-auto h-4 w-4" /><strong className="mt-1 block text-foreground">{listing._count.inquiries}</strong></div>
                    <div><ImageIcon className="mx-auto h-4 w-4" /><strong className="mt-1 block text-foreground">{listing.media.length}</strong></div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">{locale === "ar" ? "آخر تحديث" : "Updated"}: {localDate(listing.updatedAt, locale)}</p>
                  <div className="mt-5 flex gap-2">
                    {canEdit ? (
                      <Button className="flex-1 gap-2" onClick={() => navigate("edit-listing", { id: listing.id })}><FileEdit className="h-4 w-4" />{locale === "ar" ? "متابعة" : "Continue"}</Button>
                    ) : (
                      <Button variant="outline" className="flex-1 gap-2" onClick={() => navigate("property-detail", { id: listing.id })}><Eye className="h-4 w-4" />{locale === "ar" ? "معاينة" : "Preview"}</Button>
                    )}
                    {canEdit && listing.completion === 100 ? (
                      <Button variant="outline" size="icon" disabled={busy} onClick={() => void action(listing, "submit")} aria-label="Submit"><Send className="h-4 w-4" /></Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
