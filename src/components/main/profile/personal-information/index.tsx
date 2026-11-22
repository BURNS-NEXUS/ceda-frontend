"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PencilIcon } from "@/icons";
import { cn } from "@/utils";
import { useEffect, useState } from "react";
import { defaultPersonalInfo } from "./data";
import EditPersonalInfoDialog from "./edit-dialog";
import InfoField from "./info-field";
import SocialLinks from "./social-links";
import { PersonalInfo, PersonalInfoCardProps } from "./types";

export default function PersonalInformationSection({
  data = defaultPersonalInfo,
  className,
}: PersonalInfoCardProps) {
  const [profileData, setProfileData] = useState<PersonalInfo>(data);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("ceda-auth-user");
    if (!stored) return;
    try {
      const user = JSON.parse(stored) as { first_name?: string; last_name?: string; email?: string };
      const role = window.localStorage.getItem("burnz-demo-role") ?? "user";
      const roleLabel = role === "programmeAdmin" ? "Programme admin" : role.charAt(0).toUpperCase() + role.slice(1);
      setProfileData((current) => ({
        ...current,
        firstName: user.first_name ?? current.firstName,
        lastName: user.last_name ?? current.lastName,
        fullName: `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "CEDA user",
        email: user.email ?? current.email,
        role: roleLabel,
        avatarUrl: "",
      }));
    } catch {
      // Keep the neutral placeholder profile when stored user data is invalid.
    }
  }, []);

  const initialLetter = profileData.firstName?.trim()
    ? profileData.firstName.trim()[0].toUpperCase()
    : "M";

  return (
    <>
      <Card
        className={cn(
          "relative overflow-hidden border border-gray-200 p-5 sm:p-6 lg:p-7 dark:border-gray-700",
          className,
        )}
      >
        {/* Top Header Row: Title & Edit Button */}
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-gray-800 sm:text-lg dark:text-white/90">
            Personal Information
          </h2>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsDialogOpen(true)}
            className="h-9 gap-2 px-3.5"
          >
            <PencilIcon className="size-4.5" />
            <span>Edit</span>
          </Button>
        </div>

        {/* Profile Pic & Basic Meta */}
        <div className="mt-2 flex items-center gap-4 sm:gap-6">
          <Avatar className="size-16 shrink-0 sm:size-20">
            <AvatarImage
              src={profileData.avatarUrl}
              alt={profileData.fullName || "User profile"}
            />
            <AvatarFallback className="bg-brand-400 text-xl font-medium text-white sm:text-2xl dark:bg-brand-400 dark:text-white">
              {initialLetter}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold text-gray-800 sm:text-lg dark:text-white/90">
              {profileData.fullName}
            </h3>

            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 sm:text-sm dark:text-gray-400">
              <span>{profileData.role}</span>
              <span className="inline-block h-3.5 w-px bg-gray-300 dark:bg-gray-700" />
              <span>{profileData.location}</span>
            </div>
          </div>
        </div>

        {/* Details & Social Links Grid */}
        <div className="mt-2 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-6">
            <InfoField label="First Name" value={profileData.firstName} />
            <InfoField label="Email address" value={profileData.email} />
          </div>

          <div className="flex flex-col gap-6">
            <InfoField label="Last Name" value={profileData.lastName} />
            <InfoField label="Phone" value={profileData.phone} />
          </div>

          <div className="flex flex-col gap-6">
            <InfoField label="Bio" value={profileData.bio} />
          </div>

          <div className="flex flex-col gap-6">
            <SocialLinks socialLinks={profileData.socialLinks} />
          </div>
        </div>
      </Card>

      {/* Edit Personal Information Dialog */}
      <EditPersonalInfoDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        initialData={profileData}
        onSave={setProfileData}
      />
    </>
  );
}
