"use client";

import {
  type FormEvent,
  type ReactNode,
  useMemo,
  useState,
} from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock,
  HelpCircle,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Send,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const MESSAGE_MAX_LENGTH = 500;

interface ContactFormState {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

type ContactFormErrors = Partial<Record<keyof ContactFormState, string>>;

const EMPTY_FORM: ContactFormState = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

function safeCoordinate(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function focusFormField(id: string) {
  window.requestAnimationFrame(() => {
    document.getElementById(id)?.focus({ preventScroll: false });
  });
}

export function ContactPageStable() {
  const { t, locale } = useI18n();
  const { getSetting } = useSiteSettings();
  const [form, setForm] = useState<ContactFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isRtl = locale === "ar";
  const address =
    getSetting("footer.address", locale) || t("contact.address");
  const phone =
    getSetting("footer.phone", locale) || t("contact.phoneLabel");
  const email =
    getSetting("footer.email", locale) || t("contact.emailLabel");

  const mapEmbedUrl = useMemo(() => {
    const latitude = safeCoordinate(
      getSetting("footer.lat", locale),
      40.72
    );
    const longitude = safeCoordinate(
      getSetting("footer.lng", locale),
      -73.99
    );
    const bbox = encodeURIComponent(
      [
        longitude - 0.015,
        latitude - 0.01,
        longitude + 0.015,
        latitude + 0.01,
      ].join(",")
    );
    const marker = encodeURIComponent(`${latitude},${longitude}`);

    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`;
  }, [getSetting, locale]);

  const contactInfo = [
    { icon: MapPin, label: t("contact.address"), value: address },
    { icon: Phone, label: t("contact.phoneLabel"), value: phone },
    { icon: Mail, label: t("contact.emailLabel"), value: email },
    {
      icon: Clock,
      label: t("contact.workingHours"),
      value: t("contact.workingHoursValue"),
    },
  ];

  const faqs = [
    { question: t("contact.faq1Q"), answer: t("contact.faq1A") },
    { question: t("contact.faq2Q"), answer: t("contact.faq2A") },
    { question: t("contact.faq3Q"), answer: t("contact.faq3A") },
    { question: t("contact.faq4Q"), answer: t("contact.faq4A") },
  ];

  const validate = (): ContactFormErrors => {
    const nextErrors: ContactFormErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = isRtl ? "الاسم مطلوب" : "Name is required";
    }

    if (!form.email.trim()) {
      nextErrors.email = isRtl
        ? "البريد الإلكتروني مطلوب"
        : "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = isRtl
        ? "بريد إلكتروني غير صالح"
        : "Invalid email address";
    }

    if (!form.subject.trim()) {
      nextErrors.subject = isRtl ? "الموضوع مطلوب" : "Subject is required";
    }

    if (!form.message.trim()) {
      nextErrors.message = isRtl ? "الرسالة مطلوبة" : "Message is required";
    } else if (form.message.trim().length < 10) {
      nextErrors.message = isRtl
        ? "الرسالة قصيرة جداً"
        : "Message too short (min 10 chars)";
    }

    return nextErrors;
  };

  const updateField = (field: keyof ContactFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setSubmitted(false);
    setSubmitError(null);
    setErrors((current) => {
      if (!current[field]) return current;
      return { ...current, [field]: undefined };
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    setSubmitError(null);

    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Failed to send message");
      }

      setForm(EMPTY_FORM);
      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to send message"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openFormAt = (fieldId: string) => {
    setSubmitted(false);
    setSubmitError(null);
    focusFormField(fieldId);
  };

  return (
    <div className="relative overflow-hidden py-8 md:py-12">
      <div className="pointer-events-none absolute -start-24 top-16 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute -end-24 bottom-16 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

      <div className="container mx-auto px-4">
        <header className="mx-auto mb-12 max-w-2xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Mail className="h-8 w-8" />
          </div>
          <h1 className="mb-4 text-3xl font-bold md:text-4xl">
            {t("contact.title")}
          </h1>
          <p className="text-muted-foreground">{t("contact.subtitle")}</p>
        </header>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-5">
          <Card className="relative overflow-hidden border-0 shadow-lg lg:col-span-3">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-primary" />
            <CardContent className="p-6 pt-8 md:p-8 md:pt-9">
              {submitted ? (
                <div
                  className="flex min-h-[430px] flex-col items-center justify-center text-center"
                  data-testid="contact-success"
                  role="status"
                  aria-live="polite"
                >
                  <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    <CheckCircle2 className="h-10 w-10 text-primary" />
                  </div>
                  <h2 className="mb-2 text-2xl font-semibold">
                    {t("contact.successMessage")}
                  </h2>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-6 rounded-full"
                    onClick={() => openFormAt("name")}
                  >
                    {isRtl ? "إرسال رسالة أخرى" : "Send another message"}
                  </Button>
                </div>
              ) : (
                <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                  {submitError ? (
                    <div
                      className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                      role="alert"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  ) : null}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field
                      id="name"
                      label={t("contact.name")}
                      required
                      error={errors.name}
                    >
                      <Input
                        id="name"
                        autoComplete="name"
                        value={form.name}
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={errors.name ? "name-error" : undefined}
                        onChange={(event) =>
                          updateField("name", event.target.value)
                        }
                      />
                    </Field>

                    <Field
                      id="email"
                      label={t("contact.email")}
                      required
                      error={errors.email}
                    >
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={form.email}
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={
                          errors.email ? "email-error" : undefined
                        }
                        onChange={(event) =>
                          updateField("email", event.target.value)
                        }
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field id="phone" label={t("contact.phone")}>
                      <Input
                        id="phone"
                        type="tel"
                        autoComplete="tel"
                        value={form.phone}
                        onChange={(event) =>
                          updateField("phone", event.target.value)
                        }
                      />
                    </Field>

                    <Field
                      id="subject"
                      label={t("contact.subject")}
                      required
                      error={errors.subject}
                    >
                      <Input
                        id="subject"
                        value={form.subject}
                        aria-invalid={Boolean(errors.subject)}
                        aria-describedby={
                          errors.subject ? "subject-error" : undefined
                        }
                        onChange={(event) =>
                          updateField("subject", event.target.value)
                        }
                      />
                    </Field>
                  </div>

                  <Field
                    id="message"
                    label={t("contact.message")}
                    required
                    error={errors.message}
                    trailing={
                      <span
                        className={
                          form.message.length > MESSAGE_MAX_LENGTH * 0.8
                            ? "text-amber-600"
                            : "text-muted-foreground"
                        }
                      >
                        {form.message.length}/{MESSAGE_MAX_LENGTH}
                      </span>
                    }
                  >
                    <Textarea
                      id="message"
                      rows={6}
                      value={form.message}
                      aria-invalid={Boolean(errors.message)}
                      aria-describedby={
                        errors.message ? "message-error" : undefined
                      }
                      onChange={(event) =>
                        updateField(
                          "message",
                          event.target.value.slice(0, MESSAGE_MAX_LENGTH)
                        )
                      }
                    />
                  </Field>

                  <Button
                    type="submit"
                    className="w-full gap-2 rounded-full"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {t("contact.send")}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4 lg:col-span-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {contactInfo.map((item) => (
                <Card
                  key={item.label}
                  className="border-0 shadow-sm transition-shadow hover:shadow-md"
                >
                  <CardContent className="flex items-start gap-4 p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="mb-0.5 text-sm font-semibold">
                        {item.label}
                      </p>
                      <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                        {item.value}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="overflow-hidden border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="relative">
                  <iframe
                    title={t("contact.officeLocation")}
                    src={mapEmbedUrl}
                    className="h-56 w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background/90 to-transparent" />
                  <div className="pointer-events-none absolute bottom-2 start-3 flex max-w-[90%] items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="truncate">{address}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <section className="mx-auto mt-16 max-w-3xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
              <HelpCircle className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold md:text-3xl">
              {t("contact.faqTitle")}
            </h2>
            <div className="mx-auto mt-3 h-1 w-20 rounded-full bg-primary" />
          </div>

          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="h-1 bg-primary" />
            <CardContent className="divide-y p-2 sm:p-4">
              {faqs.map((faq, index) => (
                <details key={faq.question} className="group px-3 py-1">
                  <summary className="flex cursor-pointer list-none items-center gap-3 py-4 font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                      {index + 1}
                    </span>
                    <span className="flex-1 text-start">{faq.question}</span>
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="pb-4 ps-10 leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="relative mx-auto mt-16 max-w-4xl overflow-hidden rounded-2xl bg-primary p-8 text-center md:p-12">
          <div className="pointer-events-none absolute -start-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-10 -end-10 h-32 w-32 rounded-full bg-white/5" />
          <div className="relative">
            <Building2 className="mx-auto mb-4 h-10 w-10 text-primary-foreground/80" />
            <h2 className="mb-3 text-xl font-bold text-white md:text-2xl">
              {isRtl ? "هل تريد زيارة مكاتبنا؟" : "Want to visit our office?"}
            </h2>
            <p className="mx-auto mb-6 max-w-lg text-primary-foreground/80">
              {isRtl
                ? "نرحب بكم خلال ساعات العمل. تواصلوا معنا وسنساعدكم في التخطيط لزيارتكم."
                : "We welcome visitors during business hours. Contact us and we will help you plan your visit."}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                type="button"
                variant="secondary"
                className="gap-2 rounded-full"
                onClick={() => openFormAt("phone")}
              >
                <Phone className="h-4 w-4" />
                {isRtl ? "اطلب اتصالاً" : "Request a call"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-2 rounded-full border-white/30 text-white hover:bg-white/10 hover:text-white"
                onClick={() => openFormAt("name")}
              >
                <Mail className="h-4 w-4" />
                {isRtl ? "أرسل رسالة" : "Send a message"}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  required = false,
  error,
  trailing,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
          {required ? <span className="ms-1 text-red-500">*</span> : null}
        </Label>
        {trailing ? <span className="text-xs">{trailing}</span> : null}
      </div>
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          className="flex items-center gap-1 text-xs text-red-500"
        >
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
