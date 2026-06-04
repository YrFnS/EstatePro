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
  Search,
  Building2,
  Key,
  Gem,
  MessageSquare,
  Eye,
  Filter,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
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

const specializationColors: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  residential: {
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary/20",
    gradient: "bg-primary",
  },
  commercial: {
    bg: "bg-sky-500/10",
    text: "text-sky-600 dark:text-sky-400",
    border: "border-sky-500/20",
    gradient: "from-sky-500 to-blue-700",
  },
  rentals: {
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20",
    gradient: "from-amber-500 to-orange-600",
  },
  luxury: {
    bg: "bg-violet-500/10",
    text: "text-violet-600 dark:text-violet-400",
    border: "border-violet-500/20",
    gradient: "from-violet-500 to-purple-700",
  },
};

type SpecializationFilter = "all" | "residential" | "commercial" | "rentals" | "luxury";

const filterOptions: { key: SpecializationFilter; labelKey: string; icon: typeof Home }[] = [
  { key: "all", labelKey: "agents.allSpecializations", icon: Filter },
  { key: "residential", labelKey: "agents.salesResidential", icon: Home },
  { key: "commercial", labelKey: "agents.salesCommercial", icon: Building2 },
  { key: "rentals", labelKey: "agents.rentals", icon: Key },
  { key: "luxury", labelKey: "agents.luxury", icon: Gem },
];

