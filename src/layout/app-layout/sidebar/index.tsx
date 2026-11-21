"use client";

import {
  Sidebar,
  SidebarContent,
  useSidebar,
} from "@/components/ui/sidebar";
import { usePathname } from "@/i18n/navigation";
import { useState } from "react";
import { roleNavItems, supportItems } from "./data";
import { useDemoRole } from "@/context/demo-role-context";
import AppSidebarHeader from "./sidebar-header";
import SidebarNavGroup from "./sidebar-nav-group";
import { MenuType, NavItem } from "./types";

const menuSections: { type: MenuType; labelKey: string; items: NavItem[] }[] = [
  { type: "main", labelKey: "groups.workspace", items: roleNavItems.programmeAdmin },
  { type: "support", labelKey: "groups.support", items: supportItems },
];

const findMatchingSubmenu = (path: string) => {
  for (const section of menuSections) {
    for (let index = 0; index < section.items.length; index++) {
      const nav = section.items[index];
      if (
        nav.subItems?.some(
          (subItem) =>
            subItem.path === path ||
            (subItem.path === "/ai-settings" && path.startsWith("/ai-settings")),
        )
      ) {
        return { type: section.type, index };
      }
    }
  }
  return null;
};

export default function AppSidebar() {
  const { open, isMobile, isHovered } = useSidebar();
  const pathname = usePathname();
  const { role } = useDemoRole();
  const navItems = roleNavItems[role];

  const showContent = open || isHovered || isMobile;

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: MenuType;
    index: number;
  } | null>(() => findMatchingSubmenu(pathname));

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpenSubmenu(findMatchingSubmenu(pathname));
  }

  const handleSubmenuToggle = (index: number, menuType: MenuType) => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const roleSections = [
    { type: "main" as MenuType, labelKey: "groups.workspace", items: navItems },
    { type: "support" as MenuType, labelKey: "groups.support", items: supportItems },
  ];
  const activeSections = roleSections.filter(
    (section) => section.items.length > 0,
  );

  return (
    <Sidebar side="left" collapsible="icon">
      <AppSidebarHeader showContent={showContent} />

      <SidebarContent className="overflow-y-auto px-5 duration-300 ease-linear group-data-[collapsible=icon]/sidebar:px-2">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            {activeSections.map((section) => (
              <SidebarNavGroup
                key={section.type}
                labelKey={section.labelKey}
                menuType={section.type}
                items={section.items}
                openSubmenu={openSubmenu}
                showContent={showContent}
                pathname={pathname}
                onToggleSubmenu={handleSubmenuToggle}
              />
            ))}
          </div>
        </nav>

      </SidebarContent>
    </Sidebar>
  );
}
