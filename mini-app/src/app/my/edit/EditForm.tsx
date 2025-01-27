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
import { useFormik } from "formik";
import LoadableImage from "@/components/LoadableImage";
import channelAvatar from "@/components/icons/channel-avatar.svg";
import { getErrorMessages } from "@/lib/error";

const xLinkDefault = "https://x.com/";

export default function EditForm({ data }: { data: Channel }) {
  const editApi = trpc.organizers.updateOrganizer.useMutation();
  const router = useRouter();

  // const imageInputRef = useRef<HTMLInputElement>(null);

  const initialImage = data.org_image || data.photo_url || ''
  const {
    errors,
    touched,
    values,
    handleChange,
    handleSubmit,
    isSubmitting,
    setFieldValue
  } = useFormik<{
    org_channel_name: string;
    org_support_telegram_user_name: string;
    org_x_link: string;
    org_bio: string;
    org_image: string;
  }>({
    initialValues: {
      org_channel_name: data.org_channel_name || "",
      org_support_telegram_user_name: data.org_support_telegram_user_name || "",
      org_x_link: data.org_x_link || xLinkDefault,
      org_bio: data.org_bio || "",
      org_image: initialImage,
    },
    validate(values) {
      const newErrors: any = {};

      if (!values.org_channel_name.trim()) {
        newErrors.org_channel_name = "Channel name cannot be empty.";
      }

      if (values.org_support_telegram_user_name !== "" && !/^@[a-zA-Z0-9_]{5,32}$/.test(values.org_support_telegram_user_name.trim())) {
        newErrors.org_support_telegram_user_name = "Must start with @ and be 5-32 characters long.";
      }

      const xLink = values.org_x_link.trim() === xLinkDefault ? "" : values.org_x_link.trim();

      if (xLink && !/^https?:\/\/[a-zA-Z0-9._-]+\.[a-zA-Z]{2,}\/[a-zA-Z0-9_]{1,}$/.test(xLink)) {
        newErrors.org_x_link = "Invalid X handle URL. It should be like https://x.com/ontonlive";
      }
      return newErrors;
    },
    async onSubmit(values) {
      const newVals = { ...values };
      if (newVals.org_x_link === xLinkDefault) {
        newVals.org_x_link = "";
      }
      // TODO: check if base64 url

      await editApi.mutateAsync(newVals);
      toast.success("Information updated successfully.");
      goBack();
    },
  });

  const uploadApi = trpc.files.uploadImage.useMutation();

  // const [prevImg, setPrevImg] = useState(initialImage)
  const [isUploading, setUploading] = useState(false);
  const uploadImage = async (files: FileList | null) => {
    console.log('resetting error')
    uploadApi.reset() // reset the error
    const file = files?.[0]
    if (!file) return;

    const url = URL.createObjectURL(file)
    // setPrevImg(values.org_image)
    setFieldValue("org_image", url);

    let base64Img
    try {
      base64Img = await toBase64(file)
    } catch (e) {
      toast.error('Unable to encode image. Please try another image.')
      return
    }
    setUploading(true);

    await new Promise(resolve => setTimeout(resolve, 2000))
    try {
      const response = await uploadApi.mutateAsync({
        image: base64Img,
        subfolder: "channels"
      });
      console.log(response)
      setFieldValue("org_image", response.imageUrl);
    } catch (e) {
      console.log(e)
      toast.error('Unable to upload image. Please try again.')
    } finally {
      // setFieldValue("org_image", prevImg)
      setUploading(false);
    }
  };

  const goBack = () => {
    router.replace("/my");
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="p-4">
        <div className="relative">
          <div
            className={cn(
              "absolute z-10 inset-0 opacity-50 bg-white items-center justify-center hidden",
              isUploading && "!flex"
            )}
          >
            <Preloader size="w-16 h-16" />
          </div>
          <div className={cn(
            "absolute z-10 inset-0 bg-[rgba(255,255,255,0.6)] text-red-500 w-full text-balance mt-2 hidden justify-center items-center",
            uploadApi.error && '!flex')}>
            {
              getErrorMessages(uploadApi.error?.message)
                .map((errMessage, idx: number) => (
                  <p key={idx}>{errMessage}</p>
                ))}
          </div>
          <LoadableImage
            src={values.org_image || channelAvatar.src}
            width={0}
            height={0}
            wrapperClassName="mb-4 h-auto !rounded-[10px] aspect-square"
            className="aspect-square w-full"
            sizes="100vw"
            alt="Avatar" />
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
            itemType="button"
            className="!w-auto py-4 px-3 rounded-[6px] relative"
          >
            <Image
              src={cameraIcon}
              width={20}
              height={20}
              alt=""
            />
            Edit Image
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={(e) => {
                uploadImage(e.target.files);
              }}
              className="opacity-0 absolute inset-0 z-10"
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
          className="mb-3"
          label="Channel Name"
          name="org_channel_name"
          value={values.org_channel_name}
          error={(errors.org_channel_name && touched.org_channel_name && errors.org_channel_name) || undefined}
          onChange={handleChange}
        />
        <OntonInput
          className="mb-3"
          label="Telegram Handle"
          name="org_support_telegram_user_name"
          value={values.org_support_telegram_user_name}
          error={
            (errors.org_support_telegram_user_name &&
              touched.org_support_telegram_user_name &&
              errors.org_support_telegram_user_name) ||
            undefined
          }
          onChange={handleChange}
          startAdornment={
            <div className="p-4 bg-[#EEEEF0] !rounded-[10px]">
              <Image
                src={telegramIcon}
                width={16}
                height={16}
                alt="X"
              />
            </div>
          }
        />
        <OntonInput
          className="mb-3"
          label="X Handle"
          name="org_x_link"
          value={values.org_x_link}
          error={(errors.org_x_link && touched.org_x_link && errors.org_x_link) || undefined}
          onChange={handleChange}
          startAdornment={
            <div className="p-4 bg-[#EEEEF0] !rounded-[10px]">
              <Image
                src={xPlatformIcon}
                width={16}
                height={16}
                alt="X"
              />
            </div>
          }
        />
        <OntonExpandableInput
          label="Bio"
          name="org_bio"
          value={values.org_bio}
          onChange={handleChange}
        />
        <div className="mt-4 pt-2 -mx-4 px-3 shadow-[0px_-1px_4px_0px_#0000001A]">
          <Button
            className="py-5 mb-3 !rounded-[10px]"
            onClick={() => handleSubmit()}
            disabled={isSubmitting}
          >
            Save Changes
          </Button>
          <button type='button' onClick={goBack} className='w-full rounded-[10px] px-4 py-2 border-2 border-[#007AFF] text-[#007aff] font-semibold uppercase text-sm'>
            Discard
          </button>
        </div>
      </div>
    </form>
  );
}

const OntonInput = ({
  name,
  label,
  value,
  onChange,
  error,
  className,
  startAdornment,
}: {
  name: string;
  label: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  error?: string;
  className?: string;
  startAdornment?: ReactNode;
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={className}>
      <div className="flex gap-3">
        {startAdornment}
        <InternalInputWrapper
          active={isFocused || !!value}
          label={label}
          error={!!error}
          className="w-full"
        >
          <input
            type="text"
            name={name}
            value={value}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full h-11 leading-5.5 bg-transparent px-4 pt-4 pb-1 focus:outline-none"
          />
        </InternalInputWrapper>
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

const OntonExpandableInput = ({
  label,
  value,
  name,
  onChange,
  className,
}: {
  label: string;
  value: string;
  name: string;
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
        name={name}
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
  error,
}: {
  className?: string;
  active: boolean;
  label: string;
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div className={className}>
      <div className={cn("relative w-full bg-[#7474801F] !rounded-[10px] border", error && "border-red-500")}>
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
