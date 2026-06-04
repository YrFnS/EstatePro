"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { Share2, Copy, Check, MessageCircle, Mail, Link2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface SharePropertyDialogProps {
  propertyId: string;
  propertyTitle: string;
  trigger?: React.ReactNode;
}

export function SharePropertyDialog({
  propertyId,
  propertyTitle,
  trigger,
}: SharePropertyDialogProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  // Generate a shareable link (simulated)
  const shareLink = `${typeof window !== "undefined" ? window.location.origin : ""}?view=property-detail&id=${propertyId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success(t("share.linkCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = shareLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      toast.success(t("share.linkCopied"));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`${propertyTitle}\n${shareLink}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(propertyTitle);
    const body = encodeURIComponent(
      `Check out this property: ${propertyTitle}\n\n${shareLink}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  const handleShareSMS = () => {
    const text = encodeURIComponent(`${propertyTitle} ${shareLink}`);
    window.open(`sms:?body=${text}`, "_blank");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="w-4 h-4" />
            {t("share.share")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            {t("share.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Property title */}
          <p className="text-sm text-muted-foreground truncate">
            {propertyTitle}
          </p>

          {/* Copy link */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("share.copyLink")}</label>
            <div className="flex items-center gap-2">
              <Input
                value={shareLink}
                readOnly
                className="text-xs bg-muted/50"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-primary" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Share via apps */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("share.shareVia")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleShareWhatsApp}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border hover:bg-accent transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-xs font-medium">WhatsApp</span>
              </button>
              <button
                onClick={handleShareEmail}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border hover:bg-accent transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-xs font-medium">
                  {t("share.email")}
                </span>
              </button>
              <button
                onClick={handleShareSMS}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border hover:bg-accent transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-xs font-medium">SMS</span>
              </button>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              onClick={handleCopyLink}
            >
              <Link2 className="w-3.5 h-3.5" />
              {copied ? t("share.copied") : t("share.copyLink")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
