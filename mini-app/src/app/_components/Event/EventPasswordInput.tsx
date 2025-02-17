import { trpc } from "@/app/_trpc/client";
import { FormEventHandler, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useEventData } from "./eventPageContext";
import PasscodeIcon from "@/components/icons/Passcode";
import MainButton from "../atoms/buttons/web-app/MainButton";
import { Input } from "@/components/ui/input";
import { useTonAddress, useTonConnectModal } from "@tonconnect/ui-react";
import { useUserStore } from "@/context/store/user.store";
import ReusableSheet from "../Sheet/ReusableSheet";
import CustomButton from "../Button/CustomButton";
import Typography from "@/components/Typography";

export const EventPasswordAndWalletInput = () => {
  const { initData, eventPasswordField, eventHash, eventData } = useEventData();
  const [isPasswordOpen, setPasswordOpen] = useState(false);

  const trpcUtils = trpc.useUtils();
  const { user } = useUserStore();
  const formRef = useRef<HTMLFormElement>(null);
  const tonWalletAddress = useTonAddress();
  const walletModal = useTonConnectModal();

  const addWalletMutation = trpc.users.addWallet.useMutation({
    onSuccess: () => {
      trpcUtils.users.getVisitorReward.invalidate({}, { refetchType: "all" });
      trpcUtils.users.getWallet.invalidate({}, { refetchType: "all" });
      trpcUtils.users.syncUser.invalidate(undefined, { refetchType: "all" });
    },
  });

  const upsertUserEventFieldMutation = trpc.userEventFields.upsertUserEventField.useMutation({
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      trpcUtils.userEventFields.getUserEventFields.refetch({
        event_hash: eventHash,
      });
      setPasswordOpen(false);
    },
  });

  useEffect(() => {
    // if user had wallet we do not want to save it
    if (!user?.wallet_address && tonWalletAddress && initData) {
      addWalletMutation.mutate({
        wallet: tonWalletAddress,
      });
    }
  }, [user?.wallet_address, tonWalletAddress, initData, addWalletMutation]);

  const submitPassword: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    // Get password field in the form
    const formData = new FormData(e.currentTarget);
    const password = formData.get("event_password") as string;
    if (initData && eventPasswordField && eventPasswordField.event_id) {
      if (password) {
        upsertUserEventFieldMutation.mutate({
          field_id: eventPasswordField.id,
          event_id: eventPasswordField.event_id,
          data: password,
        });
      } else {
        toast.error("Enter the event password");
      }
    }
  };
  const hasRegistration = eventData.data?.has_registration ?? false;

  const closePasswordModal = () => {
    setPasswordOpen(false);
  };

  return !user?.wallet_address ? (
    <MainButton
      text="Connect Wallet"
      onClick={() => {
        walletModal.open();
      }}
    />
  ) : (
    !hasRegistration && (
      <>
        <ReusableSheet
          title="Claim Your Reward"
          opened={isPasswordOpen}
          onClose={closePasswordModal}
          defaultPadding={false}
        >
          <form
            className="p-4 space-y-4"
            ref={formRef}
            onSubmit={submitPassword}
          >
            <Typography
              variant="body"
              weight="normal"
            >
              Enter the Event Password that the organizer shared to confirm your participation in the event.
            </Typography>
            <Input
              placeholder="Event password"
              name="event_password"
              type="text"
              className="bg-brand-divider placeholder:text-black/40 border-secondary-foreground/40 border"
              minLength={4}
              errors={
                upsertUserEventFieldMutation.error?.message ? [upsertUserEventFieldMutation.error?.message] : undefined
              }
              prefix_icon={<PasscodeIcon />}
            />
            <div className="pt-0 space-y-3">
              <CustomButton
                onClick={() => {
                  formRef.current?.requestSubmit();
                }}
                isLoading={upsertUserEventFieldMutation.isLoading}
              >
                Submit Password
              </CustomButton>
              <CustomButton
                variant="outline"
                onClick={closePasswordModal}
              >
                Close
              </CustomButton>
            </div>
          </form>
        </ReusableSheet>
        {!isPasswordOpen && (
          <MainButton
            text="Enter Password"
            onClick={() => {
              setPasswordOpen(true);
            }}
          />
        )}
      </>
    )
  );
};
