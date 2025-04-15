import Typography from "@/components/Typography";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import Image from "next/image";
import { FC } from "react";
import { usePlay2Win } from "./Play2WinContext";
import { Play2WinGenesisDialog } from "./Play2WinGenesisDialog";

export const P2WUnlockedDialog: FC = () => {
  const { showNFTDialog, setShowNFTDialog } = usePlay2Win();

  if (!showNFTDialog) return null;

  return (
    <Play2WinGenesisDialog
      open={showNFTDialog}
      onOpenChange={(open) => setShowNFTDialog(open)}
      title="Play2win NFT"
    >
      <div className="flex flex-col gap-4 items-center justify-center text-center">
        <div className="flex flex-col items-center justify-center text-center gap-3">
          <Image
            src="https://storage.onton.live/ontonimage/play-2-win-genesis-ticket.png"
            width={160}
            height={160}
            alt="Play2Win NFT Image"
            className="rounded-md"
          />
          <Typography variant="title3">Congrats!</Typography>
          <Typography variant="title3">You unlocked the Play2win NFT</Typography>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Typography variant="footnote">You’re now eligible for the Play2win NFT reward.</Typography>
            <Typography variant="footnote">Your NFT will be minted at May 9th.</Typography>
          </div>
          <div className="flex gap-3 items-center justify-center">
            <DialogClose asChild>
              <Button
                variant="link"
                className="text-[#5297FF]"
                onClick={() => setShowNFTDialog(false)}
              >
                <Typography
                  variant="body"
                  className="font-[600]"
                >
                  Dismiss
                </Typography>
              </Button>
            </DialogClose>
            <Button className="border border-[#51AEFF] bg-transparent py-3 px-[20.5px] hover:bg-[#3485FE]/10">
              <Typography
                variant="body"
                className="font-[600]"
              >
                Visit Collection
              </Typography>
            </Button>
          </div>
        </div>
      </div>
    </Play2WinGenesisDialog>
  );
};
