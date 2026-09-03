"use client";

import {
  Calendar,
  Home,
  Settings,
  Users,
  GraduationCap,
  BookOpen,
  School,
  CheckSquare,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { UserButton } from "@daveyplate/better-auth-ui";
import Image from "next/image";
import { Badge } from "./ui/badge";
import { useSettings } from "@/lib/settings-context";

// Menu items.
const items = [
  {
    title: "Home",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Manage Students",
    url: "/dashboard/students",
    icon: Users,
  },
  {
    title: "Qualifications",
    url: "/dashboard/qualifications",
    icon: GraduationCap,
  },
  {
    title: "Courses",
    url: "/dashboard/courses",
    icon: BookOpen,
  },
  {
    title: "Classrooms",
    url: "/dashboard/classrooms",
    icon: School,
  },
  {
    title: "Routines",
    url: "/dashboard/routines",
    icon: Calendar,
  },
  {
    title: "Attendance",
    url: "/dashboard/attendance",
    icon: CheckSquare,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
];

export function AppSidebar() {
  "use client";
  const {
    state,
    open,
    setOpen,
    openMobile,
    setOpenMobile,
    isMobile,
    toggleSidebar,
  } = useSidebar();
  const { openSettings } = useSettings();

  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-center gap-4">
          <div
            className={`${state === "collapsed" ? "h-8 w-8 border border-primary shadow shadow-primary" : "h-10 w-10"} rounded-[min(var(--radius-md),6px)] overflow-hidden`}
          >
            <Image
              src="/logo.svg"
              alt="Hyperbola logo"
              width={40}
              height={40}
              className="block h-full w-full object-cover"
            />
          </div>

          <div
            className={`flex gap-2 items-center justify-start ${state === "collapsed" ? "hidden" : "flex"}`}
          >
            <p className="text-lg font-bold md:text-xl">Hyperbola</p>
            <Badge>CE</Badge>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild={item.url !== "#"}
                    onClick={
                      item.url === "#" ? () => openSettings() : undefined
                    }
                  >
                    {item.url !== "#" ? (
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    ) : (
                      // <button className="flex items-center w-full">
                      <>
                        <item.icon />
                        <span>{item.title}</span>
                      </>
                      // </button>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <UserButton size={state === "collapsed" ? "icon" : "default"} />
      </SidebarFooter>
    </Sidebar>
  );
}
