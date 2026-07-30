"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  FileText,
  GripVertical,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  Star,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ListingMediaItem {
  id: string;
  propertyId: string;
  url: string;
  storageKey: string | null;
  source: string;
  type: "image" | "video" | "floorplan" | "document";
  mimeType: string | null;
  sizeBytes: number | null;
  width: number | null;
  height: number | null;
  sortOrder: number;
  isCover: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PropertyMediaManagerProps {
  propertyId: string;
  editable?: boolean;
  onChange?: (items: ListingMediaItem[]) => void;
}

interface UploadTarget {
  uploadUrl: string;
  publicUrl: string;
  storageKey: string;
  headers: Record<string, string>;
  expiresAt: string;
  type: ListingMediaItem["type"];
}

async function mediaRequest<T>(
  propertyId: string,
  body?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(
    `/api/account/listings/${encodeURIComponent(propertyId)}/media`,
    {
      method: body ? "POST" : "GET",
      cache: "no-store",
      headers: body
        ? { "Content-Type": "application/json" }
        : { Accept: "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    }
  );
  const payload = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(
      typeof payload.error === "string"
        ? payload.error
        : "Media request failed"
    );
  }
  return payload as T;
}

function mediaIcon(type: ListingMediaItem["type"]) {
  if (type === "video") return Video;
  if (type === "floorplan" || type === "document") return FileText;
  return ImageIcon;
}

function imageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  if (!file.type.startsWith("image/")) return Promise.resolve(null);
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    image.src = url;
  });
}

