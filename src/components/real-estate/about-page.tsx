"use client";

import { useI18n } from "@/lib/i18n/provider";
import { motion } from "framer-motion";
import {
  Eye,
  Lightbulb,
  Heart,
  Target,
  Award,
  Globe,
  Play,
  Users,
  Building2,
  TrendingUp,
  Rocket,
  Sparkles,
  Quote,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState, useRef } from "react";

/* ─── Icon name → component mapping ─── */
const ICON_MAP: Record<string, LucideIcon> = {
  Building2,
  TrendingUp,
  Award,
  Rocket,
  Globe,
  Eye,
  Lightbulb,
  Heart,
  Target,
  Users,
  Sparkles,
};

/* ─── Types ─── */
interface MilestoneData {
  year: string;
  text: string;
  icon: LucideIcon;
  color: string;
}

interface TeamMemberData {
  id: string;
  name: string;
  initials: string;
  title: string;
  bio: string;
  image: string;
  specialization: string;
  experience: number;
  propertiesCount: number;
  rating: number;
  gradient: string;
}

interface PartnerData {
  name: string;
  initials: string;
  gradient: string;
}

interface TeamStat {
  label: string;
  value: number;
  suffix: string;
}

interface SettingsMap {
  [key: string]: { valueEn: string; valueAr: string; category: string; type: string };
}

interface AgentResponse {
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

/* ─── Helper: get locale-aware value from settings ─── */
function getSettingValue(settings: SettingsMap, key: string, locale: string): string {
  const entry = settings[key];
  if (!entry) return "";
  return locale === "ar" && entry.valueAr ? entry.valueAr : entry.valueEn;
}

/* ─── Parse milestones from settings ─── */
function parseMilestones(settings: SettingsMap, locale: string): MilestoneData[] {
  const milestones: MilestoneData[] = [];
  let i = 1;
  while (true) {
    const yearKey = `about.milestone${i}Year`;
    const textKey = `about.milestone${i}Text`;
    const iconKey = `about.milestone${i}Icon`;
    if (!settings[yearKey]) break;
    const year = getSettingValue(settings, yearKey, locale);
    const text = getSettingValue(settings, textKey, locale);
    const iconName = getSettingValue(settings, iconKey, "en"); // icon names are locale-independent
    const icon = ICON_MAP[iconName] || Building2;
    milestones.push({ year, text, icon, color: "bg-primary" });
    i++;
  }
  return milestones;
}

/* ─── Parse partners from settings ─── */
function parsePartners(settings: SettingsMap, locale: string): PartnerData[] {
  const partners: PartnerData[] = [];
  let i = 1;
  while (true) {
    const nameKey = `about.partner${i}Name`;
    if (!settings[nameKey]) break;
    const name = getSettingValue(settings, nameKey, locale);
    const initials = name
      .split(" ")
      .filter((w: string) => w.length > 0)
      .map((w: string) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    partners.push({ name, initials, gradient: "bg-primary" });
    i++;
  }
  return partners;
}

/* ─── Parse team stats from settings ─── */
function parseTeamStats(settings: SettingsMap, locale: string, agentCount: number, t: (key: string) => string): TeamStat[] {
  const teamMembers = parseInt(getSettingValue(settings, "about.statsTeamMembers", locale)) || 150;
  const expertAgents = parseInt(getSettingValue(settings, "stats.expertAgents", locale)) || agentCount;
  const offices = parseInt(getSettingValue(settings, "about.statsOffices", locale)) || 12;
  const countries = parseInt(getSettingValue(settings, "about.statsCountries", locale)) || 5;
  return [
    { label: t("about.teamMembers"), value: teamMembers, suffix: "+" },
    { label: t("about.expertAgents"), value: expertAgents, suffix: "+" },
    { label: t("about.offices"), value: offices, suffix: "" },
    { label: t("about.countries"), value: countries, suffix: "" },
  ];
}

/* ─── Map agents to team member data ─── */
function mapAgentToMember(agent: AgentResponse, locale: string): TeamMemberData {
  const name = locale === "ar" && agent.nameAr ? agent.nameAr : agent.nameEn;
  const title = locale === "ar" && agent.titleAr ? agent.titleAr : agent.titleEn;
  const bio = locale === "ar" && agent.bioAr ? agent.bioAr : agent.bioEn;
  const initials = name
    .split(" ")
    .filter((w) => w.length > 0)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return {
    id: agent.id,
    name,
    initials,
    title,
    bio,
    image: agent.image,
    specialization: agent.specialization,
    experience: agent.experience,
    propertiesCount: agent.propertiesCount,
    rating: agent.rating,
    gradient: "bg-primary",
  };
}

/* ─── Animated counter ─── */
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 2000;
          const startTime = performance.now();
          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, hasAnimated]);

  return (
    <div ref={ref} className="text-3xl md:text-4xl font-bold text-primary">
      {count}
      {suffix}
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
};

