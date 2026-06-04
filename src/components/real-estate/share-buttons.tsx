"use client";

import { useI18n } from "@/lib/i18n/provider";
import { Share2, Link, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareButtonsProps {
  propertyTitle: string;
  propertyUrl: string;
  propertyImage?: string;
}

// WhatsApp SVG icon
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// Facebook SVG icon
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

// Twitter/X SVG icon
function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// LinkedIn SVG icon
function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export function ShareButtons({ propertyTitle, propertyUrl, propertyImage }: ShareButtonsProps) {
  const { t } = useI18n();

  const shareText = `${propertyTitle} - ${propertyUrl}`;
  const encodedUrl = encodeURIComponent(propertyUrl);
  const encodedTitle = encodeURIComponent(propertyTitle);
  const encodedText = encodeURIComponent(shareText);

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodedText}`, "_blank", "noopener,noreferrer");
  };

  const handleFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    window.open(fbUrl, "_blank", "noopener,noreferrer");
  };

  const handleTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer");
  };

  const handleLinkedIn = () => {
    const liUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    window.open(liUrl, "_blank", "noopener,noreferrer");
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(propertyTitle);
    const body = encodeURIComponent(
      `${t("share.shareMessage")}\n\n${propertyTitle}\n${propertyUrl}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(propertyUrl);
      toast.success(t("share.linkCopied"));
    } catch {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = propertyUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast.success(t("share.linkCopied"));
    }
  };

  const shareActions = [
    {
      key: "whatsapp",
      label: t("share.whatsapp"),
      icon: <WhatsAppIcon className="w-4 h-4" />,
      onClick: handleWhatsApp,
      color: "text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/30",
    },
    {
      key: "facebook",
      label: t("share.facebook"),
      icon: <FacebookIcon className="w-4 h-4" />,
      onClick: handleFacebook,
      color: "text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30",
    },
    {
      key: "twitter",
      label: t("share.twitter"),
      icon: <TwitterIcon className="w-4 h-4" />,
      onClick: handleTwitter,
      color: "text-sky-500 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950/30",
    },
    {
      key: "linkedin",
      label: t("share.linkedin"),
      icon: <LinkedInIcon className="w-4 h-4" />,
      onClick: handleLinkedIn,
      color: "text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30",
    },
    {
      key: "email",
      label: t("share.email"),
      icon: <Mail className="w-4 h-4" />,
      onClick: handleEmail,
      color: "text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30",
    },
    {
      key: "copylink",
      label: t("share.copyLink"),
      icon: <Link className="w-4 h-4" />,
      onClick: handleCopyLink,
      color: "text-muted-foreground hover:bg-muted",
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <Share2 className="w-4 h-4" />
        <span>{t("share.title")}</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {shareActions.map((action) => (
          <Button
            key={action.key}
            variant="ghost"
            size="sm"
            onClick={action.onClick}
            className={`gap-1.5 h-8 px-2.5 rounded-lg transition-all duration-200 ${action.color}`}
            title={action.label}
          >
            {action.icon}
            <span className="hidden sm:inline text-xs">{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
