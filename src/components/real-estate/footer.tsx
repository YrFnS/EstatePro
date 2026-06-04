"use client";

import { useI18n } from "@/lib/i18n/provider";
import { useRouter, type View } from "@/lib/router";
import { useSiteSettings } from "@/hooks/use-site-settings";
import {
  Home,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Send,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";

interface QuickLink {
  label: string;
  view: View;
}

export function Footer() {
  const { t, locale, dir } = useI18n();
  const { navigate } = useRouter();
  const { getSetting } = useSiteSettings();
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  // Get footer info from settings with fallbacks
  const companyDesc = getSetting("footer.companyDesc", locale) || t("footer.description");
  const phone = getSetting("footer.phone", locale) || t("footer.phone") || "";
  const emailAddr = getSetting("footer.email", locale) || t("footer.email") || "";
  const address = getSetting("footer.address", locale) || t("footer.address") || "";

  const quickLinks: QuickLink[] = [
    { label: t("common.home"), view: "home" },
    { label: t("common.properties"), view: "properties" },
    { label: t("common.agents"), view: "agents" },
    { label: t("common.about"), view: "about" },
    { label: t("common.contact"), view: "contact" },
    { label: t("common.calculator"), view: "calculator" },
  ];

  // Build popular cities from settings (footer.city1 through footer.city6)
  const popularCities = [1, 2, 3, 4, 5, 6]
    .map((i) => {
      const name = getSetting(`footer.city${i}`, locale);
      return name ? { name, searchQuery: name } : null;
    })
    .filter(Boolean) as { name: string; searchQuery: string }[];

  // Build social links from settings
  const socialLinks = [
    { icon: Facebook, settingKey: "social.facebook", label: "Facebook", hoverClass: "hover:bg-blue-600/20 hover:text-blue-400 hover:border-blue-500/40" },
    { icon: Twitter, settingKey: "social.twitter", label: "X (Twitter)", hoverClass: "hover:bg-sky-600/20 hover:text-sky-400 hover:border-sky-500/40" },
    { icon: Linkedin, settingKey: "social.linkedin", label: "LinkedIn", hoverClass: "hover:bg-blue-700/20 hover:text-blue-300 hover:border-blue-600/40" },
    { icon: Instagram, settingKey: "social.instagram", label: "Instagram", hoverClass: "hover:bg-pink-600/20 hover:text-pink-400 hover:border-pink-500/40" },
  ].map((s) => ({
    ...s,
    href: getSetting(s.settingKey, locale) || "#",
  }));

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSubscribing(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(t("footer.subscribeSuccess"));
        setEmail("");
      } else {
        toast.error(data.error || "Subscription failed");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubscribing(false);
    }
  };

  // Format address: split by newlines for display
  const addressLines = address.split("\\n").length > 1 ? address.split("\\n") : address.split("\n");

  return (
    <footer className="mt-auto" dir={dir}>
      {/* Main Footer Content — dark charcoal for professional weight */}
      <div className="bg-[var(--charcoal)] text-[hsl(38,30%,90%)]">
        <div className="container mx-auto px-4 py-12 lg:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12">
            {/* Column 1: Logo + Description + Social */}
            <div className="space-y-5 lg:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-sm bg-[var(--gold)]">
                  <Home className="w-4 h-4 text-[var(--gold-foreground)]" />
                </div>
                <span className="text-lg font-semibold tracking-tight">
                  {t("common.appName")}
                </span>
              </div>
              <p className="text-sm text-[hsl(38,20%,65%)] leading-relaxed max-w-xs">
                {companyDesc}
              </p>
              <div className="flex items-center gap-2.5 pt-1">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    className={`flex items-center justify-center w-9 h-9 rounded-full border border-[hsl(215,15%,28%)] text-[hsl(38,20%,60%)] hover:text-[hsl(38,30%,90%)] hover:border-[hsl(38,20%,55%)] transition-all duration-300 hover:scale-110 hover:-translate-y-0.5 ${social.hoverClass}`}
                    aria-label={social.label}
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[hsl(38,15%,50%)]">
                {t("footer.quickLinks")}
              </h3>
              <nav className="flex flex-col gap-2">
                {quickLinks.map((link) => (
                  <button
                    key={link.view}
                    onClick={() => navigate(link.view)}
                    className="text-sm text-[hsl(38,20%,65%)] hover:text-[hsl(38,30%,90%)] transition-colors duration-200 text-start group"
                  >
                    <span className="inline-block border-b border-transparent group-hover:border-[hsl(38,30%,55%)] transition-colors duration-200">
                      {link.label}
                    </span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Column 3: Popular Cities */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[hsl(38,15%,50%)]">
                {t("footer.popularCities")}
              </h3>
              <nav className="flex flex-col gap-2">
                {popularCities.map((city) => (
                  <button
                    key={city.name}
                    onClick={() => navigate("properties", { search: city.searchQuery })}
                    className="text-sm text-[hsl(38,20%,65%)] hover:text-[hsl(38,30%,90%)] transition-colors duration-200 text-start group flex items-center gap-1.5"
                  >
                    <MapPin className="w-3 h-3 shrink-0 text-[hsl(38,15%,45%)]" />
                    <span className="inline-block border-b border-transparent group-hover:border-[hsl(38,30%,55%)] transition-colors duration-200">
                      {city.name}
                    </span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Column 4: Contact Us */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[hsl(38,15%,50%)]">
                {t("footer.contactInfo")}
              </h3>
              <div className="space-y-3 text-sm text-[hsl(38,20%,65%)]">
                <address className="not-italic leading-relaxed flex items-start gap-2">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-[hsl(38,15%,45%)]" />
                  <span>
                    {addressLines.map((line, i) => (
                      <span key={i}>
                        {line}
                        {i < addressLines.length - 1 && <br />}
                      </span>
                    ))}
                  </span>
                </address>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 shrink-0 text-[hsl(38,15%,45%)]" />
                  <a
                    href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                    className="hover:text-[hsl(38,30%,90%)] transition-colors duration-200"
                  >
                    {phone}
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 shrink-0 text-[hsl(38,15%,45%)]" />
                  <a
                    href={`mailto:${emailAddr}`}
                    className="hover:text-[hsl(38,30%,90%)] transition-colors duration-200"
                  >
                    {emailAddr}
                  </a>
                </p>
              </div>
            </div>

            {/* Column 5: Newsletter */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[hsl(38,15%,50%)]">
                {t("footer.newsletter")}
              </h3>
              <p className="text-sm text-[hsl(38,20%,65%)] leading-relaxed">
                {t("footer.newsletterDesc")}
              </p>
              <form onSubmit={handleSubscribe} className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder={t("footer.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 bg-[hsl(215,20%,22%)] border-[hsl(215,15%,30%)] text-[hsl(38,30%,90%)] placeholder:text-[hsl(215,10%,40%)] focus-visible:ring-[var(--gold)] focus-visible:border-[var(--gold)] transition-colors duration-200"
                    required
                  />
                  <Button
                    type="submit"
                    disabled={subscribing}
                    size="sm"
                    className="h-10 px-5 bg-[var(--gold)] hover:bg-[var(--gold-hover)] text-[var(--gold-foreground)] shrink-0 transition-all duration-200 hover:shadow-lg hover:shadow-[var(--gold)]/20"
                  >
                    {subscribing ? (
                      <div className="w-4 h-4 border-2 border-[var(--gold-foreground)]/30 border-t-[var(--gold-foreground)] rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </form>
              <p className="text-xs text-[hsl(215,10%,35%)]">
                {t("footer.noSpam")}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[hsl(215,15%,22%)]">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[hsl(215,10%,45%)]">
              <p>
                © {new Date().getFullYear()} {t("common.appName")}.{" "}
                {t("footer.rights")}
              </p>
              <div className="flex items-center gap-3">
                <button className="hover:text-[hsl(38,30%,90%)] transition-colors duration-200">
                  {t("footer.privacy")}
                </button>
                <span className="text-[hsl(215,15%,30%)]">·</span>
                <button className="hover:text-[hsl(38,30%,90%)] transition-colors duration-200">
                  {t("footer.terms")}
                </button>
                <span className="text-[hsl(215,15%,30%)]">·</span>
                <button className="hover:text-[hsl(38,30%,90%)] transition-colors duration-200">
                  {t("footer.cookies")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
