"use client";
import Typography from "@/components/Typography";
import "./_assets/genesis-onions.css";
import { Header } from "./_components/Header";
import Image from "next/image";
import { FaChevronRight } from "react-icons/fa6";
import useWebApp from "@/hooks/useWebApp";

export default function GenesisOnions() {
  const webapp = useWebApp();

  return (
    <div>
      <Header />
      <main
        className="bg-navy text-white min-h-screen p-4 flex flex-col gap-5"
        style={{
          background: "radial-gradient(69.74% 28.27% at 50% 33.25%, #31517B 0%, #0A1C33 100%)",
        }}
      >
        <div className="flex gap-4">
          <button
            onClick={() => {
              webapp?.openLink(
                "https://getgems.io/genesisonions?filter=%7B%22attributes%22%3A%7B%22color%22%3A%5B%22Gold%22%5D%7D%7D"
              );
            }}
            className="border border-white p-2 flex flex-col gap-0.5 justify-center items-center bg-white/10 rounded-md backdrop-blur-lg w-full"
          >
            <Image
              width={40}
              height={40}
              src="https://storage.onton.live/ontonimage/on_gold.jpg"
              alt="NFT"
              className="rounded-md aspect-square"
            />
            <Typography
              variant="body"
              weight="medium"
              className="flex items-center gap-2 justify-center"
            >
              Gold <FaChevronRight size={12} />
            </Typography>
          </button>
          <button
            onClick={() => {
              webapp?.openLink(
                "https://getgems.io/genesisonions?filter=%7B%22attributes%22%3A%7B%22color%22%3A%5B%22Silver%22%5D%7D%7D"
              );
            }}
            className="border border-white p-2 flex flex-col gap-0.5 justify-center items-center bg-white/10 rounded-md backdrop-blur-lg w-full"
          >
            <Image
              width={40}
              height={40}
              src="https://storage.onton.live/ontonimage/on_silver.jpg"
              alt="NFT"
              className="rounded-md aspect-square"
            />
            <Typography
              variant="body"
              weight="medium"
              className="flex items-center gap-2 justify-center"
            >
              Silver <FaChevronRight size={12} />
            </Typography>
          </button>
          <button
            onClick={() => {
              webapp?.openLink(
                "https://getgems.io/genesisonions?filter=%7B%22attributes%22%3A%7B%22color%22%3A%5B%22Bronze%22%5D%7D%7D"
              );
            }}
            className="border border-white p-2 flex flex-col gap-0.5 justify-center items-center bg-white/10 rounded-md backdrop-blur-lg w-full"
          >
            <Image
              width={40}
              height={40}
              src="https://storage.onton.live/ontonimage/on_bronze.jpg"
              alt="NFT"
              className="rounded-md aspect-square"
            />
            <Typography
              variant="body"
              weight="medium"
              className="flex items-center gap-2 justify-center"
            >
              Bronze <FaChevronRight size={12} />
            </Typography>
          </button>
        </div>
        <div className="p-4 backdrop-blur-lg bg-white/10 rounded-md flex-col flex gap-3 items-center justify-center"></div>
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
                <div className="relative">
                  <Image
                    width={90}
                    height={90}
                    src="https://storage.onton.live/ontonimage/on_gold.jpg"
                    alt="NFT"
                    className="rounded-md aspect-square"
                  />
                  <div className="flex items-center justify-center text-center absolute top-1/2 py-1.5 backdrop-blur-md bg-white/10 w-full -translate-y-1/2">
                    <Typography
                      variant="subheadline1"
                      weight="medium"
                    >
                      1x Gold
                    </Typography>
                  </div>
                </div>
                <div className="relative">
                  <Image
                    width={90}
                    height={90}
                    src="https://storage.onton.live/ontonimage/on_silver.jpg"
                    alt="NFT"
                    className="rounded-md aspect-square"
                  />
                  <div className="flex items-center justify-center text-center absolute top-1/2 py-1.5 backdrop-blur-md bg-white/10 w-full -translate-y-1/2">
                    <Typography
                      variant="subheadline1"
                      weight="medium"
                    >
                      1x Silver
                    </Typography>
                  </div>
                </div>
                <div className="relative">
                  <Image
                    width={90}
                    height={90}
                    src="https://storage.onton.live/ontonimage/on_bronze.jpg"
                    alt="NFT"
                    className="rounded-md aspect-square"
                  />
                  <div className="flex items-center justify-center text-center absolute top-1/2 py-1.5 backdrop-blur-md bg-white/10 w-full -translate-y-1/2">
                    <Typography
                      variant="subheadline1"
                      weight="medium"
                    >
                      1x Bronze
                    </Typography>
                  </div>
                </div>
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
                  src="https://storage.onton.live/ontonimage/on_platinum.jpg"
                  alt="NFT"
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
            <div className="flex justify-center gap-2 items-center">
              <Image
                src="https://storage.onton.live/ontonimage/onion_badge.png"
                width={80}
                height={80}
                alt="onion"
              />
              <Typography
                variant="footnote"
                weight="normal"
                className="text-balance"
              >
                The merging process is assured and will consume the three NFTs you provide.
              </Typography>
            </div>
            <div className="flex justify-center gap-2 items-center flex-row-reverse">
              <Image
                src="https://storage.onton.live/ontonimage/onion_badege_2.png"
                width={80}
                height={80}
                alt="onion"
              />
              <Typography
                variant="footnote"
                weight="normal"
                className="text-balance"
              >
                Platinums provide the ultimate benefits within the ONTON and ONION ecosystems.
              </Typography>
            </div>
            <div className="flex justify-center gap-2 items-center">
              <Image
                src="https://storage.onton.live/ontonimage/onion_badge_3.png"
                width={80}
                height={80}
                alt="onion"
              />
              <Typography
                variant="footnote"
                weight="normal"
                className="text-balance"
              >
                Merging can only be done after minting through the ONTON Mini App.
              </Typography>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
