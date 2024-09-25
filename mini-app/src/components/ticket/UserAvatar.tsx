"use client";

import Image from "next/image";
import { useInitDataRaw } from "@telegram-apps/sdk-react";

const profileInitials = (name: { firstName: string; lastName: string }) => {
  if (!name) return null;
  const initials = name.firstName.charAt(0) + name.lastName.charAt(0);

  function getRandomAvatarColorBasedOnNameInitialLetter(n: string) {
    const colors = [
      "bg-gradient-to-b from-[#FF885E] to-[#FF516A]",
      "bg-gradient-to-b from-[#FFCD6A] to-[#FFA85C]",
      "bg-gradient-to-b from-[#82B1FF] to-[#665FFF]",
      "bg-gradient-to-b from-[#A0DE7E] to-[#54CB68]",
      "bg-gradient-to-b from-[#53EDD6] to-[#28C9B7]",
      "bg-gradient-to-b from-[#72D5FD] to-[#2A9EF1]",
      "bg-gradient-to-b from-[#E0A2F3] to-[#D669ED]",
    ];

    return colors[n.charCodeAt(0) % colors.length];
  }

  return (
    <div
      className={
        "flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-medium text-white " +
        getRandomAvatarColorBasedOnNameInitialLetter(initials)
      }
    >
      {initials}
    </div>
  );
};
const UserAvatar = () => {
  const { result } = useInitDataRaw();
  console.log("result", result?.user?.photoUrl);
  return (
    <div>
      {result?.user?.photoUrl ? (
        <Image
          src={result?.user?.photoUrl}
          alt={result?.user?.username || "user avatar"}
          width={24}
          height={24}
          className={"rounded-full"}
        />
      ) : (
        profileInitials({
          firstName: result?.user?.firstName || "",
          lastName: result?.user?.lastName || "",
        })
      )}
    </div>
  );
};
export default UserAvatar;
