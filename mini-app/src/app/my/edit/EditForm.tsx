"use client";
import Typography from "@/components/Typography";
import { Button, Preloader } from "konsta/react";
import Image from "next/image";
import cameraIcon from "./camera.svg";
import xPlatformIcon from "@/app/_components/channels/xplatform.svg";
import telegramIcon from "@/app/_components/channels/telegram.svg";
import { ChangeEventHandler, ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/utils";
import { trpc } from "@/app/_trpc/client";
import { Channel } from "@/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function EditForm({ data }: { data: Channel }) {
  const [title, setTitle] = useState(data.org_channel_name || "");
  const [tg, setTg] = useState(data.org_support_telegram_user_name || "");
  const [x, setX] = useState(data.org_x_link || "");
  const [bio, setBio] = useState(data.org_bio || "");
  const [avatar, setAvatar] = useState(data.photo_url || "");

  const editApi = trpc.organizers.updateOrganizer.useMutation();
  const router = useRouter();
  const saveChanges = async () => {
    const response = await editApi.mutateAsync({
      org_channel_name: title,
      org_support_telegram_user_name: tg,
      org_x_link: x,
      org_bio: bio,
      org_image: avatar,
    });
    toast.success("Information updated successfully.");
    router.push("/my?saved=true");
  };

  const imageInputRef = useRef<HTMLInputElement>(null);

  const uploadApi = trpc.files.uploadImage.useMutation();

  const [isUploading, setUploading] = useState(false);
  const uploadImage = async (files: FileList | null) => {
    if (!files || !files[0]) return;

    setUploading(true);
    const response = await uploadApi.mutateAsync({ image: await toBase64(files[0]), subfolder: "channels" });
    setAvatar(response.imageUrl);
    setUploading(false);
  };

  return (
    <div className="p-4">
      <div className="relative">
        <div
          className={cn(
            "absolute z-2 inset-0 opacity-50 bg-white items-center justify-center hidden",
            isUploading && "!flex"
          )}
        >
          <Preloader size="w-16 h-16" />
        </div>
        <Image
          className="mb-4 w-full h-auto !rounded-[10px] aspect-square"
          sizes="100vw"
          src={avatar}
          width={0}
          height={0}
          alt="Avatar"
        />
      </div>
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
          onClick={() => {
            if (isUploading) return;
            imageInputRef.current?.click();
          }}
        >
          <Image
            src={cameraIcon}
            width={20}
            height={20}
            alt=""
          />
          Edit Image
          <input
            ref={imageInputRef}
            type="file"
            name="image"
            accept="image/*"
            onChange={(e) => {
              e.preventDefault();
              uploadImage(e.target.files);
            }}
            id="event_image_input"
            className="hidden"
          />
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
        <Button
          className="py-5 mb-3 !rounded-[10px]"
          onClick={saveChanges}
        >
          Save Changes
        </Button>
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

  useEffect(() => {
    // Adjust height based on content
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [value]);

  return (
    <InternalInputWrapper
      className={className}
      label={label}
      active={isFocused || !!value}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
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

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}
