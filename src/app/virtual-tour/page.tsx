import type { Metadata } from "next";
import { VirtualTourPage } from "@/components/real-estate/virtual-tour-page";

export const metadata: Metadata = {
  title: "Virtual Tour - EstatePro",
  description:
    "Experience properties in 360° with our immersive virtual tours. Explore rooms, zoom in on details, and get a feel for the space from anywhere.",
};

export default function VirtualTourRoute() {
  return <VirtualTourPage />;
}
