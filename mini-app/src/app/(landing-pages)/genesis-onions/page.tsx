"use client";

import { trpc } from "@/app/_trpc/client";
import Typography from "@/components/Typography";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useConfig } from "@/context/ConfigContext";
import useWebApp from "@/hooks/useWebApp";
import { CampaignNFT } from "@/types/campaign.types";
import { Address, beginCell, toNano } from "@ton/core";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import Image from "next/image";
import React from "react";
import { FaChevronRight } from "react-icons/fa6";
import { toast } from "sonner";
import "./_assets/genesis-onions.css";
import { Header } from "./_components/Header";
import { useUserMergeTransactionsPoll } from "@/app/(navigation)/sample/useUserMergeTransactionsPoll";
import { cn } from "@/lib/utils";

const COLORS = ["gold", "silver", "bronze"] as const;

const getFilterUrl = (color: string) =>
  `https://getgems.io/genesisonions?filter=%7B%22attributes%22%3A%7B%22color%22%3A%5B%22${color}%22%5D%7D%7D`;

const getImageUrl = (color: string) => `https://storage.onton.live/ontonimage/on_${color.toLowerCase()}.jpg`;

const badges = [
  {
    src: "https://storage.onton.live/ontonimage/onion_badge.png",
    alt: "onion",
    text: "The merging process is assured and will consume the three NFTs you provide.",
  },
  {
    src: "https://storage.onton.live/ontonimage/onion_badege_2.png",
    alt: "onion",
    text: "Platinums provide the ultimate benefits within the ONTON and ONION ecosystems.",
    reverse: true,
  },
  {
    src: "https://storage.onton.live/ontonimage/onion_badge_3.png",
    alt: "onion",
    text: "Merging can only be done after minting through the ONTON Mini App.",
  },
];

