"use client"

import * as React from "react"
import { ChevronRight, FileText, Settings, Shield, BookOpen, HelpCircle } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { SearchForm } from "@/components/search-form"
import { VersionSwitcher } from "@/components/version-switcher"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { SidebarCTA } from "@/components/sidebar-cta"

// Soundry Documentation Structure
const data = {
  versions: ["v1.0.1", "v1.0.0"],
  navMain: [
    {
      title: "Getting Started",
      items: [
        {
          title: "Introduction",
          url: "/docs",
        },
        {
          title: "How Soundry Works",
          url: "/docs/how-it-works",
        },
      ],
    },
    {
      title: "Features",
      items: [
        {
          title: "Global Library",
          url: "/docs/global-library",
        },
        {
          title: "Playlists",
          url: "/docs/playlists",
        },
      ],
    },
    {
      title: "Privacy & Limits",
      items: [
        {
          title: "Sessions & Privacy",
          url: "/docs/sessions-privacy",
        },
        {
          title: "Limitations",
          url: "/docs/limitations",
        },
        {
          title: "Responsible Use",
          url: "/docs/responsible-use",
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          title: "FAQ",
          url: "/docs/faq",
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }) {
  const pathname = usePathname()

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <VersionSwitcher versions={data.versions} defaultVersion={data.versions[0]} />
        <SearchForm />
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {data.navMain.map((item) => (
          <Collapsible
            key={item.title}
            title={item.title}
            defaultOpen
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel
                asChild
                className="group/label text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <CollapsibleTrigger>
                  {item.title}{" "}
                  <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {item.items.map((subItem) => (
                      <SidebarMenuItem key={subItem.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === subItem.url}
                        >
                          <Link href={subItem.url}>
                            {subItem.title}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>
      <SidebarRail />
      <SidebarFooter>
        <SidebarCTA />
      </SidebarFooter>
    </Sidebar>
  )
}
