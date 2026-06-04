"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { Calendar, Clock, User, Mail, Phone, MessageSquare, Video, MapPin, Monitor } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ScheduleTourDialogProps {
  propertyId: string;
  propertyTitle: string;
  trigger?: React.ReactNode;
}

export function ScheduleTourDialog({ propertyId, propertyTitle, trigger }: ScheduleTourDialogProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [tourType, setTourType] = useState<"in-person" | "virtual" | "video-call">("in-person");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const availableTimes = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00"
  ];

  const handleSubmit = async () => {
    if (!date || !time || !name || !email) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/tours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          name,
          email,
          phone,
          date,
          time,
          notes,
          tourType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        toast.success(t("tour.scheduledSuccess"));
      } else {
        toast.error(data.error || "Failed to schedule tour");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setStep(1);
      setSuccess(false);
      setDate("");
      setTime("");
      setName("");
      setEmail("");
      setPhone("");
      setNotes("");
      setTourType("in-person");
    }, 300);
  };

  const tourTypes = [
    { value: "in-person" as const, icon: MapPin, label: t("tour.inPerson"), desc: t("tour.inPersonDesc") },
    { value: "virtual" as const, icon: Monitor, label: t("tour.virtual"), desc: t("tour.virtualDesc") },
    { value: "video-call" as const, icon: Video, label: t("tour.videoCall"), desc: t("tour.videoCallDesc") },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            <Calendar className="w-4 h-4" />
            {t("tour.scheduleTour")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {t("tour.scheduleTour")}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">{propertyTitle}</p>
        </DialogHeader>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-8 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t("tour.scheduledTitle")}</h3>
            <p className="text-muted-foreground text-sm mb-4">{t("tour.scheduledDesc")}</p>
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-start max-w-xs mx-auto">
              <div className="flex items-center gap-2 mb-1"><Calendar className="w-3.5 h-3.5 text-primary" />{date}</div>
              <div className="flex items-center gap-2 mb-1"><Clock className="w-3.5 h-3.5 text-primary" />{time}</div>
              <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-primary" />{tourTypes.find(tt => tt.value === tourType)?.label}</div>
            </div>
            <Button onClick={handleClose} className="mt-6">{t("common.close")}</Button>
          </motion.div>
        ) : (
          <div className="space-y-6 pt-2">
            {/* Progress Steps */}
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>{s}</div>
                  {s < 3 && <div className={`flex-1 h-0.5 transition-colors ${step > s ? "bg-primary" : "bg-muted"}`} />}
                </div>
              ))}
            </div>

            {/* Step 1: Tour Type & Date/Time */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                {/* Tour Type Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">{t("tour.tourType")}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {tourTypes.map((tt) => (
                      <button
                        key={tt.value}
                        onClick={() => setTourType(tt.value)}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          tourType === tt.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <tt.icon className={`w-5 h-5 mx-auto mb-1 ${tourType === tt.value ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="text-xs font-medium">{tt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {/* Date Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">{t("tour.selectDate")}</label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full" />
                </div>
                {/* Time Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">{t("tour.selectTime")}</label>
                  <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                    {availableTimes.map((tm) => (
                      <button
                        key={tm}
                        onClick={() => setTime(tm)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          time === tm ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                        }`}
                      >
                        {tm}
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={() => setStep(2)} disabled={!date || !time} className="w-full">
                  {t("common.next")}
                </Button>
              </motion.div>
            )}

            {/* Step 2: Contact Info */}
            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">{t("tour.fullName")}</label>
                  <div className="relative">
                    <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="ps-9" placeholder={t("tour.fullName")} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{t("tour.email")}</label>
                  <div className="relative">
                    <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="ps-9" placeholder={t("tour.email")} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{t("tour.phone")}</label>
                  <div className="relative">
                    <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="ps-9" placeholder={t("tour.phone")} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{t("tour.notes")}</label>
                  <div className="relative">
                    <MessageSquare className="absolute start-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="ps-9" placeholder={t("tour.notesPlaceholder")} rows={3} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">{t("common.back")}</Button>
                  <Button onClick={() => setStep(3)} disabled={!name || !email} className="flex-1">{t("common.next")}</Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                  <h4 className="font-semibold text-sm">{t("tour.confirmDetails")}</h4>
                  <div className="text-sm space-y-1.5">
                    <div className="flex justify-between"><span className="text-muted-foreground">{t("tour.tourType")}:</span><span className="font-medium">{tourTypes.find(tt => tt.value === tourType)?.label}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">{t("tour.date")}:</span><span className="font-medium">{date}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">{t("tour.time")}:</span><span className="font-medium">{time}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">{t("tour.fullName")}:</span><span className="font-medium">{name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">{t("tour.email")}:</span><span className="font-medium">{email}</span></div>
                    {phone && <div className="flex justify-between"><span className="text-muted-foreground">{t("tour.phone")}:</span><span className="font-medium">{phone}</span></div>}
                    {notes && <div className="flex justify-between"><span className="text-muted-foreground">{t("tour.notes")}:</span><span className="font-medium">{notes}</span></div>}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">{t("common.back")}</Button>
                  <Button onClick={handleSubmit} disabled={submitting} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : t("tour.confirmSchedule")}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