/* ─── Timeline item with scroll-triggered reveal ─── */
function TimelineItem({ milestone, idx, isEven }: { milestone: MilestoneData; idx: number; isEven: boolean }) {
  const itemRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );
    if (itemRef.current) observer.observe(itemRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      ref={itemRef}
      key={idx}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      variants={fadeUp}
      transition={{ delay: idx * 0.15 }}
      className={`relative flex items-center gap-6 timeline-reveal ${isVisible ? "visible" : ""} ${
        isEven ? "md:flex-row" : "md:flex-row-reverse"
      }`}
    >
      {/* Content Card - Desktop */}
      <div className={`flex-1 hidden md:block ${isEven ? "text-end" : "text-start"}`}>
        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 inline-block max-w-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2" style={{ justifyContent: isEven ? "flex-end" : "flex-start" }}>
              <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${milestone.color} text-primary-foreground shadow-sm`}>
                <milestone.icon className="w-4 h-4" />
              </div>
              <span className="text-2xl font-bold text-primary">{milestone.year}</span>
            </div>
            <p className="text-muted-foreground text-sm">{milestone.text}</p>
          </CardContent>
        </Card>
      </div>

      {/* Center Dot - Desktop */}
      <div className="hidden md:flex items-center justify-center w-10 shrink-0 relative z-10">
        <div className="w-4 h-4 rounded-full bg-primary ring-4 ring-background shadow-md" />
      </div>

      {/* Spacer for the other side - Desktop */}
      <div className="flex-1 hidden md:block" />

      {/* Mobile Layout */}
      <div className="md:hidden flex items-start gap-4 ps-2">
        <div className="flex flex-col items-center shrink-0">
          <div className="w-4 h-4 rounded-full bg-primary ring-4 ring-background shadow-md z-10" />
        </div>
        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 flex-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-1.5">
              <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${milestone.color} text-primary-foreground shadow-sm`}>
                <milestone.icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-xl font-bold text-primary">{milestone.year}</span>
            </div>
            <p className="text-muted-foreground text-sm">{milestone.text}</p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

