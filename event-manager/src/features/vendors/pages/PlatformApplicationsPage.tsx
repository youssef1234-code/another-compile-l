import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { ShoppingBag, Calendar, MapPin, Clock, Users } from "lucide-react";
import { motion } from "framer-motion";
import { LoadingSpinner } from "@/components/generic/LoadingSpinner";
import type { Event } from "@event-manager/shared";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

interface VendorApplication {
  attendees: Array<{ name: string; email: string }>;
  boothSize: "TWO_BY_TWO" | "FOUR_BY_FOUR";
  duration: number;
  location: number;
}

export function PlatformApplicationsPage() {
  const [application, setApplication] = useState<VendorApplication>({
    attendees: [{ name: "", email: "" }],
    boothSize: "TWO_BY_TWO",
    duration: 1,
    location: 1,
  });
  const createM = trpc.vendorApplications.create.useMutation({
    onSuccess: () => {
      toast.success("Application submitted successfully!");
    },
    onError: () => {},
  });

  return <div></div>;
}
