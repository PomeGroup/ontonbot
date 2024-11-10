import { trpc } from "@/app/_trpc/client";
import { FormEventHandler, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useEventData } from "./eventPageContext";
import PasscodeIcon from "@/components/icons/Passcode";
import MainButton from "../atoms/buttons/web-app/MainButton";
import { Input } from "@/components/ui/input";
import { TonConnectButton, useTonConnectUI } from "@tonconnect/ui-react";
import { useUserStore } from "@/context/store/user.store";
import { Address } from "@ton/core";

export const EventPasswordInput = () => {
  const { initData, eventPasswordField } = useEventData()
  const trpcUtils = trpc.useUtils();
  const { user } = useUserStore()
  const formRef = useRef<HTMLFormElement>(null)
  const [tonConnectUI] = useTonConnectUI()

  const addWalletMutation = trpc.users.addWallet.useMutation({
    onSuccess: () => {
      trpcUtils.users.getVisitorReward.invalidate({}, { refetchType: "all" });
      trpcUtils.users.getWallet.invalidate({}, { refetchType: "all" });
      trpcUtils.users.syncUser.invalidate({}, { refetchType: "all" });
    },
  });

  const upsertUserEventFieldMutation =
    trpc.userEventFields.upsertUserEventField.useMutation({
      onError: (error) => {
        toast.error(error.message)
      },
      onSuccess: () => {
        trpcUtils.userEventFields.invalidate();
        trpcUtils.users.getVisitorReward.invalidate({}, { refetchType: "all" });
      },
    });

  useEffect(() => {
    // if user had wallet we do not want to save it
    if (!user?.wallet_address && tonConnectUI.account?.address && initData) {
      addWalletMutation.mutate({
        init_data: initData,
        wallet: Address.parse(tonConnectUI.account.address).toString(),
      });
    }
  }, [user?.wallet_address, tonConnectUI.account?.address, initData]);


  const submitPassword: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()

    // Get password field in the form
    const formData = new FormData(e.currentTarget);
    const password = formData.get('event_password') as string;

    if (initData && eventPasswordField && eventPasswordField.event_id) {
      if (password) {
        upsertUserEventFieldMutation.mutate({
          init_data: initData,
          field_id: eventPasswordField.id,
          event_id: eventPasswordField.event_id,
          data: password
        })
      } else {
        toast.error('Enter the event password')
      }
    }
  }

  return (
    !user?.wallet_address ?
      <TonConnectButton className="mx-auto" /> :
      <form className="mt-2 space-y-1" ref={formRef} onSubmit={submitPassword}>
        <Input
          placeholder="Event password"
          name='event_password'
          autoFocus type="text"
          className="bg-muted"
          minLength={4}
          errors={upsertUserEventFieldMutation.error?.message ? [upsertUserEventFieldMutation.error?.message] : undefined}
          prefix_icon={<PasscodeIcon />}
        />
        <p className="text-muted-foreground text-xs">
          Enter the Event Password that the organizer shared
          to confirm your participation in the event.
        </p>
        <MainButton
          progress={upsertUserEventFieldMutation.isLoading}
          text="Enter Password" onClick={() => formRef.current?.requestSubmit()}
          disabled={upsertUserEventFieldMutation.isLoading}
        />
      </form>
  )
}
