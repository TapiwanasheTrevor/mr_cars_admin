"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { 
  BarChart3, 
  Users, 
  Car, 
  ShoppingCart, 
  CreditCard, 
  Calendar, 
  Bell, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  LayoutDashboard,
  MessageSquare,
  Package,
  Wrench,
  MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Users",
      href: "/dashboard/users",
      icon: Users,
    },
    {
      title: "Car Listings",
      href: "/dashboard/listings",
      icon: Car,
    },
    {
      title: "Orders",
      href: "/dashboard/orders",
      icon: ShoppingCart,
    },
    {
      title: "Products",
      href: "/dashboard/products",
      icon: Package,
    },
    {
      title: "Rental Cars",
      href: "/dashboard/rentals",
      icon: CreditCard,
    },
    {
      title: "Inquiries",
      href: "/dashboard/inquiries",
      icon: MessageSquare,
    },
    {
      title: "Forum",
      href: "/dashboard/forum",
      icon: MessageCircle,
    },
    {
      title: "Emergency",
      href: "/dashboard/emergency",
      icon: Wrench,
    },
    {
      title: "Appointments",
      href: "/dashboard/appointments",
      icon: Calendar,
    },
    {
      title: "Notifications",
      href: "/dashboard/notifications",
      icon: Bell,
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account",
      });
      router.push("/auth/login");
      router.refresh();
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "There was a problem signing you out",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={cn("relative flex flex-col h-full border-r transition-all duration-300", collapsed ? "w-16" : "w-64", className)}>
      <div className={cn("flex items-center p-4", collapsed ? "justify-center" : "justify-between")}>
        <Link href="/dashboard" className="flex items-center">
          <Image 
            src="/logo_icon.png" 
            alt="Mr Cars Logo" 
            width={24} 
            height={24} 
            className="h-6 w-6"
          />
          {!collapsed && <span className="ml-2 text-xl font-bold">Mr Cars</span>}
        </Link>
        {!collapsed && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1 py-2">
        <nav className="grid gap-1 px-2">
          {collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(false)}
              className="w-full h-10 mb-2"
              title="Expand Menu"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          {navItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                collapsed ? "justify-center" : ""
              )}
              title={collapsed ? item.title : undefined}
            >
              <item.icon className="h-5 w-5" />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <div className="p-4 border-t">
        <Button 
          variant="ghost" 
          className={cn("w-full", collapsed ? "justify-center px-2" : "justify-start")}
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </div>
  );
}