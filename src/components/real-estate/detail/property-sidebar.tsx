"use client";

import type { Property } from "@/components/real-estate/types/property";
import {
  Send,
  Star,
  Phone,
  Calendar,
  Calculator,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PropertyCard } from "@/components/real-estate/property-card";
import { ScheduleTourDialog } from "@/components/real-estate/schedule-tour-dialog";

interface PropertySidebarProps {
  property: Property;
  monthlyPayment: number;
  title: string;
  t: (key: string) => string;
  locale: string;
  inquiryForm: { name: string; email: string; phone: string; message: string };
  setInquiryForm: React.Dispatch<React.SetStateAction<{ name: string; email: string; phone: string; message: string }>>;
  submitting: boolean;
  onInquirySubmit: (e: React.FormEvent) => void;
  onNavigateCalculator: () => void;
  similarProperties: any[];
}

export function PropertySidebar({
  property,
  monthlyPayment,
  title,
  t,
  locale,
  inquiryForm,
  setInquiryForm,
  submitting,
  onInquirySubmit,
  onNavigateCalculator,
  similarProperties,
}: PropertySidebarProps) {
  const agent = property.agent;

  return (
    <>
      {/* ──── Sidebar ──── */}
      <div className="space-y-8">
        {/* Agent Info — subtle, no card wrapper */}
        {agent && (
          <section className="border border-border/40 p-5 rounded-sm">
            <span className="editorial-label">{t("propertyDetail.contactAgent")}</span>
            <div className="flex items-center gap-3 mt-3">
              <img
                src={agent.image || `https://placehold.co/80x80/e2e8f0/64748b?text=Agent`}
                alt={locale === "ar" ? agent.nameAr : agent.nameEn}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-sm">{locale === "ar" ? agent.nameAr : agent.nameEn}</p>
                <p className="text-xs text-muted-foreground">{locale === "ar" ? agent.titleAr : agent.titleEn}</p>
                {agent.rating > 0 && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className={`w-2.5 h-2.5 ${i < Math.round(agent.rating) ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                    ))}
                    <span className="text-[10px] text-muted-foreground ms-1">{agent.rating}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1.5 mt-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <Send className="w-3.5 h-3.5" /> {agent.email}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" /> {agent.phone}
              </p>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                className="flex-1 gap-1.5"
                onClick={() => { window.open(`tel:${agent.phone}`); }}
              >
                <Phone className="w-3.5 h-3.5" />
                {locale === "ar" ? "اتصل" : "Call"}
              </Button>
              <ScheduleTourDialog
                propertyId={property.id}
                propertyTitle={title}
                trigger={
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {t("tour.scheduleTour")}
                  </Button>
                }
              />
            </div>
          </section>
        )}

        {/* Schedule Tour — when no agent */}
        {!agent && (
          <section className="border border-border/40 p-5 rounded-sm text-center">
            <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              {locale === "ar" ? "احجز جولة شخصية أو افتراضية أو مكالمة فيديو لهذا العقار" : "Book an in-person, virtual, or video call tour for this property"}
            </p>
            <ScheduleTourDialog
              propertyId={property.id}
              propertyTitle={title}
              trigger={
                <Button className="w-full btn-gold gap-2">
                  <Calendar className="w-4 h-4" />
                  {t("tour.scheduleTour")}
                </Button>
              }
            />
          </section>
        )}

        {/* Mortgage Estimate — subtle */}
        <section className="border border-border/40 p-5 rounded-sm">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="w-4 h-4 text-muted-foreground" />
            <span className="editorial-label">{t("propertyDetail.mortgageEstimate")}</span>
          </div>
          <div className="text-center mb-3">
            <p className="text-xs text-muted-foreground mb-0.5">{t("propertyDetail.estimatedMonthly")}</p>
            <p className="text-2xl font-bold text-primary" style={{ letterSpacing: "-0.02em" }}>
              {t("common.currency")}{Math.round(monthlyPayment).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {locale === "ar" ? "بنسبة 6.5% لمدة 30 سنة" : "at 6.5% for 30 years"}
            </p>
          </div>
          <hr className="dashed-divider my-3" />
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{locale === "ar" ? "مبلغ القرض" : "Loan Amount"}</p>
              <p className="font-semibold">{t("common.currency")}{Math.round(property.price * 0.8).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{locale === "ar" ? "الدفعة المقدمة" : "Down Payment"}</p>
              <p className="font-semibold">{t("common.currency")}{Math.round(property.price * 0.2).toLocaleString()}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full gap-2 mt-3"
            onClick={onNavigateCalculator}
          >
            <Calculator className="w-4 h-4" />
            {locale === "ar" ? "حاسبة الرهن العقاري" : "Full Calculator"}
          </Button>
        </section>

        {/* Inquiry Form — subtle */}
        <section className="border border-border/40 p-5 rounded-sm">
          <span className="editorial-label">{t("propertyDetail.requestInfo")}</span>
          <form onSubmit={onInquirySubmit} className="space-y-2.5 mt-3">
            <Input
              placeholder={t("propertyDetail.name")}
              value={inquiryForm.name}
              onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
              required
              className="h-9"
            />
            <Input
              type="email"
              placeholder={t("propertyDetail.email")}
              value={inquiryForm.email}
              onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
              required
              className="h-9"
            />
            <Input
              type="tel"
              placeholder={t("propertyDetail.phone")}
              value={inquiryForm.phone}
              onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
              className="h-9"
            />
            <Textarea
              placeholder={t("propertyDetail.message")}
              value={inquiryForm.message}
              onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
              rows={3}
              required
            />
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? t("common.loading") : t("propertyDetail.send")}
            </Button>
          </form>
        </section>
      </div>

      {/* ──── Similar Properties ──── */}
      {similarProperties.length > 0 && (
        <section className="mt-16">
          <span className="editorial-label">{t("common.properties")}</span>
          <h2 className="section-heading text-2xl font-bold mt-1 mb-6">{t("propertyDetail.similarProperties")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {similarProperties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
