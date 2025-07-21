"use client";

import MainButton from "@/app/_components/atoms/buttons/web-app/MainButton";
import DataStatus from "@/app/_components/molecules/alerts/DataStatus";
import ManageEventCard from "@/app/_components/organisms/events/manageEvent/ManageEventCard";
import { trpc } from "@/app/_trpc/client";
import Typography from "@/components/Typography";
import { AlertGeneric } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { UploadImageFile } from "@/components/ui/upload-file";
import { UploadVideoFile } from "@/components/ui/upload-video-file";
import { useGetEvent } from "@/hooks/events.hooks";
import { cn } from "@/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Address } from "@ton/core";
import { Minus, Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const formValidationSchema = z.object({
  title: z.string({ message: "Title is required" }).min(1, "Title is required"),

  description: z.string({ message: "Description is required" }).min(1, "Description is required"),

  bought_capacity: z.number({ message: "Capacity is required" }).min(1, "Capacity is required"),

  price: z.number({ message: "Price is required" }).min(0.1, "Price at least should be 0.1 or higher."),

  // event uuid
  event_uuid: z.string({ message: "Event uuid is required" }).uuid(),

  // recipient address
  recipient_address: z.string({ message: "Recipient address is required" }).refine((v) => {
    try {
      Address.parse(v);
      return true;
    } catch (error) {
      return false;
    }
  }, "Invalid recipient address"),

  // nft image
  ticket_image: z.string({ message: "NFT image is required" }).url(),

  // video
  ticket_video: z.string({ message: "Video is required" }).url().optional(),
});

type FormValuesType = z.infer<typeof formValidationSchema>;

export default function NewTicketDefinition() {
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);

  const params = useParams<{ hash: string }>();
  const router = useRouter();

  const eventData = useGetEvent(params.hash);

  const form = useForm({
    resolver: zodResolver(formValidationSchema),
    defaultValues: {
      event_uuid: params.hash,
      bought_capacity: 10,
      price: 1,
    },
  });

  const addTicketMutation = trpc.events.addTicket.useMutation({
    onError: (error) => {
      console.log("Error", error);
      toast.error(error.message);
    },
    onSuccess: (data) => {
      console.log("Success", data);
      router.push(`/events/${params.hash}/manage/tickets`);
      toast.success("Ticket added successfully");
    },
  });

  const incrementPrice = () => {
    const prev = Number(form.getValues("price") || 0);
    form.setValue("price", Math.round(Math.max(0.1, prev + 1) * 10) / 10);
  };

  const decrementPrice = () => {
    const prev = Number(form.getValues("price") || 0);
    form.setValue("price", Math.round(Math.max(0.1, prev - 1) * 10) / 10);
  };

  const handleSubmit = (values: FormValuesType) => {
    addTicketMutation.mutate(values);
  };

  console.log("Form Errors", form.formState.errors);

  if (eventData.isLoading) {
    return <DataStatus status="pending" />;
  }

  if (eventData.isError) {
    return <DataStatus status="danger" />;
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      <div className="min-h-screen bg-[#efeff4] p-4 flex flex-col gap-4">
        <Typography
          variant="title3"
          weight="medium"
        >
          New Ticket Definition
        </Typography>

        <ManageEventCard>
          <div className="space-y-6">
            {/* Title Field */}
            <Input
              label="TITLE"
              placeholder="Ticket's name"
              type="text"
              errors={form.formState.errors.title?.message}
              {...form.register("title")}
            />

            {/* Description Field */}
            <Input
              label="DESCRIPTION"
              placeholder="Ticket's Description"
              type="text"
              errors={form.formState.errors.description?.message}
              {...form.register("description")}
            />

            {/* Recipient Field */}
            <Input
              label="RECIPIENT"
              placeholder="Recipient's Address"
              type="text"
              errors={form.formState.errors.recipient_address?.message}
              {...form.register("recipient_address")}
            />

            {/* Ticket Price Field */}
            <div>
              <label className="px-4 flex-1 font-normal text-[13px] leading-4 tracking-normal uppercase text-[#3C3C4399]">
                TICKET PRICE
              </label>
              <div className="flex items-center bg-brand-divider rounded-lg h-10">
                <div className="flex-1 px-4">
                  <Typography
                    variant="body"
                    weight="medium"
                  >
                    <input
                      inputMode="decimal"
                      type="number"
                      step="0.1"
                      className="bg-transparent"
                      {...form.register("price", {
                        valueAsNumber: true,
                      })}
                    />{" "}
                    {eventData.data.payment_type}
                  </Typography>
                </div>
                <div className="flex items-center gap-2 pr-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={decrementPrice}
                    className="h-6 w-6 p-0 bg-[#d9d9d9] hover:bg-[#c6c6c8] rounded"
                  >
                    <Minus className="h-4 w-4 text-[#575757]" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={incrementPrice}
                    className="h-6 w-6 p-0 bg-[#d9d9d9] hover:bg-[#c6c6c8] rounded"
                  >
                    <Plus className="h-4 w-4 text-[#575757]" />
                  </Button>
                </div>
              </div>
              {form.formState.errors.price?.message && (
                <p className="text-red-500 text-sm">{form.formState.errors.price?.message}</p>
              )}
            </div>

            {/* Capacity Field */}
            <Input
              label="CAPACITY"
              placeholder="Ticket's amount for distribution"
              type="text"
              errors={form.formState.errors.bought_capacity?.message}
              {...form.register("bought_capacity", {
                valueAsNumber: true,
              })}
            />
          </div>
        </ManageEventCard>

        {/* Ticket Media*/}
        <ManageEventCard>
          {/* Second Info Alert */}
          <AlertGeneric variant="info-light">Ticket's media cannot be changed once ticket is created.</AlertGeneric>

          {/* Ticket Image Upload */}
          <div className="flex flex-col gap-3">
            <Typography
              variant="callout"
              weight="semibold"
            >
              Ticket Image
            </Typography>
            <UploadImageFile
              triggerText="Upload Ticket's Image"
              drawerDescriptionText="Upload your ticket's image from your device"
              infoText={"This image is used for the Ticket"}
              isError={!!form.formState.errors.ticket_image?.message}
              changeText="Change Image"
              onImageChange={(fileUrl) => {
                form.setValue("ticket_image", fileUrl);
                form.clearErrors("ticket_image");
              }}
            />
          </div>

          {/* Ticket Video */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Typography
                variant="callout"
                weight="semibold"
              >
                Ticket Video
              </Typography>
              <Switch
                checked={isVideoEnabled}
                onCheckedChange={setIsVideoEnabled}
              />
            </div>
            <div className={cn("space-y-3", !isVideoEnabled ? "hidden" : "")}>
              <AlertGeneric variant="info-light">
                Only mp4 file is allowed, and the file size must be under 5 MB.
              </AlertGeneric>
              <UploadVideoFile
                triggerText="Upload Ticket's Video"
                drawerDescriptionText="Upload your ticket's video from your device"
                infoText={"This video is used for Ticket"}
                isError={!!form.formState.errors.ticket_video?.message}
                changeText="Change Video"
                onVideoChange={(fileUrl) => {
                  form.setValue("ticket_video", fileUrl);
                  form.clearErrors("ticket_video");
                }}
              />
            </div>
          </div>
        </ManageEventCard>
      </div>
      <MainButton
        text="Create Ticket"
        disabled={addTicketMutation.isPending || addTicketMutation.isSuccess}
        color={addTicketMutation.isPending || addTicketMutation.isSuccess ? "secondary" : undefined}
        onClick={() => {
          form.handleSubmit(handleSubmit)();
        }}
      />
    </form>
  );
}
