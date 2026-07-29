import type { Metadata } from "next";
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
  return <AdminDashboard />;
}