export function PropertyMediaManager({
  propertyId,
  editable = true,
  onChange,
}: PropertyMediaManagerProps) {
  const { locale } = useI18n();
  const [items, setItems] = useState<ListingMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [storageConfigured, setStorageConfigured] = useState(false);
  const [maxItems, setMaxItems] = useState(40);
  const [externalUrl, setExternalUrl] = useState("");
  const [externalType, setExternalType] = useState<ListingMediaItem["type"]>("image");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const publishItems = useCallback(
    (next: ListingMediaItem[]) => {
      const ordered = [...next].sort((a, b) => a.sortOrder - b.sortOrder);
      setItems(ordered);
      onChange?.(ordered);
    },
    [onChange]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await mediaRequest<{
        media: ListingMediaItem[];
        storageConfigured: boolean;
        maxItems: number;
      }>(propertyId);
      publishItems(payload.media || []);
      setStorageConfigured(Boolean(payload.storageConfigured));
      setMaxItems(payload.maxItems || 40);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load media");
    } finally {
      setLoading(false);
    }
  }, [propertyId, publishItems]);

  useEffect(() => {
    void load();
  }, [load]);

  const reorder = async (
    next: ListingMediaItem[],
    coverId?: string | null
  ) => {
    setSaving(true);
    const previous = items;
    const optimistic = next.map((item, index) => ({
      ...item,
      sortOrder: index,
      isCover: coverId ? item.id === coverId : item.isCover,
    }));
    publishItems(optimistic);
    try {
      const payload = await mediaRequest<{ items: ListingMediaItem[] }>(
        propertyId,
        {
          action: "reorder",
          orderedIds: optimistic.map((item) => item.id),
          coverId:
            coverId ?? optimistic.find((item) => item.isCover)?.id ?? null,
        }
      );
      publishItems(payload.items || optimistic);
    } catch (error) {
      publishItems(previous);
      toast.error(error instanceof Error ? error.message : "Failed to reorder media");
    } finally {
      setSaving(false);
    }
  };

  const move = (id: string, direction: -1 | 1) => {
    const index = items.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    void reorder(next);
  };

  const dropOn = (targetId: string) => {
    if (!draggingId || draggingId === targetId) return;
    const sourceIndex = items.findIndex((item) => item.id === draggingId);
    const targetIndex = items.findIndex((item) => item.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const next = [...items];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    setDraggingId(null);
    void reorder(next);
  };

  const addExternal = async () => {
    if (!externalUrl.trim()) return;
    setSaving(true);
    try {
      const payload = await mediaRequest<{
        items: ListingMediaItem[];
      }>(propertyId, {
        action: "add_url",
        url: externalUrl.trim(),
        type: externalType,
      });
      publishItems(payload.items || []);
      setExternalUrl("");
      toast.success(locale === "ar" ? "تمت إضافة الوسائط" : "Media added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add media");
    } finally {
      setSaving(false);
    }
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    let latest = items;
    try {
      for (const file of Array.from(files)) {
        const targetPayload = await mediaRequest<{ target: UploadTarget }>(
          propertyId,
          {
            action: "presign",
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
          }
        );
        const target = targetPayload.target;
        const uploadResponse = await fetch(target.uploadUrl, {
          method: "PUT",
          headers: target.headers,
          body: file,
        });
        if (!uploadResponse.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }
        const dimensions = await imageDimensions(file);
        const confirmed = await mediaRequest<{
          items: ListingMediaItem[];
        }>(propertyId, {
          action: "confirm_upload",
          url: target.publicUrl,
          storageKey: target.storageKey,
          mimeType: file.type,
          sizeBytes: file.size,
          type: target.type,
          width: dimensions?.width ?? null,
          height: dimensions?.height ?? null,
        });
        latest = confirmed.items || latest;
        publishItems(latest);
      }
      toast.success(locale === "ar" ? "اكتمل رفع الوسائط" : "Media upload complete");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Media upload failed");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setUploading(false);
    }
  };

  const remove = async (item: ListingMediaItem) => {
    if (!window.confirm(locale === "ar" ? "حذف هذه الوسائط؟" : "Delete this media item?")) return;
    const previous = items;
    publishItems(items.filter((entry) => entry.id !== item.id));
    try {
      const payload = await mediaRequest<{ items: ListingMediaItem[] }>(
        propertyId,
        { action: "delete", mediaId: item.id }
      );
      publishItems(payload.items || []);
    } catch (error) {
      publishItems(previous);
      toast.error(error instanceof Error ? error.message : "Failed to delete media");
    }
  };

  const imageCount = useMemo(
    () => items.filter((item) => item.type === "image").length,
    [items]
  );

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-44 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">
            {locale === "ar" ? "وسائط العقار" : "Property media"}
          </p>
          <p className="text-sm text-muted-foreground">
            {items.length}/{maxItems} · {imageCount} {locale === "ar" ? "صورة" : "images"}
          </p>
        </div>
        {editable && storageConfigured ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,application/pdf"
              className="hidden"
              onChange={(event) => void uploadFiles(event.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={uploading || items.length >= maxItems}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {locale === "ar" ? "رفع ملفات" : "Upload files"}
            </Button>
          </>
        ) : null}
      </div>

      {editable ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_160px_auto] md:items-end">
            <div className="space-y-2">
              <Label htmlFor={`media-url-${propertyId}`}>
                {locale === "ar" ? "رابط وسائط خارجي" : "External media URL"}
              </Label>
              <div className="relative">
                <LinkIcon className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id={`media-url-${propertyId}`}
                  value={externalUrl}
                  onChange={(event) => setExternalUrl(event.target.value)}
                  className="ps-9"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{locale === "ar" ? "النوع" : "Type"}</Label>
              <Select
                value={externalType}
                onValueChange={(value: ListingMediaItem["type"]) => setExternalType(value)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="floorplan">Floor plan</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              onClick={() => void addExternal()}
              disabled={saving || !externalUrl.trim() || items.length >= maxItems}
            >
              {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
              {locale === "ar" ? "إضافة" : "Add"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!storageConfigured && editable ? (
        <p className="rounded-xl bg-muted/60 px-4 py-3 text-xs text-muted-foreground">
          {locale === "ar"
            ? "رفع الملفات غير مفعّل حالياً؛ يمكنك إضافة روابط وسائط حتى يتم إعداد التخزين."
            : "Direct uploads are not configured yet. External media URLs remain available."}
        </p>
      ) : null}

      {!items.length ? (
        <div className="rounded-3xl border border-dashed p-10 text-center">
          <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 font-medium">
            {locale === "ar" ? "لا توجد وسائط بعد" : "No media yet"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {locale === "ar"
              ? "أضف صورة واحدة على الأقل قبل إرسال الإعلان للمراجعة."
              : "Add at least one image before submitting the listing for review."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item, index) => {
            const Icon = mediaIcon(item.type);
            return (
              <Card
                key={item.id}
                draggable={editable}
                onDragStart={() => setDraggingId(item.id)}
                onDragEnd={() => setDraggingId(null)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => dropOn(item.id)}
                className={cn(
                  "overflow-hidden rounded-2xl transition",
                  draggingId === item.id && "opacity-50"
                )}
              >
                <div className="relative aspect-[4/3] bg-muted">
                  {item.type === "image" ? (
                    <img src={item.url} alt="" className="h-full w-full object-cover" />
                  ) : item.type === "video" ? (
                    <video src={item.url} className="h-full w-full object-cover" muted preload="metadata" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2">
                      <Icon className="h-10 w-10 text-muted-foreground/50" />
                      <span className="text-xs text-muted-foreground">{item.type}</span>
                    </div>
                  )}
                  <div className="absolute start-2 top-2 flex gap-2">
                    <Badge variant="secondary">{index + 1}</Badge>
                    {item.isCover ? <Badge className="gap-1"><Star className="h-3 w-3 fill-current" />Cover</Badge> : null}
                  </div>
                  {editable ? (
                    <div className="absolute end-2 top-2 rounded-lg bg-background/85 p-1 shadow-sm backdrop-blur">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ) : null}
                </div>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="truncate">{item.mimeType || item.type}</span>
                    {item.sizeBytes ? <span className="ms-auto shrink-0">{(item.sizeBytes / 1024 / 1024).toFixed(1)} MB</span> : null}
                  </div>
                  {editable ? (
                    <div className="mt-3 flex items-center gap-1">
                      <Button type="button" variant="outline" size="icon" className="h-8 w-8" disabled={index === 0 || saving} onClick={() => move(item.id, -1)} aria-label="Move up"><ArrowUp className="h-3.5 w-3.5" /></Button>
                      <Button type="button" variant="outline" size="icon" className="h-8 w-8" disabled={index === items.length - 1 || saving} onClick={() => move(item.id, 1)} aria-label="Move down"><ArrowDown className="h-3.5 w-3.5" /></Button>
                      {item.type === "image" && !item.isCover ? (
                        <Button type="button" variant="outline" size="sm" className="ms-1 h-8 gap-1" disabled={saving} onClick={() => void reorder(items, item.id)}><Star className="h-3.5 w-3.5" />{locale === "ar" ? "غلاف" : "Cover"}</Button>
                      ) : null}
                      <Button type="button" variant="ghost" size="icon" className="ms-auto h-8 w-8 text-destructive hover:text-destructive" onClick={() => void remove(item)} aria-label="Delete media"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
