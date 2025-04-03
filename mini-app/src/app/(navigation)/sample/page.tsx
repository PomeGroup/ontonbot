"use client";
import React, { useState, useEffect } from "react";
import { trpc } from "@/app/_trpc/client"; // your TRPC client
import { CampaignType, campaignTypes, paymentTypes } from "@/db/schema";
import { TonConnectButton, useTonAddress, useTonConnectModal } from "@tonconnect/ui-react";
import { toast } from "sonner"; // or any toast library
import { useUserStore } from "@/context/store/user.store"; // adjust path
import { Button } from "konsta/react";
import Image from "next/image";
import tonIcon from "@/components/icons/ton.svg";
import OntonDialog from "@/components/OntonDialog"; // from your snippet
import { Card } from "konsta/react";
import Typography from "@/components/Typography";

// ====================== //
//   CONNECT WALLET CARD  //
// ====================== //
function ConnectWalletCard() {
  const [isOpen, setOpen] = useState(false);

  const hasWallet = !!useTonAddress();

  return (
    <Card className="w-full !mx-0 p-4 mb-8 border border-gray-300 rounded shadow-sm">
      <Typography
        bold
        variant="headline"
        className="mb-4"
      >
        Your Wallet
      </Typography>

      <ConfirmConnectDialog
        open={isOpen}
        onClose={() => setOpen(false)}
      />

      {hasWallet ? (
        <TonConnectButton className="mx-auto" />
      ) : (
        <Button
          className="py-4 rounded-[10px] w-full bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => setOpen(true)}
        >
          <Image
            className="mr-2 inline-block"
            src={tonIcon}
            alt=""
            width={15}
            height={15}
          />
          Connect your Wallet
        </Button>
      )}
    </Card>
  );
}

// =========================== //
//  CONFIRM CONNECT DIALOG    //
// =========================== //
function ConfirmConnectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const walletModal = useTonConnectModal();
  const tonWalletAddress = useTonAddress();
  const { user } = useUserStore();
  const addWalletMutation = trpc.users.addWallet.useMutation({
    onSuccess: () => {
      // any invalidations if needed
      onClose();
    },
  });

  useEffect(() => {
    if (!user?.user_id) return;
    if (tonWalletAddress) {
      // user has connected wallet or changed wallet
      onClose();
      if (!user?.wallet_address) {
        // If user doesn't have a wallet in DB, update
        toast.success("Your wallet is now connected");
        addWalletMutation.mutate({
          wallet: tonWalletAddress,
        });
      }
    }
  }, [user, tonWalletAddress, addWalletMutation, onClose]);

  const handleConnect = () => {
    walletModal.open();
  };

  return (
    <OntonDialog
      open={open}
      onClose={onClose}
      title="Connect your wallet"
    >
      <Typography
        variant="body"
        className="text-center mb-6 font-normal"
      >
        <b>You are becoming an ONTON organizer.</b>
        <br />
        To create a channel and use special event publishing features, you need to pay 10 TON
      </Typography>
      <Button
        className="py-4 rounded-[10px] mb-3 bg-blue-600 text-white w-full"
        onClick={handleConnect}
      >
        Connect Wallet
      </Button>
      <Button
        className="py-4 rounded-[10px] w-full"
        outline
        onClick={onClose}
      >
        Maybe Later
      </Button>
    </OntonDialog>
  );
}

