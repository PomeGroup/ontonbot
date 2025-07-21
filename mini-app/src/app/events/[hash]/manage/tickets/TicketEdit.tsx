import { trpc } from "@/app/_trpc/client";
import Typography from "@/components/Typography";
import { AlertGeneric } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { UploadImageFile } from "@/components/ui/upload-file";
import { UploadVideoFile } from "@/components/ui/upload-video-file";
import { EventPaymentSelectType } from "@/db/schema/eventPayment";
import useWebApp from "@/hooks/useWebApp";
import { cn } from "@/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Address } from "@ton/core";
import { Minus, Pencil, Plus } from "lucide-react";
import { useParams } from "next/navigation";
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

  // ticket id
  id: z.number({ message: "Ticket id is required" }),

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

const TicketEdit = (props: { ticket: Omit<EventPaymentSelectType, "created_at" | "updatedAt"> }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const params = useParams<{ hash: string }>();
  const isVideoEnabled = !!props.ticket.ticketVideo;
  const webapp = useWebApp();

  const form = useForm({
    resolver: zodResolver(formValidationSchema),
    defaultValues: {
      event_uuid: params.hash,
      id: props.ticket.id,
      bought_capacity: props.ticket.bought_capacity,
      price: props.ticket.price,
      description: props.ticket.description,
      recipient_address: props.ticket.recipient_address,
      ticket_image: props.ticket.ticketImage ?? undefined,
      ticket_video: props.ticket.ticketVideo ?? undefined,
      title: props.ticket.title,
    },
  });

  const trpcUtils = trpc.useUtils();

  // De/Activate ticket mutation
  const activateTicketMutation = trpc.events.setTicketActive.useMutation({
    onError: (error) => {
      console.log("Error", error);
      toast.error(error.message);
    },
    onSuccess: (data) => {
      console.log("Success", data);
      toast.success(`Ticket ${props.ticket.active ? "deactivated" : "activated"} successfully`);
      trpcUtils.events.getTickets.invalidate();
      setIsDrawerOpen(false);
    },
  });

  // Update Ticket
  const updateTicketMutation = trpc.events.updateTicket.useMutation({
    onError: (error) => {
      console.log("Error", error);
      toast.error(error.message);
    },
    onSuccess: (data) => {
      console.log("Success", data);
      toast.success("Ticket updated successfully");
      trpcUtils.events.getTickets.invalidate();
      setIsDrawerOpen(false);
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

  const handleTicketActivation = () => {
    if (props.ticket.active) {
      webapp?.showConfirm(
        "If a ticket is deactivated, the original buyer can still access their tickets, but no new purchases for that ticket type will be allowed.",
        (confirmed) => {
          if (confirmed) {
            activateTicketMutation.mutate({
              event_uuid: props.ticket.event_uuid,
              id: props.ticket.id,
              active: false,
            });
          }
        }
      );
    } else {
      activateTicketMutation.mutate({
        event_uuid: props.ticket.event_uuid,
        id: props.ticket.id,
        active: true,
      });
    }
  };

  const handleSubmit = (values: FormValuesType) => {
    updateTicketMutation.mutate(values);
  };

  console.log("Form Errors", form.formState.errors);

  return (
    <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <DrawerTrigger asChild>
        <button className="p-1 hover:bg-gray-50 rounded my-auto">
          <Pencil className="w-5 h-5 text-[#007aff]" />
        </button>
      </DrawerTrigger>
      <DrawerContent title="Edit Ticket">
        <ScrollArea className="overflow-y-auto">
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col gap-4 pe-2"
          >
            {/* Ticket Info */}
            <div className="space-y-4">
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
                      {props.ticket.payment_type}
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

            {/* Ticket Media*/}
            <div className="flex flex-col gap-4">
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
                  defaultImage={props.ticket.ticketImage ?? undefined}
                  disabled={true}
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
                  <Switch checked={isVideoEnabled} />
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
                    defaultVideo={props.ticket.ticketVideo ?? undefined}
                    disabled={true}
                    onVideoChange={(fileUrl) => {
                      form.setValue("ticket_video", fileUrl);
                      form.clearErrors("ticket_video");
                    }}
                  />
                </div>
              </div>
            </div>
          </form>
        </ScrollArea>
        {/* Buttons */}
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={activateTicketMutation.isPending || activateTicketMutation.isSuccess}
            onClick={(e) => {
              e.preventDefault();
              handleTicketActivation();
            }}
          >
            {props.ticket.active ? "Stop Sale" : "Start Sale"}
          </Button>
          <Button
            type="button"
            disabled={updateTicketMutation.isPending || updateTicketMutation.isSuccess}
            onClick={(e) => {
              e.preventDefault();
              form.handleSubmit(handleSubmit)();
            }}
            variant="primary"
          >
            Save Changes
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default TicketEdit;