export function AgentsPage() {
  const { t, locale, dir } = useI18n();
  const { navigate } = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<SpecializationFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch("/api/agents");
        const data = await res.json();
        setAgents(data.agents || []);
      } catch {
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, []);

  const filteredAgents = useMemo(() => {
    let result = agents;

    if (activeFilter !== "all") {
      result = result.filter((a) => a.specialization === activeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.nameEn.toLowerCase().includes(q) ||
          a.nameAr.includes(searchQuery) ||
          a.titleEn.toLowerCase().includes(q) ||
          a.titleAr.includes(searchQuery)
      );
    }

    return result;
  }, [agents, activeFilter, searchQuery]);

  const getAgentName = (agent: Agent) => (locale === "ar" ? agent.nameAr : agent.nameEn);
  const getAgentTitle = (agent: Agent) => (locale === "ar" ? agent.titleAr : agent.titleEn);
  const getAgentBio = (agent: Agent) => (locale === "ar" ? agent.bioAr : agent.bioEn);

  return (
    <div className="py-8 md:py-12" dir={dir}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-xs uppercase tracking-widest">
            <Award className="w-3.5 h-3.5 me-1.5" />
            {t("agents.specialization")}
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{t("agents.title")}</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t("agents.subtitle")}</p>
        </motion.div>

        {/* Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          {/* Specialization Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              {t("agents.filterBy")}:
            </span>
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((opt) => {
                const isActive = activeFilter === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setActiveFilter(opt.key)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                        : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-primary"
                    }`}
                  >
                    <opt.icon className="w-3.5 h-3.5" />
                    {t(`agents.${opt.labelKey.split(".")[1]}`)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Input */}
          <div className="relative max-w-md">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("agents.searchAgents")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-10 h-11 bg-card border-border focus-visible:border-primary"
            />
          </div>
        </motion.div>

        {/* Results Count */}
        {!loading && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              {t("agents.agentsFound", { count: filteredAgents.length })}
            </p>
          </div>
        )}

        {/* Agents Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-52 w-full" />
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                  <Skeleton className="h-8 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAgents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredAgents.map((agent, idx) => {
                const specColors = specializationColors[agent.specialization] || specializationColors.residential;
                const SpecIcon = specializationIcons[agent.specialization] || Home;

                return (
                  <motion.div
                    key={agent.id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ delay: idx * 0.05, duration: 0.3 }}
                  >
                    <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col">
                      {/* Card Header with Gradient + Overlay Pattern */}
                      <div className={`relative h-52 ${specColors.gradient} flex items-end`}>
                        {/* Overlay Pattern */}
                        <div
                          className="absolute inset-0 opacity-10"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                          }}
                        />
                        {/* Decorative circles */}
                        <div className="absolute top-4 end-4 w-20 h-20 rounded-full bg-white/5" />
                        <div className="absolute top-8 end-8 w-10 h-10 rounded-full bg-white/5" />

                        {/* Specialization Badge */}
                        <div className="absolute top-4 start-4">
                          <Badge className="bg-white/20 text-primary-foreground border-white/30 backdrop-blur-sm gap-1">
                            <SpecIcon className="w-3 h-3" />
                            {t(`agents.${specializationMap[agent.specialization] || agent.specialization}`)}
                          </Badge>
                        </div>

                        {/* Agent Image */}
                        <div className="relative mx-auto mb-4 mt-6">
                          <div className="w-28 h-28 rounded-full border-4 border-white/30 overflow-hidden shadow-xl group-hover:scale-105 transition-transform duration-500">
                            <img
                              src={
                                agent.image ||
                                `https://placehold.co/200x200/e2e8f0/64748b?text=${encodeURIComponent(getAgentName(agent))}`
                              }
                              alt={getAgentName(agent)}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      </div>

                      <CardContent className="p-5 flex-1 flex flex-col">
                        {/* Name & Title */}
                        <div className="text-center mb-3">
                          <h3 className="text-lg font-bold mb-1">{getAgentName(agent)}</h3>
                          <p className="text-sm text-muted-foreground">{getAgentTitle(agent)}</p>
                        </div>

                        {/* Bio - Truncated */}
                        {getAgentBio(agent) && (
                          <p className="text-sm text-muted-foreground/80 line-clamp-2 text-center mb-3 leading-relaxed">
                            {getAgentBio(agent)}
                          </p>
                        )}

                        {/* Rating */}
                        <div className="flex items-center justify-center gap-1 mb-3">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.round(agent.rating)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                          <span className="text-sm text-muted-foreground ms-1.5 font-medium">
                            ({agent.rating.toFixed(1)})
                          </span>
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center justify-center gap-4 mb-4 text-sm">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Briefcase className="w-3.5 h-3.5 text-primary" />
                            <span className="font-semibold text-foreground">{agent.experience}</span>{" "}
                            {t("agents.yearsExperience")}
                          </span>
                          <span className="w-px h-4 bg-border" />
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Home className="w-3.5 h-3.5 text-primary" />
                            <span className="font-semibold text-foreground">{agent.propertiesCount}</span>{" "}
                            {t("agents.properties")}
                          </span>
                        </div>

                        {/* Contact Buttons */}
                        <div className="mt-auto space-y-2.5">
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 h-9"
                              onClick={() => {
                                window.location.href = `mailto:${agent.email}`;
                              }}
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span className="truncate">{t("contact.emailLabel")}</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 h-9"
                              onClick={() => {
                                window.location.href = `tel:${agent.phone}`;
                              }}
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span className="truncate">{t("contact.phoneLabel")}</span>
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 h-9"
                              onClick={() => {
                                navigate("contact");
                              }}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span className="truncate">{t("agents.sendMessage")}</span>
                            </Button>
                            <Button
                              size="sm"
                              className="gap-1.5 h-9 bg-primary  border-0 shadow-md "
                              onClick={() => {
                                navigate("agent-detail", { id: agent.id });
                                toast.success(
                                  locale === "ar"
                                    ? `ملف ${getAgentName(agent)}`
                                    : `Viewing ${getAgentName(agent)}'s profile`
                                );
                              }}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="truncate">{t("agents.viewProperties")}</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-muted-foreground mb-2">{t("common.noResults")}</p>
            <p className="text-sm text-muted-foreground/60 mb-4">
              {locale === "ar"
                ? "حاول تعديل البحث أو التصفية"
                : "Try adjusting your search or filters"}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setActiveFilter("all");
              }}
            >
              {t("properties.clearFilters")}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