export default function GenesisOnions() {
  const webapp = useWebApp();
  const config = useConfig();
  const walletAddress = useTonWallet();

  const [tonConnectUI] = useTonConnectUI();

  const addMergeTxMutation = trpc.campaign.addMergeTransaction.useMutation();

  const walletInfo = trpc.campaign.getWalletInfo.useQuery(
    { walletAddress: walletAddress?.account.address as string },
    {
      enabled: Boolean(walletAddress?.account.address),
    }
  );

  const goldArr = walletInfo.data?.itemsByType["1"] || [];
  const silverArr = walletInfo.data?.itemsByType["2"] || [];
  const bronzeArr = walletInfo.data?.itemsByType["3"] || [];

  const nfts = {
    gold: goldArr,
    silver: silverArr,
    bronze: bronzeArr,
  };

  const goldAbleArr = goldArr.filter((item) => item.offChain.mergeStatus === "able_to_merge");
  const silverAbleArr = silverArr.filter((item) => item.offChain.mergeStatus === "able_to_merge");
  const bronzeAbleArr = bronzeArr.filter((item) => item.offChain.mergeStatus === "able_to_merge");

  const isAbleToMerge = Boolean(goldAbleArr && silverAbleArr && bronzeAbleArr);

  const ontonAddress = config["ONTON_WALLET_ADDRESS"] as string;

  const mergeTransactions = useUserMergeTransactionsPoll(walletAddress?.account.address as string);

  /**
   * Called when user clicks "Merge one set now"
   * 1) Insert row => addMergeTransaction (status="pending")
   * 2) Then build TonConnect multi-message
   * 3) Send transaction
   * 4) Cron job sees the chain TX => sets "completed"
   */
  async function handleMergeNfts() {
    const address = walletAddress?.account.address;
    if (!isAbleToMerge || !address) {
      toast.error("No full set (gold/silver/bronze) to merge.");
      return;
    }

    const goldNft = goldArr[0] as CampaignNFT;
    const silverNft = silverArr[0] as CampaignNFT;
    const bronzeNft = bronzeArr[0] as CampaignNFT;
    try {
      // (A) Insert "pending" row in DB
      const newTx = await addMergeTxMutation.mutateAsync({
        walletAddress: address,
        goldNftAddress: goldNft.onChain?.address as string,
        silverNftAddress: silverNft.onChain?.address as string,
        bronzeNftAddress: bronzeNft.onChain?.address as string,
      });

      toast.success(`Created mergeTx #${newTx.id}, status=${newTx.status}`);

      // (B) Then build multi-message
      const messages = [
        createNftTransferMsg(goldNft),
        createNftTransferMsg(silverNft),
        createNftTransferMsg(bronzeNft),
        createMergeFlagMessage(
          `user=${walletAddress}&indexes=[${goldNft.onChain?.index},${silverNft.onChain?.index},${bronzeNft.onChain?.index}]`
        ),
      ];

      // (C) TonConnect transaction
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages,
      });
      toast.success("NFTs merge transaction submitted!");
      await walletInfo.refetch(); // re-check user items
    } catch (err) {
      console.error("Merge transaction error:", err);
      toast.error("Failed to merge NFTs or user canceled.");
    }
  }

  function createNftTransferMsg(nft: CampaignNFT) {
    const nftAddr = Address.parse(nft.onChain?.address as string);

    const bodyCell = beginCell()
      .storeUint(0x5fcc3d14, 32)
      .storeUint(0, 64)
      .storeAddress(Address.parse(ontonAddress))
      .storeAddress(null)
      .storeBit(true)
      .storeRef(
        beginCell().storeStringTail(`Name: ${nft.collectionInfo.name}\nImage: ${nft.collectionInfo.image}`).endCell()
      )
      .storeCoins(0)
      .storeBit(false)
      .endCell();

    return {
      address: nftAddr.toString(),
      amount: toNano("0.05").toString(),
      payload: bodyCell.toBoc().toString("base64"),
    };
  }
  function createMergeFlagMessage(flagComment: string) {
    const bodyCell = beginCell().storeUint(0, 32).storeStringTail(flagComment).endCell();

    return {
      address: ontonAddress,
      amount: toNano("0.005").toString(),
      payload: bodyCell.toBoc().toString("base64"),
    };
  }

  function hanldeMainButtonClick(): void {
    if (!walletAddress) {
      return;
    }

    if (isAbleToMerge) {
      void handleMergeNfts();
    } else {
      // redirect to getgems
      void webapp?.openLink("https://getgems.io/genesisonions");
    }
  }

  return (
    <div>
      <Dialog>
        <DialogTrigger>Boom</DialogTrigger>
        <DialogContent
          hideClose
          className="border-none outline-none text-white p-10 flex-col flex gap-5"
        >
          <div className="mx-auto text-center">
            <Typography variant="title2">🎉 Congratulations!</Typography>
            <Typography
              variant="subheadline1"
              weight="medium"
            >
              You created a Platinum from scratch!
            </Typography>
          </div>
          <Image
            src={getImageUrl("Platinum")}
            width={324}
            height={324}
            alt="square"
            className="mx-auto"
          />
          <Button
            type="button"
            size="lg"
            className="w-full btn-gradient btn-shine md:w-96 px-8 py-3 rounded-lg text-white font-semibold text-lg transition-all transform focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 hover:bg-orange hover:animate-none after:bottom-0 before:top-0 relative overflow-hidden isolate"
          >
            <Typography
              variant="headline"
              weight="semibold"
            >
              Keep Merging
            </Typography>
          </Button>
        </DialogContent>
      </Dialog>
      <Header />
      <main
        className="bg-navy text-white min-h-screen p-4 flex flex-col gap-5"
        style={{
          background: "radial-gradient(69.74% 28.27% at 50% 33.25%, #31517B 0%, #0A1C33 100%)",
        }}
      >
        {/* SBT Cards */}
        <div className="flex gap-4">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => webapp?.openLink(getFilterUrl(color))}
              className="border border-white p-2 flex flex-col gap-0.5 justify-center items-center bg-white/10 rounded-md backdrop-blur-lg w-full"
            >
              <Image
                width={40}
                height={40}
                src={getImageUrl(color)}
                alt={`${color} NFT`}
                className="rounded-md aspect-square"
              />
              <Typography
                variant="body"
                weight="medium"
                className="flex items-center gap-2 justify-center"
              >
                {color} <FaChevronRight size={12} />
              </Typography>
            </button>
          ))}
        </div>

        {/* Main Cards (Merge) */}
        <div className="p-4 backdrop-blur-lg bg-white/10 rounded-md flex-col flex gap-3 items-center justify-center">
          <Typography
            variant="headline"
            weight="semibold"
            className="text-center"
          >
            When ONIONs come to life
          </Typography>
          <Typography
            variant="subheadline1"
            weight="normal"
            className="text-center"
          >
            Tap on &ldquo;Unleash the Platinum&rdquo; to burn and prepare 1 Gold, 1 Silver, and 1 Bronze, then &ldquo;Merge
            to Platinum&rdquo; them to reveal an exciting new Platinum NFT!
          </Typography>

          {/* SBT Counts */}
          <div className="flex flex-col gap-1 w-full">
            <div className="flex flex-1 gap-4 w-full">
              {COLORS.map((color) => (
                <NFTCard
                  key={color}
                  color={color}
                  nftList={nfts[color] ?? []}
                />
              ))}
            </div>
            {isAbleToMerge && <p className="text-[8px] leading-4 text-center">You have a sufficient quantity of ONIONs</p>}
          </div>

          {/* Merge Preview */}
          <div className="flex w-full items-center gap-2">
            {COLORS.map((color, idx) => (
              <React.Fragment key={color}>
                <div className="flex-1 border-2 border-dashed border-[#8E8E93] p-2 flex flex-wrap ms-center rounded-2lg bg-white/10 backdrop-blur-md items-center gap-2">
                  <Image
                    width={40}
                    height={40}
                    src={getImageUrl(color)}
                    alt={color}
                    className="rounded-2lg aspect-square mx-auto"
                  />
                  <p className="text-xs font-semibold leading-[18px] mx-auto flex flex-col text-center">
                    <span className="capitalize">{color}</span>
                    {mergeTransactions.merges.filter((v) => ["pending", "processing"].includes(v.status ?? "")).length ? (
                      <span className="capitalize font-normal text-[8px] leading-3">sending...</span>
                    ) : null}
                  </p>
                </div>
                {idx < COLORS.length - 1 && <span className="text-white text-2xl font-semibold">+</span>}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-center items-center">
            <span className="text-white text-2xl font-semibold">=</span>
          </div>
          <div className="relative rounded-lg overflow-hidden">
            <Image
              width={100}
              height={100}
              src={getImageUrl("Platinum")}
              alt="Platinum NFT"
              className="rounded-md aspect-square"
            />
            <div className="absolute bottom-0 flex h-7.5 items-center gap-2 backdrop-blur-md bg-white/10 w-full justify-center text-center">
              <Typography className="!text-[8px] text-[#cbcbcb]">Platinum</Typography>
              {/* <Typography */}
              {/*   variant="title3" */}
              {/*   weight="semibold" */}
              {/* > */}
              {/*   x0 */}
              {/* </Typography> */}
            </div>
          </div>
          <Button
            type="button"
            disabled={!walletAddress}
            variant="primary-onion"
            className={cn(
              "w-full px-8 py-3 rounded-lg  isolate",
              walletAddress &&
                "btn-gradient btn-shine transition-all transform hover:animate-none after:bottom-0 before:top-0 relative overflow-hidden"
            )}
            onClick={hanldeMainButtonClick}
            size="lg"
          >
            <Typography
              variant="headline"
              weight="semibold"
            >
              {isAbleToMerge ? "Unleash the Platinum" : "Collect Sufficient ONIONs"}
            </Typography>
          </Button>
        </div>

        {/* Description Card */}
        <div className="p-4 backdrop-blur-lg bg-white/10 rounded-md flex-col flex gap-3 items-center justify-center">
          <div className="p-4 backdrop-blur-md bg-black/20 rounded-md gap-5 flex flex-col">
            <div className="flex flex-col gap-2">
              <Typography
                variant="footnote"
                className="mx-auto w-full text-center"
                weight="normal"
              >
                Required NFTs
              </Typography>
              <div className="flex justify-center gap-3 items-center">
                {COLORS.map((color) => (
                  <RequiredNft
                    key={color}
                    color={color}
                  />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2 items-center justify-center">
              <Typography
                className="text-center"
                variant="footnote"
                weight="normal"
              >
                Result
              </Typography>
              <div className="relative w-fit mx-auto">
                <Image
                  width={200}
                  height={200}
                  src={getImageUrl("Platinum")}
                  alt="Platinum NFT"
                  className="rounded-2lg aspect-square"
                />
                <div className="flex items-center justify-center text-center absolute top-1/2 py-1.5 backdrop-blur-md bg-white/10 w-full -translate-y-1/2">
                  <Typography
                    variant="callout"
                    weight="semibold"
                  >
                    💎 Platinum
                  </Typography>
                </div>
              </div>
            </div>
            <Typography
              className="text-center text-balance"
              variant="subheadline1"
              weight="medium"
            >
              Platinum NFTs can only be generated through the merging process, which requires one of each Genesis ONION NFT
              type.
            </Typography>
          </div>
          <div className="flex flex-col gap-2 px-4">
            {badges.map(({ src, alt, text, reverse }, idx) => (
              <div
                key={idx}
                className={`flex justify-center gap-2 items-center${reverse ? " flex-row-reverse" : ""}`}
              >
                <Image
                  src={src}
                  width={80}
                  height={80}
                  alt={alt}
                />
                <Typography
                  variant="footnote"
                  weight="normal"
                  className="text-balance"
                >
                  {text}
                </Typography>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function RequiredNft(props: { color: string }): React.JSX.Element {
  return (
    <div
      key={props.color}
      className="relative"
    >
      <Image
        width={90}
        height={90}
        src={getImageUrl(props.color)}
        alt={`${props.color} NFT`}
        className="rounded-md aspect-square"
      />
      <div className="flex items-center justify-center text-center absolute top-1/2 py-1.5 backdrop-blur-md bg-white/10 w-full -translate-y-1/2">
        <Typography
          variant="subheadline1"
          weight="medium"
          className="capitalize"
        >
          1x {props.color}
        </Typography>
      </div>
    </div>
  );
}

function NFTCard(props: { color: string; nftList: unknown[] }): React.JSX.Element {
  const walletAddress = useTonWallet();

  return (
    <div
      key={props.color}
      className="border-b border-white p-2 gap-2 flex items-center bg-white/10 backdrop-blur-lg rounded-2lg flex-wrap flex-1"
    >
      <Image
        width={44}
        height={44}
        src={getImageUrl(props.color)}
        alt={`${props.color} NFT`}
        className={cn("rounded-md aspect-square mx-auto", !props.nftList.length && "grayscale")}
      />
      <div className="flex flex-col text-center mx-auto">
        <Typography
          variant="headline"
          weight="semibold"
          className="mt-2"
        >
          x{walletAddress ? props.nftList.length : "?"}
        </Typography>
        <Typography
          variant="body"
          weight="medium"
          className={`text-${props.color.toLowerCase()} !text-[8px] capitalize`}
        >
          {props.color}
        </Typography>
      </div>
    </div>
  );
}
