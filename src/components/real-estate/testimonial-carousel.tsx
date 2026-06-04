"use client";

import { useI18n } from "@/lib/i18n/provider";
import { Star, Quote } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";

interface Testimonial {
  id: string;
  authorEn: string;
  authorAr: string;
  roleEn: string;
  roleAr: string;
  contentEn: string;
  contentAr: string;
  rating: number;
  avatar: string;
  featured: boolean;
  sortOrder: number;
}

export function TestimonialCarousel() {
  const { t, locale } = useI18n();
  const [api, setApi] = useState<any>(null);
  const [current, setCurrent] = useState(0);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const res = await fetch("/api/testimonials");
        if (res.ok) {
          const data = await res.json();
          setTestimonials(data.testimonials || []);
        } else {
          setTestimonials([]);
        }
      } catch {
        setTestimonials([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTestimonials();
  }, []);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    onSelect();
    return () => { api.off("select", onSelect); };
  }, [api]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="h-full border-0 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex items-center gap-3 pt-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!loading && testimonials.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <Quote className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">
          {t("testimonials.noTestimonials") || "No testimonials available yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Carousel
        setApi={setApi}
        opts={{ align: "start", loop: testimonials.length > 1 }}
        className="w-full"
      >
        <CarouselContent>
          {testimonials.map((testimonial, idx) => (
            <CarouselItem key={testimonial.id || idx} className="md:basis-1/2 lg:basis-1/2">
              <Card className="h-full border border-border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card">
                <CardContent className="p-6">
                  <Quote className="w-8 h-8 text-[var(--gold)]/25 mb-4" />
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-4">
                    {locale === "ar" ? testimonial.contentAr : testimonial.contentEn}
                  </p>
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < testimonial.rating ? "fill-amber-400 text-amber-400" : "text-muted"}`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-3 pt-3 border-t border-border/50">
                    <img
                      src={testimonial.avatar}
                      alt={locale === "ar" ? testimonial.authorAr : testimonial.authorEn}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-background shadow-sm"
                    />
                    <div>
                      <p className="text-sm font-semibold">
                        {locale === "ar" ? testimonial.authorAr : testimonial.authorEn}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {locale === "ar" ? testimonial.roleAr : testimonial.roleEn}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex -left-12" />
        <CarouselNext className="hidden sm:flex -right-12" />
      </Carousel>

      {/* Navigation Dots */}
      <div className="flex items-center justify-center gap-2 mt-6">
        {testimonials.map((_, idx) => (
          <button
            key={idx}
            onClick={() => api?.scrollTo(idx)}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === current
                ? "w-6 bg-[var(--gold)]"
                : "w-2 bg-muted hover:bg-muted-foreground/30"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
