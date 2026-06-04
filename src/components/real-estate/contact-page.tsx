"use client";

import { useI18n } from "@/lib/i18n/provider";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin as MapPinIcon,
  Phone,
  Mail,
  Clock,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Building2,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { useState, useMemo, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useSiteSettings } from "@/hooks/use-site-settings";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const MESSAGE_MAX_LENGTH = 500;

export function ContactPage() {
  const { t, locale } = useI18n();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isRtl = locale === "ar";

  const validate = useMemo(() => {
    return () => {
      const errs: Record<string, string> = {};
      if (!form.name.trim()) errs.name = isRtl ? "الاسم مطلوب" : "Name is required";
      if (!form.email.trim()) errs.email = isRtl ? "البريد الإلكتروني مطلوب" : "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        errs.email = isRtl ? "بريد إلكتروني غير صالح" : "Invalid email address";
      if (!form.subject.trim()) errs.subject = isRtl ? "الموضوع مطلوب" : "Subject is required";
      if (!form.message.trim()) errs.message = isRtl ? "الرسالة مطلوبة" : "Message is required";
      else if (form.message.trim().length < 10)
        errs.message = isRtl ? "الرسالة قصيرة جداً" : "Message too short (min 10 chars)";
      return errs;
    };
  }, [form, isRtl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success(t("contact.successMessage"));
        setForm({ name: "", email: "", phone: "", subject: "", message: "" });
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
      } else {
        toast.error("Failed to send message");
      }
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const { getSetting } = useSiteSettings();

  // Compute map embed URL from settings
  const mapLat = getSetting("footer.lat", locale) || "40.720";
  const mapLng = getSetting("footer.lng", locale) || "-73.990";
  const mapLatNum = parseFloat(mapLat);
  const mapLngNum = parseFloat(mapLng);
  const mapBbox = `${mapLngNum - 0.015}%2C${mapLatNum - 0.01}%2C${mapLngNum + 0.015}%2C${mapLatNum + 0.01}`;
  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${mapBbox}&layer=mapnik&marker=${mapLat}%2C${mapLng}`;
  const mapLabel = getSetting("footer.address", locale) || t("contact.officeLocation");

  const contactInfo = [
    {
      icon: MapPinIcon,
      label: t("contact.address"),
      value: getSetting("footer.address", locale) || t("contact.address"),
      gradient: "bg-primary",
      bgLight: "bg-primary/10",
      gradientBg: "bg-primary/5",
    },
    {
      icon: Phone,
      label: t("contact.phoneLabel"),
      value: getSetting("footer.phone", locale) || t("contact.phoneLabel"),
      gradient: "bg-primary",
      bgLight: "bg-primary/10",
      gradientBg: "bg-primary/5",
    },
    {
      icon: Mail,
      label: t("contact.emailLabel"),
      value: getSetting("footer.email", locale) || t("contact.emailLabel"),
      gradient: "bg-primary",
      bgLight: "bg-primary/10",
      gradientBg: "bg-primary/5",
    },
    {
      icon: Clock,
      label: t("contact.workingHours"),
      value: t("contact.workingHoursValue"),
      gradient: "bg-primary",
      bgLight: "bg-primary/10",
      gradientBg: "bg-primary/5",
    },
  ];

  const faqs = [
    { q: t("contact.faq1Q"), a: t("contact.faq1A") },
    { q: t("contact.faq2Q"), a: t("contact.faq2A") },
    { q: t("contact.faq3Q"), a: t("contact.faq3A") },
    { q: t("contact.faq4Q"), a: t("contact.faq4A") },
  ];

  return (
    <div className="py-8 md:py-12 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 -start-20 w-72 h-72 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 -end-20 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-6 shadow-lg envelope-animate"
          >
            <Mail className="w-8 h-8" />
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{t("contact.title")}</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t("contact.subtitle")}</p>
        </motion.div>

        {/* Main Grid: Form + Contact Info & Map */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-6xl mx-auto">
          {/* Contact Form */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="lg:col-span-3"
          >
            <Card className="border-0 shadow-lg overflow-hidden relative">
              {/* Gradient accent top bar */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-primary" />
              <CardContent className="p-6 md:p-8 pt-8">
                <AnimatePresence mode="wait">
                  {submitted ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex flex-col items-center justify-center py-12 text-center relative"
                    >
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-8 h-8 text-primary" />
                      </div>
                      {/* Confetti particles */}
                      {["#059669", "#14b8a6", "#f59e0b", "#34d399", "#2dd4bf", "#6ee7b7", "#fbbf24", "#10b981"].map((color, i) => (
                        <div
                          key={i}
                          className="confetti-particle"
                          style={{
                            backgroundColor: color,
                            left: `${30 + (i * 5)}%`,
                            top: "30%",
                            animationDelay: `${i * 0.1}s`,
                            animationDuration: `${1 + (i % 3) * 0.3}s`,
                          }}
                        />
                      ))}
                      <h3 className="text-xl font-semibold mb-2">
                        {t("contact.successMessage")}
                      </h3>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleSubmit}
                      className="space-y-5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-medium">
                            {t("contact.name")} <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <Input
                              id="name"
                              value={form.name}
                              onChange={(e) => handleChange("name", e.target.value)}
                              className={
                                errors.name
                                  ? "border-red-500 focus-visible:ring-red-500/30"
                                  : form.name && !errors.name
                                    ? "border-primary focus-visible:ring-primary/30"
                                    : ""
                              }
                            />
                            {form.name && !errors.name && (
                              <CheckCircle2 className="absolute top-1/2 -translate-y-1/2 end-3 w-4 h-4 text-primary" />
                            )}
                          </div>
                          {errors.name && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {errors.name}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium">
                            {t("contact.email")} <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <Input
                              id="email"
                              type="email"
                              value={form.email}
                              onChange={(e) => handleChange("email", e.target.value)}
                              className={
                                errors.email
                                  ? "border-red-500 focus-visible:ring-red-500/30"
                                  : form.email && !errors.email
                                    ? "border-primary focus-visible:ring-primary/30"
                                    : ""
                              }
                            />
                            {form.email && !errors.email && (
                              <CheckCircle2 className="absolute top-1/2 -translate-y-1/2 end-3 w-4 h-4 text-primary" />
                            )}
                          </div>
                          {errors.email && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {errors.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm font-medium">
                            {t("contact.phone")}
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={form.phone}
                            onChange={(e) => handleChange("phone", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subject" className="text-sm font-medium">
                            {t("contact.subject")} <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <Input
                              id="subject"
                              value={form.subject}
                              onChange={(e) => handleChange("subject", e.target.value)}
                              className={
                                errors.subject
                                  ? "border-red-500 focus-visible:ring-red-500/30"
                                  : form.subject && !errors.subject
                                    ? "border-primary focus-visible:ring-primary/30"
                                    : ""
                              }
                            />
                            {form.subject && !errors.subject && (
                              <CheckCircle2 className="absolute top-1/2 -translate-y-1/2 end-3 w-4 h-4 text-primary" />
                            )}
                          </div>
                          {errors.subject && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {errors.subject}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="message" className="text-sm font-medium">
                            {t("contact.message")} <span className="text-red-500">*</span>
                          </Label>
                          <span
                            className={`text-xs ${
                              form.message.length > MESSAGE_MAX_LENGTH
                                ? "text-red-500"
                                : form.message.length > MESSAGE_MAX_LENGTH * 0.8
                                  ? "text-amber-500"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {form.message.length}/{MESSAGE_MAX_LENGTH}
                          </span>
                        </div>
                        <Textarea
                          id="message"
                          value={form.message}
                          onChange={(e) => {
                            if (e.target.value.length <= MESSAGE_MAX_LENGTH) {
                              handleChange("message", e.target.value);
                            }
                          }}
                          rows={5}
                          className={
                            errors.message
                              ? "border-red-500 focus-visible:ring-red-500/30"
                              : form.message.length > 10 && !errors.message
                                ? "border-primary focus-visible:ring-primary/30"
                                : ""
                          }
                        />
                        {errors.message && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {errors.message}
                          </p>
                        )}
                      </div>
                      <Button
                        type="submit"
                        className="w-full gap-2 bg-primary hover:bg-primary/90 shadow-lg transition-all duration-300 h-11"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {t("common.loading")}
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            {t("contact.send")}
                          </>
                        )}
                      </Button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Info & Map */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="lg:col-span-2 space-y-4"
          >
            {/* Contact Info Cards */}
            {contactInfo.map((info, idx) => (
              <motion.div
                key={idx}
                variants={fadeUp}
              >
                <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden">
                  <CardContent className={`p-4 ${info.gradientBg}`}>
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex items-center justify-center w-11 h-11 rounded-xl ${info.gradient} text-primary-foreground shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-300`}
                      >
                        <info.icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground mb-0.5">{info.label}</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                          {info.value}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Map - OpenStreetMap Embed */}
            <motion.div variants={fadeUp}>
              <Card className="border-0 shadow-sm overflow-hidden relative">
                <CardContent className="p-0 relative">
                  <div className="relative">
                    <iframe
                      title={t("contact.officeLocation")}
                      src={mapEmbedUrl}
                      className="w-full h-56 border-0"
                      loading="lazy"
                      allowFullScreen
                    />
                    {/* Overlay gradient at bottom */}
                    <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
                    <div className="absolute bottom-2 start-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPinIcon className="w-3.5 h-3.5 text-primary pin-bounce" />
                      <span>{mapLabel}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>

        {/* FAQ Section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="max-w-3xl mx-auto mt-16"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground mb-4 shadow-md">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">{t("contact.faqTitle")}</h2>
            <div className="w-20 h-1 bg-primary rounded-full mx-auto" />
          </div>
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="h-1 bg-primary" />
            <CardContent className="p-6">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, idx) => (
                  <AccordionItem key={idx} value={`faq-${idx}`}>
                    <AccordionTrigger className="text-start hover:no-underline hover:text-primary transition-colors">
                      <span className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-medium">{faq.q}</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed ps-10">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bottom CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="relative rounded-2xl overflow-hidden bg-primary p-8 md:p-12 text-center">
            {/* Decorative circles */}
            <div className="absolute -top-10 -start-10 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute -bottom-10 -end-10 w-32 h-32 rounded-full bg-white/5" />
            <div className="absolute top-1/2 end-8 w-20 h-20 rounded-full bg-white/5 -translate-y-1/2" />
            <div className="relative">
              <Building2 className="w-10 h-10 text-primary-foreground/80 mx-auto mb-4" />
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
                {isRtl ? "هل تريد زيارة مكاتبنا؟" : "Want to visit our office?"}
              </h3>
              <p className="text-primary-foreground/80 max-w-lg mx-auto mb-6">
                {isRtl
                  ? "نرحب بكم في أي وقت خلال ساعات العمل. لا تترددوا في التواصل معنا."
                  : "We welcome walk-ins during business hours. Feel free to stop by or schedule an appointment."}
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button
                  variant="secondary"
                  className="bg-background text-primary hover:bg-muted shadow-lg"
                  onClick={() => {
                    toast.success(isRtl ? "سيتم التواصل معك قريباً" : "We'll reach out to you soon!");
                  }}
                >
                  <Phone className="w-4 h-4 me-2" />
                  {isRtl ? "اتصل الآن" : "Call Now"}
                </Button>
                <Button
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <Mail className="w-4 h-4 me-2" />
                  {isRtl ? "أرسل رسالة" : "Send a Message"}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
