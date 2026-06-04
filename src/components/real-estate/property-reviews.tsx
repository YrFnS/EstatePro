"use client";

import { useI18n } from "@/lib/i18n/provider";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MessageSquare, User, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface Review {
  id: string;
  propertyId: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

interface ReviewData {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

interface PropertyReviewsProps {
  propertyId: string;
}

function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-3.5 h-3.5",
    md: "w-4.5 h-4.5",
    lg: "w-6 h-6",
  };

  return (
    <div className="star-rating">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`${sizeClasses[size]} ${
            i < Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

function StarSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="star-rating">
      {Array.from({ length: 5 }, (_, i) => {
        const starValue = i + 1;
        return (
          <button
            key={i}
            type="button"
            className="star"
            onMouseEnter={() => setHovered(starValue)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(starValue)}
          >
            <Star
              className={`w-7 h-7 transition-colors ${
                starValue <= (hovered || value)
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/30 hover:text-amber-300"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

export function PropertyReviews({ propertyId }: PropertyReviewsProps) {
  const { t, locale } = useI18n();
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    authorName: "",
    rating: 5,
    comment: "",
  });

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews?propertyId=${propertyId}`);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.authorName.trim()) {
      toast.error(
        t("reviews.authorNameRequired")
      );
      return;
    }
    if (!form.comment.trim()) {
      toast.error(
        t("reviews.commentRequired")
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          authorName: form.authorName.trim(),
          rating: form.rating,
          comment: form.comment.trim(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to submit review");
      }

      toast.success(t("reviews.successMessage"));
      setForm({ authorName: "", rating: 5, comment: "" });
      setShowForm(false);
      fetchReviews();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error(
        t("reviews.failedSubmit")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(
      locale === "ar" ? "ar-SA" : "en-US",
      { year: "numeric", month: "long", day: "numeric" }
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Rating distribution for visual bar
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => {
    const count =
      data?.reviews.filter((r) => Math.round(r.rating) === star).length || 0;
    const percentage = data && data.totalReviews > 0 ? (count / data.totalReviews) * 100 : 0;
    return { star, count, percentage };
  });

  if (loading) {
    return (
      <div className="mt-12">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-48 rounded-xl" />
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            {t("reviews.title")}
          </h2>
          <p className="text-muted-foreground mt-1">{t("reviews.subtitle")}</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="gap-2 shrink-0"
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" />
              {t("common.cancel")}
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              {t("reviews.writeReview")}
            </>
          )}
        </Button>
      </motion.div>

      {/* Review Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mb-6"
          >
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  {t("reviews.writeReview")}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">
                        {t("reviews.authorName")}
                      </label>
                      <Input
                        placeholder={t("reviews.enterYourName")}
                        value={form.authorName}
                        onChange={(e) =>
                          setForm({ ...form, authorName: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">
                        {t("reviews.rating")}
                      </label>
                      <div className="flex items-center gap-3 mt-1">
                        <StarSelector
                          value={form.rating}
                          onChange={(rating) => setForm({ ...form, rating })}
                        />
                        <span className="text-sm text-muted-foreground font-medium">
                          {form.rating}/5
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      {t("reviews.comment")}
                    </label>
                    <Textarea
                      placeholder={t("reviews.shareExperience")}
                      value={form.comment}
                      onChange={(e) =>
                        setForm({ ...form, comment: e.target.value })
                      }
                      rows={4}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting
                        ? t("common.loading")
                        : t("reviews.submit")}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {data && data.totalReviews === 0 && !showForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {t("reviews.emptyTitle")}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-4">
                {t("reviews.emptyDesc")}
              </p>
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                {t("reviews.writeReview")}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Reviews Content */}
      {data && data.totalReviews > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rating Summary */}
          <motion.div
            initial={{ opacity: 0, x: locale === "ar" ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <p className="text-sm text-muted-foreground mb-1">
                    {t("reviews.averageRating")}
                  </p>
                  <p className="text-5xl font-bold text-primary">
                    {data.averageRating}
                  </p>
                  <StarDisplay rating={data.averageRating} size="lg" />
                  <p className="text-sm text-muted-foreground mt-2">
                    {t("reviews.totalReviews", { count: data.totalReviews })}{" "}
                    · {t("reviews.outOf5")}
                  </p>
                </div>
                <Separator className="mb-4" />
                {/* Rating Distribution */}
                <div className="space-y-2.5">
                  {ratingDistribution.map(({ star, count, percentage }) => (
                    <div
                      key={star}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className="w-8 text-end font-medium">
                        {star}
                        <Star className="w-3 h-3 inline-block ms-0.5 fill-amber-400 text-amber-400" />
                      </span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.6, delay: 0.1 * star }}
                        />
                      </div>
                      <span className="w-8 text-muted-foreground text-xs">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pe-1">
            <AnimatePresence>
              {data.reviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="card-shine">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10 border border-primary/20">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                            {getInitials(review.authorName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">
                                {review.authorName}
                              </span>
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary"
                              >
                                {t("reviews.verified")}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <StarDisplay rating={review.rating} size="sm" />
                            <span className="text-xs text-muted-foreground font-medium">
                              {review.rating}.0
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                            {review.comment}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
