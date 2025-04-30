"use client";
import React from "react";
import Typography from "@/components/Typography";
import "./_assets/genesis-onions.css";
import { Header } from "./_components/Header";
import Image from "next/image";
import { FaChevronRight } from "react-icons/fa6";
import useWebApp from "@/hooks/useWebApp";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/app/_trpc/client";
import { useTonWallet } from "@tonconnect/ui-react";

const COLORS = ["Gold", "Silver", "Bronze"];
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
  const walletAddress = useTonWallet();
  const walletInfo = trpc.campaign.getWalletInfo.useQuery(
    { walletAddress: walletAddress?.account.address as string },
    {
      enabled: Boolean(walletAddress?.account.address),
    }
  );

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
          <div className="flex flex-col gap-1">
            <div className="flex justify-center items-center gap-4 w-full">
              {COLORS.map((color) => (
                <div
                  key={color}
                  className="border-b border-white p-2 gap-2 flex items-center bg-white/10 backdrop-blur-lg rounded-2lg flex-wrap"
                >
                  <Image
                    width={44}
                    height={44}
                    src={getImageUrl(color)}
                    alt={`${color} NFT`}
                    className="rounded-md aspect-square mx-auto"
                  />
                  <div className="flex flex-col text-center mx-auto">
                    <Typography
                      variant="headline"
                      weight="semibold"
                      className="mt-2"
                    >
                      x0
                    </Typography>
                    <Typography
                      variant="body"
                      weight="medium"
                      className={`text-${color.toLowerCase()} !text-[8px]`}
                    >
                      {color}
                    </Typography>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[8px] leading-4 text-center">You have a sufficient quantity of ONIONs</p>
          </div>

          {/* Merge Preview */}
          <div className="flex justify-center items-center gap-2">
            {COLORS.map((color, idx) => (
              <React.Fragment key={color}>
                <div className="border-2 border-dashed border-[#8E8E93] p-2 flex flex-wrap ms-center rounded-2lg bg-white/10 backdrop-blur-md items-center gap-2">
                  <Image
                    width={40}
                    height={40}
                    src={getImageUrl(color)}
                    alt={color}
                    className="rounded-2lg aspect-square"
                  />
                  <p className="text-xs font-semibold leading-[18px]">{color}</p>
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
              <Typography
                variant="title3"
                weight="semibold"
              >
                x0
              </Typography>
            </div>
          </div>
          <Button
            type="button"
            size="lg"
            className="w-full btn-gradient btn-shine md:w-96 px-8 py-3 rounded-lg text-white font-semibold text-lg transition-all transform focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 hover:bg-orange hover:animate-none after:bottom-0 before:top-0 relative overflow-hidden isolate"
          >
            <Typography
              variant="headline"
              weight="semibold"
            >
              Unleash the Platinum
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
                  <div
                    key={color}
                    className="relative"
                  >
                    <Image
                      width={90}
                      height={90}
                      src={getImageUrl(color)}
                      alt={`${color} NFT`}
                      className="rounded-md aspect-square"
                    />
                    <div className="flex items-center justify-center text-center absolute top-1/2 py-1.5 backdrop-blur-md bg-white/10 w-full -translate-y-1/2">
                      <Typography
                        variant="subheadline1"
                        weight="medium"
                      >
                        1x {color}
                      </Typography>
                    </div>
                  </div>
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