/* ─── Loading skeleton sections ─── */
function SectionSkeleton({ className }: { className?: string }) {
  return (
    <section className={`py-16 md:py-20 ${className ?? ""}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 space-y-4">
          <Skeleton className="h-10 w-64 mx-auto" />
          <Skeleton className="h-1 w-20 mx-auto" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-72 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsSkeleton() {
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center p-4 rounded-xl bg-muted/30 space-y-3">
              <Skeleton className="h-10 w-16 mx-auto" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PartnersSkeleton() {
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 space-y-4">
          <Skeleton className="h-10 w-48 mx-auto" />
          <Skeleton className="h-1 w-20 mx-auto" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 max-w-4xl mx-auto">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <Skeleton className="h-16 w-16 rounded-2xl" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Main component ─── */
export function AboutPage() {
  const { t, locale } = useI18n();
  const isRtl = locale === "ar";

  const [settings, setSettings] = useState<SettingsMap | null>(null);
  const [agents, setAgents] = useState<AgentResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [settingsRes, agentsRes] = await Promise.all([
          fetch("/api/settings"),
          fetch("/api/agents"),
        ]);
        const settingsData = await settingsRes.json();
        const agentsData = await agentsRes.json();
        setSettings(settingsData.settings ?? {});
        setAgents(agentsData.agents ?? []);
      } catch (error) {
        console.error("Error fetching about page data:", error);
        setSettings({});
        setAgents([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  /* Derive data from API responses */
  const milestones = settings ? parseMilestones(settings, locale) : [];
  const partners = settings ? parsePartners(settings, locale) : [];
  const teamMembers = agents.map((a) => mapAgentToMember(a, locale));
  const teamStats = settings ? parseTeamStats(settings, locale, agents.length, t) : [];
  const foundedYear = settings ? getSettingValue(settings, "about.foundedYear", locale) : "2010";

  const values = [
    { icon: Eye, title: t("about.transparency"), desc: t("about.transparencyDesc"), gradient: "bg-primary", border: "bg-primary" },
    { icon: Lightbulb, title: t("about.innovation"), desc: t("about.innovationDesc"), gradient: "bg-primary", border: "bg-primary" },
    { icon: Heart, title: t("about.community"), desc: t("about.communityDesc"), gradient: "bg-primary", border: "bg-primary" },
    { icon: Target, title: t("about.excellence"), desc: t("about.excellenceDesc"), gradient: "bg-primary", border: "bg-primary" },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-foreground text-background py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://placehold.co/1920x600/065f46/065f46?text=')] bg-cover bg-center opacity-15" />
        {/* Decorative circles */}
        <div className="absolute -top-20 -end-20 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -start-16 w-56 h-56 rounded-full bg-white/5" />
        <div className="absolute top-1/2 start-1/4 w-32 h-32 rounded-full bg-white/5 -translate-y-1/2" />
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative container mx-auto px-4 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm text-white mb-6 border border-white/20"
            >
              <Globe className="w-8 h-8" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{t("about.title")}</h1>
            <p className="text-lg text-background/80 max-w-2xl mx-auto">{t("about.subtitle")}</p>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <Card className="h-full border-0 shadow-md hover:shadow-lg transition-all duration-300 group overflow-hidden relative">
                <div className="absolute top-0 inset-x-0 h-1 bg-primary" />
                <CardContent className="p-8">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground mb-5 shadow-lg  group-hover:scale-110 transition-transform duration-300">
                    <Target className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl font-bold mb-4">{t("about.mission")}</h2>
                  <p className="text-muted-foreground leading-relaxed">{t("about.missionDesc")}</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.15 }}>
              <Card className="h-full border-0 shadow-md hover:shadow-lg transition-all duration-300 group overflow-hidden relative">
                <div className="absolute top-0 inset-x-0 h-1 bg-primary" />
                <CardContent className="p-8">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground mb-5 shadow-lg  group-hover:scale-110 transition-transform duration-300">
                    <Lightbulb className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl font-bold mb-4">{t("about.vision")}</h2>
                  <p className="text-muted-foreground leading-relaxed">{t("about.visionDesc")}</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced Values Section */}
      <section className="py-16 md:py-20 bg-muted/30 relative overflow-hidden">
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-30 dark:opacity-10" style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="container mx-auto px-4 relative">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("about.values")}</h2>
            <div className="w-20 h-1 bg-primary rounded-full mx-auto" />
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {values.map((item, idx) => (
              <motion.div
                key={idx}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="h-full text-center border-0 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden relative">
                  {/* Gradient top border */}
                  <div className={`absolute top-0 inset-x-0 h-1 ${item.border}`} />
                  <CardContent className="p-6 pt-8">
                    {/* Numbered badge */}
                    <div className="absolute top-3 end-3">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted text-xs font-bold text-muted-foreground">
                        {idx + 1}
                      </span>
                    </div>
                    {/* Icon with gradient circle background */}
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${item.gradient} text-primary-foreground mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <item.icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Our Story Section */}
      <section className="py-16 md:py-20 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
            >
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  {isRtl ? `تأسست ${foundedYear}` : `Est. ${foundedYear}`}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">{t("about.ourStory")}</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">{t("about.ourStoryDesc")}</p>
                <div className="grid grid-cols-2 gap-4">
                  {teamStats.slice(0, 2).map((stat, idx) => (
                    <div key={idx} className="text-center p-3 rounded-xl bg-muted/50">
                      {loading ? (
                        <Skeleton className="h-10 w-16 mx-auto" />
                      ) : (
                        <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                      )}
                      <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-2xl bg-primary flex items-center justify-center overflow-hidden relative shadow-2xl">
                  {/* Decorative pattern */}
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
                  <div className="absolute -top-10 -end-10 w-40 h-40 rounded-full bg-white/10" />
                  <div className="absolute -bottom-8 -start-8 w-32 h-32 rounded-full bg-white/10" />
                  <div className="text-center text-white relative">
                    <Globe className="w-16 h-16 mx-auto mb-4 opacity-80" />
                    <p className="text-xl font-bold mb-1">{isRtl ? `تأسست ${foundedYear}` : `Est. ${foundedYear}`}</p>
                    <p className="text-primary-foreground/80 text-sm">{t("about.subtitle")}</p>
                  </div>
                  {/* Video play button placeholder */}
                  <button
                    className="absolute bottom-6 start-6 flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium border border-white/30 hover:bg-white/30 transition-colors"
                    onClick={() => {
                      // Placeholder for video functionality
                    }}
                  >
                    <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center">
                      <Play className="w-4 h-4 fill-white" />
                    </div>
                    {t("about.watchOurStory")}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Timeline / Milestones Section - with scroll-triggered reveals */}
      {loading ? (
        <SectionSkeleton className="bg-muted/30" />
      ) : milestones.length > 0 ? (
        <section className="py-16 md:py-20 bg-muted/30 relative">
          <div className="container mx-auto px-4">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("about.milestones")}</h2>
              <div className="w-20 h-1 bg-primary rounded-full mx-auto" />
            </motion.div>

            <div className="max-w-4xl mx-auto relative">
              {/* Vertical line */}
              <div className="absolute top-0 bottom-0 start-1/2 md:start-1/2 w-0.5 bg-primary -translate-x-1/2 rtl:translate-x-1/2 hidden md:block" />
              <div className="absolute top-0 bottom-0 start-6 w-0.5 bg-primary md:hidden" />

              <div className="space-y-8 md:space-y-12">
                {milestones.map((milestone, idx) => {
                  const isEven = idx % 2 === 0;
                  return (
                    <TimelineItem key={idx} milestone={milestone} idx={idx} isEven={isEven} />
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Team Stats */}
      {loading ? (
        <StatsSkeleton />
      ) : (
        <section className="py-16 md:py-20 relative overflow-hidden">
          <div className="absolute -top-20 -end-20 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-20 -start-20 w-56 h-56 rounded-full bg-primary/5 blur-3xl" />
          <div className="container mx-auto px-4 relative">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {teamStats.map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={scaleIn}
                  transition={{ delay: idx * 0.1 }}
                  className="text-center p-4 rounded-xl bg-muted/30 backdrop-blur-sm"
                >
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  <p className="text-sm text-muted-foreground mt-2">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Team Members Section - with flip cards */}
      {loading ? (
        <SectionSkeleton className="bg-muted/30" />
      ) : teamMembers.length > 0 ? (
        <section className="py-16 md:py-20 bg-muted/30 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 dark:opacity-10" style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
          <div className="container mx-auto px-4 relative">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground mb-4 shadow-md">
                <Users className="w-6 h-6" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t("about.leadershipTeam")}
              </h2>
              <div className="w-20 h-1 bg-primary rounded-full mx-auto" />
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {teamMembers.map((member, idx) => (
                <motion.div
                  key={member.id}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="flip-card h-72">
                    <div className="flip-card-inner w-full h-full">
                      {/* Front of card */}
                      <div className="flip-card-front w-full h-full">
                        <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 group text-center overflow-hidden h-full">
                          <CardContent className="p-6 flex flex-col items-center justify-center h-full">
                            {/* Circular Avatar with gradient */}
                            <div className="relative inline-block mb-4">
                              {member.image ? (
                                <img
                                  src={member.image}
                                  alt={member.name}
                                  className="w-20 h-20 rounded-full object-cover shadow-lg group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className={`w-20 h-20 rounded-full ${member.gradient} flex items-center justify-center text-primary-foreground text-xl font-bold shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                                  {member.initials}
                                </div>
                              )}
                              <div className="absolute -bottom-1 -end-1 w-6 h-6 rounded-full bg-primary border-2 border-background flex items-center justify-center">
                                <span className="text-[8px] text-primary-foreground font-bold">✓</span>
                              </div>
                            </div>
                            <h3 className="text-lg font-semibold mb-0.5">{member.name}</h3>
                            <p className="text-sm text-primary font-medium mb-3">{member.title}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{member.experience} {isRtl ? "سنوات خبرة" : "yrs exp"}</span>
                              <span>•</span>
                              <span>{member.propertiesCount} {isRtl ? "عقار" : "properties"}</span>
                            </div>
                            <p className="text-xs text-muted-foreground/50 mt-3">{isRtl ? "مرر للتفاصيل" : "Hover for details"}</p>
                          </CardContent>
                        </Card>
                      </div>
                      {/* Back of card */}
                      <div className="flip-card-back w-full h-full">
                        <Card className={`border-0 shadow-lg overflow-hidden h-full ${member.gradient}`}>
                          <CardContent className="p-6 flex flex-col items-center justify-center h-full text-white">
                            {member.image ? (
                              <img
                                src={member.image}
                                alt={member.name}
                                className="w-16 h-16 rounded-full object-cover bg-white/20 backdrop-blur-sm mb-4"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold mb-4">
                                {member.initials}
                              </div>
                            )}
                            <h3 className="text-lg font-bold mb-1">{member.name}</h3>
                            <p className="text-sm text-white/80 mb-4">{member.title}</p>
                            <p className="text-sm text-white/90 leading-relaxed text-center">{member.bio}</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Partners Section */}
      {loading ? (
        <PartnersSkeleton />
      ) : partners.length > 0 ? (
        <section className="py-16 md:py-20 relative">
          <div className="container mx-auto px-4">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("footer.partners")}</h2>
              <div className="w-20 h-1 bg-primary rounded-full mx-auto" />
              <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
                {isRtl ? "نتعاون مع أفضل الشركات لتقديم تجربة عقارية لا مثيل لها" : "We partner with industry leaders to deliver an unmatched real estate experience"}
              </p>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 max-w-4xl mx-auto">
              {partners.map((partner, idx) => (
                <motion.div
                  key={idx}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={scaleIn}
                  transition={{ delay: idx * 0.08 }}
                  className="flex flex-col items-center gap-3 group"
                >
                  <div className={`w-16 h-16 rounded-2xl ${partner.gradient} flex items-center justify-center text-primary-foreground font-bold text-lg shadow-md group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
                    {partner.initials}
                  </div>
                  <span className="text-xs text-muted-foreground text-center font-medium group-hover:text-foreground transition-colors">
                    {partner.name}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