// ====================== //
//   MAIN CAMPAIGN PAGE   //
// ====================== //
export default function CampaignTestPage() {
  const campaignTypeEnum = campaignTypes.enumValues;
  const paymentTypesEnum = paymentTypes.enumValues;

  // 1) ADD ORDER
  const [orderSpinPackageId, setOrderSpinPackageId] = useState<number>(1);
  const [orderWalletAddress, setOrderWalletAddress] = useState<string>("");
  const addOrderMutation = trpc.campaign.addOrder.useMutation();

  function handleAddOrder(e: React.FormEvent) {
    e.preventDefault();
    addOrderMutation.mutate({
      spinPackageId: orderSpinPackageId,
      walletAddress: orderWalletAddress,
    });
  }

  // 2) GET ORDER
  const [getOrderId, setGetOrderId] = useState<number>(1);
  const getOrderQuery = trpc.campaign.getOrder.useQuery({ orderId: getOrderId }, { enabled: false });

  function handleGetOrder(e: React.FormEvent) {
    e.preventDefault();
    getOrderQuery.refetch();
  }

  // 3) GET ACTIVE SPIN PACKAGES
  const [activePackagesCampaignType, setActivePackagesCampaignType] = useState<string>(campaignTypeEnum[0]);
  const getActivePackagesQuery = trpc.campaign.getActiveSpinPackagesByCampaignType.useQuery(
    { campaignType: activePackagesCampaignType as any },
    { enabled: false }
  );

  function handleGetActivePackages(e: React.FormEvent) {
    e.preventDefault();
    getActivePackagesQuery.refetch();
  }

  // 4) SPIN FOR NFT
  const [spinCampaignType, setSpinCampaignType] = useState<string>(campaignTypeEnum[0]);
  const spinMutation = trpc.campaign.spinForNft.useMutation();

  function handleSpin(e: React.FormEvent) {
    e.preventDefault();
    spinMutation.mutate({
      campaignType: spinCampaignType as CampaignType,
    });
  }

  // 5) GET USER COLLECTIONS
  const [collectionsCampaignType, setCollectionsCampaignType] = useState<string>(campaignTypeEnum[0]);
  const getUserCollectionsQuery = trpc.campaign.getUserCollectionsResult.useQuery(
    { campaignType: collectionsCampaignType as any },
    { enabled: false }
  );

  function handleGetUserCollections(e: React.FormEvent) {
    e.preventDefault();
    getUserCollectionsQuery.refetch();
  }

  // 6) GET COLLECTIONS BY TYPE
  const [collectionsByType, setCollectionsByType] = useState<string>(campaignTypeEnum[0]);
  const getCollectionsByTypeQuery = trpc.campaign.getCollectionsByCampaignType.useQuery(
    { campaignType: collectionsByType as any },
    { enabled: false }
  );

  function handleGetCollections(e: React.FormEvent) {
    e.preventDefault();
    getCollectionsByTypeQuery.refetch();
  }

  // 7) GET USER SPIN STATS
  const [statSpinPackageId, setStatSpinPackageId] = useState<number>();
  const getUserSpinStatsQuery = trpc.campaign.getUserSpinStats.useQuery(
    { spinPackageId: statSpinPackageId },
    { enabled: false }
  );

  function handleGetUserSpinStats(e: React.FormEvent) {
    e.preventDefault();
    getUserSpinStatsQuery.refetch();
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Campaign Test Page</h1>

      {/* Connect Wallet Section */}
      <ConnectWalletCard />

      {/* 1) ADD ORDER FORM */}
      <section className="mb-8 border border-gray-300 p-4 rounded shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Add Order</h2>
        <form
          onSubmit={handleAddOrder}
          className="space-y-4"
        >
          <div>
            <label className="block mb-1 font-medium">
              Spin Package ID:
              <input
                type="number"
                value={orderSpinPackageId}
                onChange={(e) => setOrderSpinPackageId(parseInt(e.target.value, 10))}
                className="block w-full mt-1 p-2 border border-gray-300 rounded bg-gray-50"
              />
            </label>
          </div>

          <div>
            <label className="block mb-1 font-medium">
              Wallet Address:
              <input
                type="text"
                value={orderWalletAddress}
                onChange={(e) => setOrderWalletAddress(e.target.value)}
                className="block w-full mt-1 p-2 border border-gray-300 rounded"
              />
            </label>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Order
          </button>
        </form>
        {addOrderMutation.isLoading && <p className="mt-2 text-gray-600">Adding order...</p>}
        {addOrderMutation.data && <p className="mt-2 text-green-600">Order created! ID: {addOrderMutation.data.id}</p>}
        {addOrderMutation.error && <p className="mt-2 text-red-600">Error: {addOrderMutation.error.message}</p>}
      </section>

      {/* 2) GET ORDER */}
      <section className="mb-8 border border-gray-300 p-4 rounded shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Get Order</h2>
        <form
          onSubmit={handleGetOrder}
          className="space-y-4"
        >
          <div>
            <label className="block mb-1 font-medium">
              Order ID:
              <input
                type="number"
                value={getOrderId}
                onChange={(e) => setGetOrderId(parseInt(e.target.value, 10))}
                className="block w-full mt-1 p-2 border border-gray-300 rounded"
              />
            </label>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Fetch Order
          </button>
        </form>
        {getOrderQuery.isFetching && <p className="mt-2 text-gray-600">Loading order...</p>}
        {getOrderQuery.data && (
          <div className="mt-2 text-gray-800">
            <p>Order ID: {getOrderQuery.data.id}</p>
            <p>Spin Package ID: {getOrderQuery.data.spinPackageId}</p>
            <p>Status: {getOrderQuery.data.status}</p>
          </div>
        )}
        {getOrderQuery.error && <p className="mt-2 text-red-600">Error: {getOrderQuery.error.message}</p>}
      </section>

      {/* 3) GET ACTIVE SPIN PACKAGES */}
      <section className="mb-8 border border-gray-300 p-4 rounded shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Get Active Spin Packages</h2>
        <form
          onSubmit={handleGetActivePackages}
          className="space-y-4"
        >
          <div>
            <label className="block mb-1 font-medium">
              Campaign Type:
              <select
                value={activePackagesCampaignType}
                onChange={(e) => setActivePackagesCampaignType(e.target.value)}
                className="block w-full mt-1 p-2 border border-gray-300 rounded bg-white"
              >
                {campaignTypeEnum.map((ct) => (
                  <option
                    key={ct}
                    value={ct}
                  >
                    {ct}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Fetch Active Packages
          </button>
        </form>
        {getActivePackagesQuery.isFetching && <p className="mt-2 text-gray-600">Loading spin packages...</p>}
        {getActivePackagesQuery.data && (
          <ul className="mt-2 list-disc list-inside text-gray-800">
            {getActivePackagesQuery.data.map((pkg) => (
              <li key={pkg.id}>
                ID: {pkg.id}, Name: {pkg.name}, Active: {pkg.active ? "Yes" : "No"}
              </li>
            ))}
          </ul>
        )}
        {getActivePackagesQuery.error && <p className="mt-2 text-red-600">Error: {getActivePackagesQuery.error.message}</p>}
      </section>

      {/* 4) SPIN FOR NFT */}
      <section className="mb-8 border border-gray-300 p-4 rounded shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Spin For NFT</h2>
        <form
          onSubmit={handleSpin}
          className="space-y-4"
        >
          <div>
            <label className="block mb-1 font-medium">
              Campaign Type:
              <select
                value={spinCampaignType}
                onChange={(e) => setSpinCampaignType(e.target.value)}
                className="block w-full mt-1 p-2 border border-gray-300 rounded bg-white"
              >
                {campaignTypeEnum.map((ct) => (
                  <option
                    key={ct}
                    value={ct}
                  >
                    {ct}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Spin!
          </button>
        </form>
        {spinMutation.isLoading && <p className="mt-2 text-gray-600">Spinning...</p>}
        {spinMutation.data && (
          <div className="mt-2 text-gray-800">
            <p>Random NFT Collection: {spinMutation.data.name}</p>
            <p>Description: {spinMutation.data.description}</p>
          </div>
        )}
        {spinMutation.error && <p className="mt-2 text-red-600">Error: {spinMutation.error.message}</p>}
      </section>

      {/* 5) GET USER COLLECTIONS RESULT */}
      <section className="mb-8 border border-gray-300 p-4 rounded shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Get User Collections Result</h2>
        <form
          onSubmit={handleGetUserCollections}
          className="space-y-4"
        >
          <div>
            <label className="block mb-1 font-medium">
              Campaign Type:
              <select
                value={collectionsCampaignType}
                onChange={(e) => setCollectionsCampaignType(e.target.value)}
                className="block w-full mt-1 p-2 border border-gray-300 rounded bg-white"
              >
                {campaignTypeEnum.map((ct) => (
                  <option
                    key={ct}
                    value={ct}
                  >
                    {ct}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Fetch Collections Result
          </button>
        </form>
        {getUserCollectionsQuery.isFetching && <p className="mt-2 text-gray-600">Loading user collections...</p>}
        {getUserCollectionsQuery.data && (
          <ul className="mt-2 list-disc list-inside text-gray-800">
            {getUserCollectionsQuery.data.map((col) => (
              <li key={col.id}>
                Collection ID: {col.id}, Name: {col.name}, Count: {col.count}
              </li>
            ))}
          </ul>
        )}
        {getUserCollectionsQuery.error && (
          <p className="mt-2 text-red-600">Error: {getUserCollectionsQuery.error.message}</p>
        )}
      </section>

      {/* 6) GET COLLECTIONS BY CAMPAIGN TYPE */}
      <section className="mb-8 border border-gray-300 p-4 rounded shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Get Collections By Campaign Type</h2>
        <form
          onSubmit={handleGetCollections}
          className="space-y-4"
        >
          <div>
            <label className="block mb-1 font-medium">
              Campaign Type:
              <select
                value={collectionsByType}
                onChange={(e) => setCollectionsByType(e.target.value)}
                className="block w-full mt-1 p-2 border border-gray-300 rounded bg-white"
              >
                {campaignTypeEnum.map((ct) => (
                  <option
                    key={ct}
                    value={ct}
                  >
                    {ct}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Fetch Collections
          </button>
        </form>
        {getCollectionsByTypeQuery.isFetching && <p className="mt-2 text-gray-600">Loading collections...</p>}
        {getCollectionsByTypeQuery.data && (
          <ul className="mt-2 list-disc list-inside text-gray-800">
            {getCollectionsByTypeQuery.data.map((col) => (
              <li key={col.id}>
                ID: {col.id}, Name: {col.name}, Address: {col.address}
              </li>
            ))}
          </ul>
        )}
        {getCollectionsByTypeQuery.error && (
          <p className="mt-2 text-red-600">Error: {getCollectionsByTypeQuery.error.message}</p>
        )}
      </section>

      {/* 7) GET USER SPIN STATS */}
      <section className="mb-8 border border-gray-300 p-4 rounded shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Get User Spin Stats</h2>
        <form
          onSubmit={handleGetUserSpinStats}
          className="space-y-4"
        >
          <div>
            <label className="block mb-1 font-medium">
              Spin Package ID (optional):
              <input
                type="number"
                value={statSpinPackageId ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setStatSpinPackageId(val === "" ? undefined : parseInt(val, 10));
                }}
                placeholder="Leave blank for all packages"
                className="block w-full mt-1 p-2 border border-gray-300 rounded bg-gray-50"
              />
            </label>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Get Spin Stats
          </button>
        </form>
        {getUserSpinStatsQuery.isFetching && <p className="mt-2 text-gray-600">Loading spin stats...</p>}
        {getUserSpinStatsQuery.data && (
          <div className="mt-2 text-gray-800">
            <p>Used: {getUserSpinStatsQuery.data.used}</p>
            <p>Remaining: {getUserSpinStatsQuery.data.remaining}</p>
          </div>
        )}
        {getUserSpinStatsQuery.error && <p className="mt-2 text-red-600">Error: {getUserSpinStatsQuery.error.message}</p>}
      </section>
    </div>
  );
}
