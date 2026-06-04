"use client";

import { useI18n } from "@/lib/i18n/provider";
import { useRouter } from "@/lib/router";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Mail,
  Phone,
  Award,
  Briefcase,
  Home,
  Building2,
  Key,
  Gem,
  Clock,
  Heart,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Globe,
  CheckCircle2,
  ArrowLeft,
  Send,
  User,
  ThumbsUp,
  Timer,
  MessageCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyCard } from "@/components/real-estate/property-card";
import { toast } from "sonner";

interface Agent {
  id: string;
  nameEn: string;
  nameAr: string;
  titleEn: string;
  titleAr: string;
  bioEn: string;
  bioAr: string;
  email: string;
  phone: string;
  image: string;
  specialization: string;
  experience: number;
  propertiesCount: number;
  rating: number;
}

import type { Property } from "@/components/real-estate/types/property";

const specializationMap: Record<string, string> = {
  residential: "salesResidential",
  commercial: "salesCommercial",
  rentals: "rentals",
  luxury: "luxury",
};

const specializationIcons: Record<string, typeof Home> = {
  residential: Home,
  commercial: Building2,
  rentals: Key,
  luxury: Gem,
};

const specializationColors: Record<string, { gradient: string; bg: string; text: string }> = {
  residential: {
    gradient: "bg-primary",
    bg: "bg-primary/10",
    text: "text-primary",
  },
  commercial: {
    gradient: "from-sky-500 to-blue-700",
    bg: "bg-sky-500/10",
    text: "text-sky-600 dark:text-sky-400",
  },
  rentals: {
    gradient: "from-amber-500 to-orange-600",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
  },
  luxury: {
    gradient: "from-violet-500 to-purple-700",
    bg: "bg-violet-500/10",
    text: "text-violet-600 dark:text-violet-400",
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function AgentDetailPage() {
  const { t, locale, dir } = useI18n();
  const { params, navigate, back } = useRouter();
  const agentId = params.id;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [sendingInquiry, setSendingInquiry] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const res = await fetch("/api/agents");
        const data = await res.json();
        const found = (data.agents || []).find((a: Agent) => a.id === agentId);
        setAgent(found || null);
      } catch {
        setAgent(null);
      }
    };
    const fetchProperties = async () => {
      try {
        const res = await fetch(`/api/properties?agentId=${agentId}&limit=50`);
        const data = await res.json();
        setProperties(data.properties || []);
      } catch {
        setProperties([]);
      }
    };
    Promise.all([fetchAgent(), fetchProperties()]).finally(() => setLoading(false));
  }, [agentId]);

  const getAgentName = (a: Agent) => (locale === "ar" ? a.nameAr : a.nameEn);
  const getAgentTitle = (a: Agent) => (locale === "ar" ? a.titleAr : a.titleEn);
  const getAgentBio = (a: Agent) => (locale === "ar" ? a.bioAr : a.bioEn);

  const specColors = agent
    ? specializationColors[agent.specialization] || specializationColors.residential
    : specializationColors.residential;
  const SpecIcon = agent
    ? specializationIcons[agent.specialization] || Home
    : Home;

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error(t("agents.pleaseFillRequired"));
      return;
    }
    setSendingInquiry(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...contactForm,
          propertyId: null,
        }),
      });
      if (res.ok) {
        toast.success(t("contact.successMessage"));
        setContactForm({ name: "", email: "", phone: "", message: "" });
      } else {
        toast.error(t("agents.failedSendMessage"));
      }
    } catch {
      toast.error(t("agents.failedSendMessage"));
    } finally {
      setSendingInquiry(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8 md:py-12" dir={dir}>
        <div className="container mx-auto px-4 space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-80 lg:col-span-2 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="py-20" dir={dir}>
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <User className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {t("agents.notFound")}
            </h2>
            <p className="text-muted-foreground mb-6">
              {t("agents.notFoundDesc")}
            </p>
            <Button onClick={() => navigate("agents")} className="bg-primary  border-0">
              <ArrowLeft className="w-4 h-4 me-2" />
              {t("agents.title")}
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  const bioText = getAgentBio(agent);
  const isBioLong = bioText && bioText.length > 200;
  const displayedBio = bioExpanded || !isBioLong ? bioText : bioText.slice(0, 200) + "...";

  return (
    <div className="pb-12" dir={dir}>
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`relative overflow-hidden ${specColors.gradient}`}
      >
        {/* Decorative pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        {/* Decorative circles */}
        <div className="absolute top-10 end-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute bottom-5 start-5 w-24 h-24 rounded-full bg-white/5" />
        <div className="absolute top-20 end-40 w-16 h-16 rounded-full bg-white/5" />

        <div className="relative container mx-auto px-4 py-12 md:py-16">
          {/* Back button */}
          <Button
            variant="ghost"
            className="text-white/80 hover:text-white hover:bg-white/10 mb-6"
            onClick={back}
          >
            <ArrowLeft className="w-4 h-4 me-2" />
            {t("common.back")}
          </Button>

          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Agent Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="shrink-0"
            >
              <div className="w-36 h-36 md:w-44 md:h-44 rounded-full border-4 border-white/30 overflow-hidden shadow-2xl">
                <img
                  src={
                    agent.image ||
                    `https://placehold.co/400x400/e2e8f0/64748b?text=${encodeURIComponent(getAgentName(agent))}`
                  }
                  alt={getAgentName(agent)}
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>

            {/* Agent Info */}
            <motion.div
              initial={{ opacity: 0, x: dir === "rtl" ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-center md:text-start flex-1"
            >
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
                {/* Availability Badge */}
                <Badge className="bg-primary text-primary-foreground border-primary gap-1.5 px-3">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t("agentDetail.available")}
                </Badge>
                {/* Specialization Badge */}
                <Badge className="bg-white/20 text-primary-foreground border-white/30 backdrop-blur-sm gap-1.5 px-3">
                  <SpecIcon className="w-3.5 h-3.5" />
                  {t(`agents.${specializationMap[agent.specialization] || agent.specialization}`)}
                </Badge>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
                {getAgentName(agent)}
              </h1>
              <p className="text-lg text-primary-foreground/80 mb-4">{getAgentTitle(agent)}</p>

              {/* Rating */}
              <div className="flex items-center justify-center md:justify-start gap-2">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.round(agent.rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-white/30"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-white/90 font-medium">
                  {agent.rating.toFixed(1)}
                </span>
                <span className="text-white/60 text-sm">
                  ({t("agentDetail.reviews")})
                </span>
              </div>

              {/* Quick contact */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-5">
                <Button
                  size="sm"
                  className="bg-white/20 text-primary-foreground border-white/30 backdrop-blur-sm hover:bg-white/30 gap-1.5"
                  onClick={() => {
                    window.location.href = `mailto:${agent.email}`;
                  }}
                >
                  <Mail className="w-4 h-4" />
                  {t("agentDetail.sendEmail")}
                </Button>
                <Button
                  size="sm"
                  className="bg-white/20 text-primary-foreground border-white/30 backdrop-blur-sm hover:bg-white/30 gap-1.5"
                  onClick={() => {
                    window.location.href = `tel:${agent.phone}`;
                  }}
                >
                  <Phone className="w-4 h-4" />
                  {t("agentDetail.callAgent")}
                </Button>
                <Button
                  size="sm"
                  className="bg-white/20 text-primary-foreground border-white/30 backdrop-blur-sm hover:bg-white/30 gap-1.5"
                  onClick={() => navigate("messaging", { agentId: agent.id })}
                >
                  <MessageCircle className="w-4 h-4" />
                  {t("messaging.messageAgent")}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-4">
        {/* Stats Row */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.08 } },
          }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 -mt-8 relative z-10 mb-8"
        >
          {[
            {
              icon: Briefcase,
              label: t("agentDetail.experience"),
              value: `${agent.experience} ${t("agentDetail.years")}`,
              color: "text-primary",
              bgColor: "bg-primary/10",
            },
            {
              icon: Home,
              label: t("agentDetail.propertiesSold"),
              value: agent.propertiesCount.toString(),
              color: "text-primary",
              bgColor: "bg-primary/10",
            },
            {
              icon: ThumbsUp,
              label: t("agentDetail.clientSatisfaction"),
              value: t("agents.na"),
              color: "text-amber-500",
              bgColor: "bg-amber-500/10",
            },
            {
              icon: Timer,
              label: t("agentDetail.responseTime"),
              value: t("agents.na"),
              color: "text-sky-500",
              bgColor: "bg-sky-500/10",
            },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              variants={fadeUp}
              transition={{ duration: 0.3 }}
            >
              <Card className="text-center shadow-lg border-0 bg-card/80 backdrop-blur-sm hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-4 md:p-5">
                  <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center mx-auto mb-3`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="text-2xl font-bold mb-1">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content: About + Contact Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* About Section */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="shadow-md border-0">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <User className="w-5 h-5 text-primary" />
                  {t("agentDetail.about")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {displayedBio}
                </p>
                {isBioLong && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary gap-1 px-0 hover:bg-transparent"
                    onClick={() => setBioExpanded(!bioExpanded)}
                  >
                    {bioExpanded ? t("common.readMore") : t("common.readMore")}
                    {bioExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                )}

                <Separator className="my-5" />

                {/* Languages — not available from API */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" />
                    {t("agentDetail.languages")}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t("agents.languageDataNotAvailable")}
                  </p>
                </div>

                <Separator className="my-5" />

                {/* Quick Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        {t("agentDetail.specialization")}
                      </div>
                      <div className="font-medium text-sm">
                        {t(`agents.${specializationMap[agent.specialization] || agent.specialization}`)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Star className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        {t("agentDetail.rating")}
                      </div>
                      <div className="font-medium text-sm">
                        {agent.rating.toFixed(1)} / 5.0
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <Card className="shadow-md border-0 sticky top-24">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  {t("agentDetail.contactAgent")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      {t("contact.name")} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder={t("agents.enterYourName")}
                      className="h-10"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      {t("contact.email")} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder={t("agents.enterYourEmail")}
                      className="h-10"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      {t("contact.phone")}
                    </label>
                    <Input
                      type="tel"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      placeholder={t("agents.enterYourPhone")}
                      className="h-10"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      {t("contact.message")} <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder={t("agents.enterYourMessage")}
                      rows={4}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-primary  border-0 shadow-md  gap-2"
                    disabled={sendingInquiry}
                  >
                    {sendingInquiry ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {t("contact.send")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Agent Properties */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Home className="w-6 h-6 text-primary" />
                {t("agentDetail.agentProperties")}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {properties.length}{" "}
                {t("agents.propertiesCount")}
              </p>
            </div>
          </div>

          {properties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {properties.map((property, idx) => (
                  <motion.div
                    key={property.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: idx * 0.05, duration: 0.3 }}
                  >
                    <PropertyCard property={property} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Home className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {t("agentDetail.noProperties")}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("agents.noPropertiesDesc")}
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate("properties")}
                >
                  {t("common.browsePropertiesNow")}
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
