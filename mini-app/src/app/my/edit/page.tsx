"use client";
import Typography from "@/components/Typography";
import { Button } from "konsta/react";
import Image from "next/image";
import cameraIcon from "./camera.svg";
import xPlatformIcon from "@/app/_components/channels/xplatform.svg";
import telegramIcon from "@/app/_components/channels/telegram.svg";
import { ChangeEventHandler, ReactNode, useRef, useState } from "react";
import { cn } from "@/utils";

const data = {
  id: 15,
  avatar: "/sq.jpg",
  title: "TON Network",
  eventCount: 223,
};

export default function EditChannelPage() {
  const [title, setTitle] = useState(data.title);
  const [tg, setTg] = useState("");
  const [x, setX] = useState("");
  const [bio, setBio] = useState("");

  const editAvatar = () => {};

  return (
    <div className="p-4">
      <Image
        className="mb-4 w-full h-auto !rounded-[10px]"
        sizes="100vw"
        src={data.avatar}
        width={0}
        height={0}
        alt="Avatar"
        layout="cover"
      />
      <div className="flex align-center justify-between mb-2">
        <Typography
          variant="title3"
          bold
        >
          Editing Profile
        </Typography>
        <Button
          outline
          className="!w-auto py-4 px-3 rounded-[6px]"
          onClick={editAvatar}
        >
          <Image
            src={cameraIcon}
            width={20}
            height={20}
            alt=""
          />
          Edit Image
        </Button>
      </div>
      <Typography
        className="mb-3"
        variant="footnote"
      >
        You can edit your information and manage how it is showed to the participants.
      </Typography>
      <OntonInput
        label="Channel Name"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="mb-3"
      />
      <div className="flex gap-3 mb-3">
        <div className="p-4 bg-[#EEEEF0] !rounded-[10px]">
          <Image
            src={telegramIcon}
            width={16}
            height={16}
            alt="X"
          />
        </div>
        <OntonInput
          label="Telegram Handle"
          value={tg}
          onChange={(e) => setTg(e.target.value)}
        />
      </div>
      <div className="flex gap-3 mb-3">
        <div className="p-4 bg-[#EEEEF0] !rounded-[10px]">
          <Image
            src={xPlatformIcon}
            width={16}
            height={16}
            alt="X"
          />
        </div>
        <OntonInput
          label="X Handle"
          value={x}
          onChange={(e) => setX(e.target.value)}
        />
      </div>
      <OntonExpandableInput
        label="Bio"
        value={bio}
        onChange={(e) => setBio(e.target.value)}
      />
      <div className="mt-4 pt-2 -mx-4 px-3 shadow-[0px_-1px_4px_0px_#0000001A]">
        <Button className="py-5 mb-3 !rounded-[10px]">Save Changes</Button>
        <Button
          className="py-5 !rounded-[10px]"
          outline
        >
          Discard
        </Button>
      </div>
    </div>
  );
}

const OntonInput = ({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  className?: string;
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <InternalInputWrapper
      className={className}
      active={isFocused || !!value}
      label={label}
    >
      <input
        type="text"
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-full h-11 leading-5.5 bg-transparent px-4 pt-4 pb-1 focus:outline-none"
      />
    </InternalInputWrapper>
  );
};

const OntonExpandableInput = ({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
  className?: string;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput: ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    if (!textareaRef.current) return;

    // Adjust height based on content
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    onChange(e);
  };

  return (
    <InternalInputWrapper
      className={className}
      label={label}
      active={isFocused || !!value}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        rows={1}
        className="w-full leading-5.5 px-4 pt-4 pb-1 bg-transparent resize-none focus:outline-none"
      />
    </InternalInputWrapper>
  );
};

function InternalInputWrapper({
  className,
  active,
  label,
  children,
}: {
  className?: string;
  active: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("relative w-full bg-[#7474801F] !rounded-[10px]", className)}>
      <label
        className={cn(
          "text-base absolute left-4 top-3 text-gray-500 pointer-events-none !leading-[16px]",
          "transition-transform transform-gpu origin-top-left duration-200 antialiased",
          active && "-translate-y-2 scale-67"
        )}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
