import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const metadata: Metadata = {
  title: "Administration - EstatePro",
  description: "Protected EstatePro administration dashboard.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AdminPage() {
  return (
    <>
      <AdminDashboard />
      <Link
        href="/admin/moderation"
        className="fixed bottom-5 end-5 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-xl transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <ClipboardCheck className="h-4 w-4" />
        Listing moderation
      </Link>
    </>
  );
}
