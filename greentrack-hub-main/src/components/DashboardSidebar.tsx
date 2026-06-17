import React from "react";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { type LucideIcon } from "lucide-react";

export interface SidebarItem {
  key: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface DashboardSidebarProps {
  items: SidebarItem[];
  active: string;
  onSelect: (key: string) => void;
  brandTitle?: string;
  brandSubtitle?: string;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  items,
  active,
  onSelect,
  brandTitle = "Green Impact",
  brandSubtitle,
}) => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-2">
          {collapsed ? (
            /* Collapsed: show only the icon part of the logo */
            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-white/5 transition-transform duration-200 hover:scale-105">
              <img
                src="/logo.png"
                alt={brandTitle}
                className="h-7 w-auto object-contain drop-shadow-sm"
                style={{ maxWidth: "none" }}
              />
            </div>
          ) : (
            /* Expanded: show full logo + subtitle */
            <div className="flex items-center gap-2 min-w-0 animate-fade-in">
              <div className="shrink-0 rounded-lg overflow-hidden bg-white/5 p-0.5 transition-all duration-200 hover:bg-white/10">
                <img
                  src="/logo.png"
                  alt={brandTitle}
                  className="h-8 w-auto object-contain drop-shadow-sm"
                />
              </div>
              {brandSubtitle && (
                <span className="text-[11px] text-sidebar-foreground/70 truncate">
                  {brandSubtitle}
                </span>
              )}
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Navigation</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.key;
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => onSelect(item.key)}
                      tooltip={item.label}
                      className="transition-all duration-200 hover:translate-x-0.5"
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {!collapsed && (
                        <span className="flex-1 truncate">{item.label}</span>
                      )}
                      {!collapsed && item.badge !== undefined && item.badge > 0 && (
                        <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-warning/90 text-warning-foreground text-[10px] font-bold animate-scale-in">
                          {item.badge}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default DashboardSidebar;
