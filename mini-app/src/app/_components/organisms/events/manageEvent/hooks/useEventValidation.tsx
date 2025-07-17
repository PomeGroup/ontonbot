import { EventDataSchema, UpdateEventDataSchema } from "@/types";
import { useCreateEventStore } from "@/zustand/createEventStore";
import { useRouter } from "next/navigation";
import { FiAlertCircle } from "react-icons/fi";
import { toast } from "sonner";
import { ZodError } from "zod";

/**
 * Shared validation & preparation logic for both creating and updating an event.
 * Bundling this in a single hook allows us to reuse the same code in multiple
 * places (e.g. submission component & overview page) while keeping all Zustand
 * state-management calls in one spot.
 */
export const useEventValidation = () => {
  const {
    eventData,
    editOptions,
    setAttendanceStepErrors,
    setGeneralStepErrors,
    clearAttendanceStepErrors,
    clearGeneralStepErrors,
  } = useCreateEventStore((s) => ({
    eventData: s.eventData,
    editOptions: s.edit,
    setAttendanceStepErrors: s.setAttendanceStepErrors,
    setGeneralStepErrors: s.setGeneralStepErrors,
    clearAttendanceStepErrors: s.clearAttendanceStepErrors,
    clearGeneralStepErrors: s.clearGeneralStepErrors,
  }));

  const router = useRouter();

  /* ----------------------------- helpers ----------------------------- */

  const handleValidationErrors = (error: ZodError, context: string) => {
    const errors = error.flatten().fieldErrors;
    console.error(`${context} validation errors:`, errors);

    const errorMessages = Object.entries(errors).flatMap(([field, messages]) =>
      messages?.map((msg, idx) => (
        <div key={`${field}-${idx}`}>
          {field}: {msg}
        </div>
      ))
    );

    toast.error(errorMessages);
  };

  /**
   * Custom SBT reward requires both image & video.
   * Returns `true` if valid, otherwise shows toast + stores errors.
   */
  const validateCustomSBT = (): boolean => {
    const sbtOption = eventData.reward.type;
    if (sbtOption === "custom" && (!eventData?.ts_reward_url || !eventData?.video_url)) {
      const errors = {
        ts_reward_url: !eventData?.ts_reward_url ? ["Please upload a reward image."] : undefined,
        video_url: !eventData?.video_url ? ["Please upload a video."] : undefined,
      };
      setAttendanceStepErrors(errors);
      toast.error(
        <div className="flex items-center">
          <FiAlertCircle className="mr-2" />
          Please upload both an image and a video for your custom SBT reward.
        </div>,
        { duration: 5000 }
      );
      return false;
    }
    return true;
  };

  /**
   * Convert string fields to the correct type etc. Used by both create & update.
   */
  const normalisePaidEvent = (data: typeof eventData) => {
    if (data.paid_event?.has_payment) {
      // NOTE: there used to be a middleware for paid event data
      return data;
    }
    return data;
  };

  /* --------------------------- main handlers -------------------------- */

  const validateForCreate = () => {
    if (!validateCustomSBT()) return { success: false as const };

    clearGeneralStepErrors();
    const dataToSubmit = normalisePaidEvent({ ...eventData });
    const parsed = EventDataSchema.safeParse(dataToSubmit);

    if (parsed.success) {
      clearGeneralStepErrors();
      clearAttendanceStepErrors();
      return { success: true as const, data: parsed.data };
    }

    handleValidationErrors(parsed.error, "Create event");
    setGeneralStepErrors(parsed.error.flatten().fieldErrors);
    setAttendanceStepErrors(parsed.error.flatten().fieldErrors);
    return { success: false as const };
  };

  const validateForUpdate = () => {
    const dataToSubmit = normalisePaidEvent({ ...eventData });
    const parsed = UpdateEventDataSchema.safeParse(dataToSubmit);

    if (parsed.success) {
      clearGeneralStepErrors();
      clearAttendanceStepErrors();
      return { success: true as const, data: parsed.data };
    }

    handleValidationErrors(parsed.error, "Update event");
    setGeneralStepErrors(parsed.error.flatten().fieldErrors);
    setAttendanceStepErrors(parsed.error.flatten().fieldErrors);
    return { success: false as const };
  };

  /**
   * Can be used from Overview page to ensure data is valid on mount. If invalid
   * we navigate the user back (default behaviour) or to a custom path.
   */
  const ensureValidOrRedirect = (opts?: { redirectPath?: string }) => {
    const mode = editOptions?.eventHash ? "update" : "create";
    const redirectPath = opts?.redirectPath || "/";

    const result = mode === "create" ? validateForCreate() : validateForUpdate();
    if (!result.success) {
      if (redirectPath) {
        router.replace(redirectPath);
      } else {
        router.back();
      }
    }
    return result;
  };

  return {
    validateForCreate,
    validateForUpdate,
    ensureValidOrRedirect,
  };
};
