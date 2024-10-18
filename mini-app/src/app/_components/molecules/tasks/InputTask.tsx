import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import useWebApp from "@/hooks/useWebApp";
import React, { useEffect, useRef, useState } from "react";
import { z } from "zod";
import GenericTask from "./GenericTask";

const passwordSchema = z
  .string()
  .min(4, "Try again: Password must be at least 4 characters long");

const InputTypeCampaignTask: React.FC<{
  title: string;
  description: string;
  completed: boolean;
  defaultEmoji: string;
  data: string | null;
  fieldId: number;
  eventId: number;
}> = ({
  title,
  description,
  completed,
  defaultEmoji,
  data,
  fieldId,
  eventId,
}) => {
  const WebApp = useWebApp();
  const hapticFeedback = WebApp?.HapticFeedback;
  const validatedData = trpc.users.validateUserInitData.useQuery(
    WebApp?.initData ?? "",
    {
      queryKey: ["users.validateUserInitData", WebApp?.initData ?? ""],
      enabled: !!WebApp?.initData && WebApp?.initData !== "",
    }
  );
  const [inputText, setInputText] = useState(data);
  const [isCompleted, setIsCompleted] = useState(completed);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editingRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const trpcUtils = trpc.useUtils();
  const isSecretPhrase = title === "secret_phrase_onton_input";

  if (isSecretPhrase && isCompleted) {
    description = "Your event password is saved";
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        editingRef.current &&
        !editingRef.current.contains(event.target as Node)
      ) {
        hapticFeedback?.notificationOccurred("error");
        setIsEditing(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setInputText(data);
  }, [data]);

  const upsertUserEventFieldMutation =
    trpc.userEventFields.upsertUserEventField.useMutation({
      onError: (error) => {
        hapticFeedback?.notificationOccurred("error");
        setError(error.message);
        setIsCompleted(false);
      },
      onSuccess: () => {
        setError(null);
        hapticFeedback?.notificationOccurred("success");
        setIsCompleted(true);
        trpcUtils.userEventFields.invalidate();
        trpcUtils.users.getVisitorReward.invalidate({}, { refetchType: "all" });
      },
    });

  const handleConfirm = (value?: string) => {
    setIsEditing(false);

    if (!validatedData.data?.valid || !WebApp?.initData) {
      hapticFeedback?.notificationOccurred("error");
      return;
    }

    try {
      passwordSchema.parse(value ?? inputText); // Validate the password using Zod
    } catch (validationError: any) {
      setError(validationError.errors[0].message); // Display the first error message
      hapticFeedback?.notificationOccurred("error");
      return;
    }

    if (inputText || value) {
      upsertUserEventFieldMutation.mutate({
        init_data: WebApp.initData,
        field_id: fieldId,
        data: value ?? inputText!,
        event_id: eventId,
      });
    }
  };

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputText(e.target.value);
    setError(null); // Clear the error when the user types
  }

  return (
    <div>
      {!isEditing || isCompleted ? (
        <div
          onClick={() => {
            setIsEditing(true);
            hapticFeedback?.impactOccurred("medium");
          }}
        >
          <GenericTask
            title={title}
            description={description}
            isError={Boolean(error)}
            errorMessage={error ?? undefined}
            completed={isCompleted}
            defaultEmoji={defaultEmoji}
          />
        </div>
      ) : (
        <form
          className="my-4 rounded-[14px] p-4 border border-separator flex flex-col"
          ref={editingRef}
          onSubmit={(e) => {
            e.preventDefault();
            handleConfirm();
          }}
        >
          <input
            className="w-full h-10 rounded-lg border border-separator p-2 mb-4"
            type="text"
            inputMode="text"
            placeholder="Enter password"
            value={inputText || ""}
            onChange={handleInputChange}
            autoFocus
            ref={inputRef}
            onBlur={() => {
              if (window.innerHeight === window.outerHeight) {
                handleConfirm();
              }
            }}
          />
          {error && <p className="text-red-500 mb-4">{error}</p>}{" "}
          {/* Error message */}
          <Button
            type="submit"
            variant="primary"
            size="sm"
          >
            Submit
          </Button>
        </form>
      )}
    </div>
  );
};

export default InputTypeCampaignTask;
