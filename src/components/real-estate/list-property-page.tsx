"use client";

import { useI18n } from "@/lib/i18n/provider";
import { useRouter } from "@/lib/router";
import { motion } from "framer-motion";
import {
  Building2, DollarSign, Bed, Bath, Maximize, MapPin,
  Image as ImageIcon, Calendar, Car, CheckCircle, Loader2, ArrowLeft,
  FileText, Globe, Sparkles, Send, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";

interface FormData {
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: string;
  type: string;
  status: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  locationEn: string;
  locationAr: string;
  addressEn: string;
  addressAr: string;
  cityEn: string;
  cityAr: string;
  features: string;
  yearBuilt: string;
  parkingSpaces: string;
  imageUrls: string;
}

const initialFormData: FormData = {
  titleEn: "",
  titleAr: "",
  descriptionEn: "",
  descriptionAr: "",
  price: "",
  type: "",
  status: "",
  bedrooms: "",
  bathrooms: "",
  area: "",
  locationEn: "",
  locationAr: "",
  addressEn: "",
  addressAr: "",
  cityEn: "",
  cityAr: "",
  features: "",
  yearBuilt: "",
  parkingSpaces: "",
  imageUrls: "",
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function ListPropertyPage() {
  const { t, locale } = useI18n();
  const { navigate, back } = useRouter();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdId, setCreatedId] = useState<string>("");

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is edited
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.titleEn.trim()) newErrors.titleEn = "Required";
    if (!formData.titleAr.trim()) newErrors.titleAr = "Required";
    if (!formData.descriptionEn.trim()) newErrors.descriptionEn = "Required";
    if (!formData.descriptionAr.trim()) newErrors.descriptionAr = "Required";
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = "Required";
    if (!formData.type) newErrors.type = "Required";
    if (!formData.status) newErrors.status = "Required";
    if (!formData.bedrooms || parseInt(formData.bedrooms) < 0) newErrors.bedrooms = "Required";
    if (!formData.bathrooms || parseInt(formData.bathrooms) < 0) newErrors.bathrooms = "Required";
    if (!formData.area || parseFloat(formData.area) <= 0) newErrors.area = "Required";
    if (!formData.locationEn.trim()) newErrors.locationEn = "Required";
    if (!formData.locationAr.trim()) newErrors.locationAr = "Required";
    if (!formData.addressEn.trim()) newErrors.addressEn = "Required";
    if (!formData.addressAr.trim()) newErrors.addressAr = "Required";
    if (!formData.cityEn.trim()) newErrors.cityEn = "Required";
    if (!formData.cityAr.trim()) newErrors.cityAr = "Required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error(t("listProperty.pleaseFillRequired"));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        titleEn: formData.titleEn.trim(),
        titleAr: formData.titleAr.trim(),
        descriptionEn: formData.descriptionEn.trim(),
        descriptionAr: formData.descriptionAr.trim(),
        price: parseFloat(formData.price),
        type: formData.type,
        status: formData.status,
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        area: parseFloat(formData.area),
        locationEn: formData.locationEn.trim(),
        locationAr: formData.locationAr.trim(),
        addressEn: formData.addressEn.trim(),
        addressAr: formData.addressAr.trim(),
        cityEn: formData.cityEn.trim(),
        cityAr: formData.cityAr.trim(),
        features: formData.features.trim(),
        yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : null,
        parking: formData.parkingSpaces ? parseInt(formData.parkingSpaces) : 0,
        images: formData.imageUrls.trim(),
      };

      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create property");
      }

      const data = await res.json();
      setCreatedId(data.id);
      setSuccess(true);
      toast.success(t("listProperty.propertyListedSuccessfully"));
    } catch (err: any) {
      toast.error(err.message || "Failed to submit listing");
    } finally {
      setSubmitting(false);
    }
  };

  const handleListAnother = () => {
    setFormData(initialFormData);
    setErrors({});
    setSuccess(false);
    setCreatedId("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (success) {
    return (
      <div className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="max-w-lg mx-auto text-center"
          >
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="bg-primary p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.6, delay: 0.2 }}
                >
                  <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-primary-foreground" />
                  </div>
                </motion.div>
                <h2 className="text-2xl font-bold text-primary-foreground">{t("listProperty.successTitle")}</h2>
              </div>
              <CardContent className="p-8">
                <p className="text-muted-foreground mb-6 leading-relaxed">{t("listProperty.successDesc")}</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => navigate("property-detail", { id: createdId })}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    {t("listProperty.viewProperty")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleListAnother}
                    className="flex-1 gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    {t("listProperty.listAnother")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  const renderField = (
    field: keyof FormData,
    label: string,
    icon: React.ReactNode,
    type: string = "text",
    placeholder?: string
  ) => (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {label}
        <span className="text-destructive">*</span>
      </Label>
      {type === "textarea" ? (
        <Textarea
          value={formData[field]}
          onChange={(e) => updateField(field, e.target.value)}
          placeholder={placeholder || label}
          rows={3}
          className={`${errors[field] ? "border-destructive focus-visible:ring-destructive" : ""}`}
        />
      ) : (
        <Input
          type={type}
          value={formData[field]}
          onChange={(e) => updateField(field, e.target.value)}
          placeholder={placeholder || label}
          className={`${errors[field] ? "border-destructive focus-visible:ring-destructive" : ""}`}
        />
      )}
      {errors[field] && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-destructive" />
          {errors[field]}
        </p>
      )}
    </div>
  );

  return (
    <div className="py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back button */}
        <Button variant="ghost" onClick={back} className="mb-6 gap-2">
          <ArrowLeft className="w-4 h-4" />
          {t("common.back")}
        </Button>

        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg ">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{t("listProperty.title")}</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">{t("listProperty.subtitle")}</p>
          <div className="w-16 h-1 bg-primary mx-auto rounded-full mt-4" />
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ====== Basic Information ====== */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.1 }}>
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardHeader className="bg-primary/5 border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-primary" />
                  {t("listProperty.basicInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderField("titleEn", t("listProperty.titleEn"), <Globe className="w-3.5 h-3.5 text-blue-500" />)}
                  {renderField("titleAr", t("listProperty.titleAr"), <Globe className="w-3.5 h-3.5 text-primary" />)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderField("descriptionEn", t("listProperty.descriptionEn"), <Globe className="w-3.5 h-3.5 text-blue-500" />, "textarea")}
                  {renderField("descriptionAr", t("listProperty.descriptionAr"), <Globe className="w-3.5 h-3.5 text-primary" />, "textarea")}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ====== Property Details ====== */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.2 }}>
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardHeader className="bg-primary/5 border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="w-5 h-5 text-primary" />
                  {t("listProperty.propertyDetails")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderField("price", t("listProperty.price"), <DollarSign className="w-3.5 h-3.5 text-primary" />, "number")}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <Building2 className="w-3.5 h-3.5 text-primary" />
                      {t("listProperty.propertyType")}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Select value={formData.type} onValueChange={(v) => updateField("type", v)}>
                      <SelectTrigger className={`${errors.type ? "border-destructive" : ""}`}>
                        <SelectValue placeholder={t("listProperty.propertyType")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="apartment">{t("properties.apartment")}</SelectItem>
                        <SelectItem value="villa">{t("properties.villa")}</SelectItem>
                        <SelectItem value="house">{t("properties.house")}</SelectItem>
                        <SelectItem value="condo">{t("properties.condo")}</SelectItem>
                        <SelectItem value="townhouse">{t("properties.townhouse")}</SelectItem>
                        <SelectItem value="penthouse">{t("properties.penthouse")}</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.type && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-destructive" />
                        {errors.type}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <Badge variant="outline" className="w-3.5 h-3.5 p-0 flex items-center justify-center text-[8px]">S</Badge>
                      {t("listProperty.status")}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Select value={formData.status} onValueChange={(v) => updateField("status", v)}>
                      <SelectTrigger className={`${errors.status ? "border-destructive" : ""}`}>
                        <SelectValue placeholder={t("listProperty.status")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sale">{t("common.forSale")}</SelectItem>
                        <SelectItem value="rent">{t("common.forRent")}</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.status && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-destructive" />
                        {errors.status}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {renderField("bedrooms", t("listProperty.bedrooms"), <Bed className="w-3.5 h-3.5 text-blue-500" />, "number")}
                    {renderField("bathrooms", t("listProperty.bathrooms"), <Bath className="w-3.5 h-3.5 text-cyan-500" />, "number")}
                    {renderField("area", t("listProperty.area"), <Maximize className="w-3.5 h-3.5 text-primary" />, "number")}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ====== Location Information ====== */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.3 }}>
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-rose-50 to-amber-50 dark:from-rose-950/30 dark:to-amber-950/20 border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="w-5 h-5 text-rose-500" />
                  {t("listProperty.locationInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderField("locationEn", t("listProperty.locationEn"), <Globe className="w-3.5 h-3.5 text-blue-500" />)}
                  {renderField("locationAr", t("listProperty.locationAr"), <Globe className="w-3.5 h-3.5 text-primary" />)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderField("addressEn", t("listProperty.addressEn"), <Globe className="w-3.5 h-3.5 text-blue-500" />)}
                  {renderField("addressAr", t("listProperty.addressAr"), <Globe className="w-3.5 h-3.5 text-primary" />)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderField("cityEn", t("listProperty.cityEn"), <Globe className="w-3.5 h-3.5 text-blue-500" />)}
                  {renderField("cityAr", t("listProperty.cityAr"), <Globe className="w-3.5 h-3.5 text-primary" />)}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ====== Media ====== */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.4 }}>
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20 border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ImageIcon className="w-5 h-5 text-violet-500" />
                  {t("listProperty.mediaInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <ImageIcon className="w-3.5 h-3.5 text-violet-500" />
                    {t("listProperty.imageUrls")}
                  </Label>
                  <Textarea
                    value={formData.imageUrls}
                    onChange={(e) => updateField("imageUrls", e.target.value)}
                    placeholder={t("listProperty.imageUrls")}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("listProperty.imageUrlsHelper")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ====== Additional Information ====== */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.5 }}>
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  {t("listProperty.additionalInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle className="w-3.5 h-3.5 text-amber-500" />
                    {t("listProperty.features")}
                  </Label>
                  <Textarea
                    value={formData.features}
                    onChange={(e) => updateField("features", e.target.value)}
                    placeholder={t("listProperty.featuresPlaceholder")}
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("listProperty.featuresHelper")}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderField("yearBuilt", t("listProperty.yearBuilt"), <Calendar className="w-3.5 h-3.5 text-amber-500" />, "number")}
                  {renderField("parkingSpaces", t("listProperty.parkingSpaces"), <Car className="w-3.5 h-3.5 text-gray-500" />, "number")}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Submit Button */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.6 }}>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-primary  shadow-lg  gap-2 h-12 text-base"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t("common.loading")}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {t("listProperty.submitListing")}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={back}
                className="sm:w-40 h-12"
              >
                {t("common.cancel")}
              </Button>
            </div>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
