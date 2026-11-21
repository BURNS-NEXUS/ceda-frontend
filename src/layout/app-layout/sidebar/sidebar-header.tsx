"use client";

import { SidebarHeader } from "@/components/ui/sidebar";
import { Link } from "@/i18n/navigation";
import { cn } from "@/utils";
import Image from "next/image";

interface AppSidebarHeaderProps {
  showContent: boolean;
}

export default function AppSidebarHeader({
  showContent,
}: AppSidebarHeaderProps) {
  return (
    <SidebarHeader className="px-3 pt-3 pb-8">
      <div className="flex items-center justify-between gap-3">
      <Link
        href="/"
        className={cn(
          "flex items-center",
          !showContent ? "justify-center" : "justify-start",
        )}
      >
        {showContent ? (
          <>
            <Image
              className="dark:hidden"
              src="/images/logo/ceda-official.png"
              alt="CEDA Innovation Portal"
              width={180}
              height={88}
              priority
              style={{ width: "auto", height: "auto" }}
            />
            <Image
              className="hidden dark:block"
              src="/images/logo/ceda-official.png"
              alt="CEDA Innovation Portal"
              width={180}
              height={88}
              priority
              style={{ width: "auto", height: "auto" }}
            />
          </>
        ) : (
          <Image
            src="/images/logo/ceda-official.png"
            alt="CEDA Innovation Portal"
            width={48}
            height={48}
            priority
            style={{ width: "auto", height: "auto" }}
          />
        )}
      </Link>
      </div>
    </SidebarHeader>
  );
}
