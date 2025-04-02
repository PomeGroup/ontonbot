"use client";
import React, { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import { campaignTypes, paymentTypes } from "@/db/schema";
// Suppose you store your enum arrays here or anywhere accessible

export default function CampaignTestPage() {
  const campaignTypeEnum = campaignTypes.enumValues; // "nft"
  const paymentTypesEnum = paymentTypes.enumValues; // ["usd", "eth", "btc"]
  //
  // 1. ADD ORDER FORM
  //
  const [orderSpinPackageId, setOrderSpinPackageId] = useState<number>(1);
  const [orderFinalPrice, setOrderFinalPrice] = useState<number>(10);
  const [orderDefaultPrice, setOrderDefaultPrice] = useState<number>(15);
  const [orderWalletAddress, setOrderWalletAddress] = useState<string>("");
  const [orderCurrency, setOrderCurrency] = useState<string>(paymentTypesEnum[0]);

  const addOrderMutation = trpc.campaign.addOrder.useMutation();

  function handleAddOrder(e: React.FormEvent) {
    e.preventDefault();
    addOrderMutation.mutate({
      spinPackageId: orderSpinPackageId,
      finalPrice: orderFinalPrice,
      defaultPrice: orderDefaultPrice,
      walletAddress: orderWalletAddress,
      currency: orderCurrency as any,
    });
  }

  //
  // 2. GET ORDER FORM
  //
  const [getOrderId, setGetOrderId] = useState<number>(1);
  const getOrderQuery = trpc.campaign.getOrder.useQuery(
    { orderId: getOrderId },
    {
      // By default, react-query auto-fetches on mount. We'll set `enabled` to false
      // so it only fetches when you manually trigger refetch().
      enabled: false,
    }
  );

  function handleGetOrder(e: React.FormEvent) {
    e.preventDefault();
    getOrderQuery.refetch();
  }

  //
  // 3. GET ACTIVE SPIN PACKAGES FORM
  //
  const [activePackagesCampaignType, setActivePackagesCampaignType] = useState<string>(campaignTypeEnum[0]);
  const getActivePackagesQuery = trpc.campaign.getActiveSpinPackagesByCampaignType.useQuery(
    { campaignType: activePackagesCampaignType as any },
    {
      enabled: false,
    }
  );

  function handleGetActivePackages(e: React.FormEvent) {
    e.preventDefault();
    getActivePackagesQuery.refetch();
  }

  //
  // 4. SPIN FOR NFT FORM
  //
  const [spinCampaignType, setSpinCampaignType] = useState<string>(campaignTypeEnum[0]);
  const [spinPackageId, setSpinPackageId] = useState<number>(1);
  const spinMutation = trpc.campaign.spinForNft.useMutation();

  function handleSpin(e: React.FormEvent) {
    e.preventDefault();
    spinMutation.mutate({
      campaignType: spinCampaignType as any,
      spinPackageId: spinPackageId,
    });
  }

  //
  // 5. GET USER COLLECTIONS RESULT FORM
  //
  const [collectionsCampaignType, setCollectionsCampaignType] = useState<string>(campaignTypeEnum[0]);
  const getUserCollectionsQuery = trpc.campaign.getUserCollectionsResult.useQuery(
    { campaignType: collectionsCampaignType as any },
    {
      enabled: false,
    }
  );

  function handleGetUserCollections(e: React.FormEvent) {
    e.preventDefault();
    getUserCollectionsQuery.refetch();
  }

  //
  // Render UI
  //
  return (
    <div style={{ padding: "20px" }}>
      <h1>Campaign Test Page</h1>

      {/* 1) ADD ORDER FORM */}
      <section style={{ marginBottom: "2rem", border: "1px solid #ddd", padding: "1rem" }}>
        <h2>Add Order</h2>
        <form onSubmit={handleAddOrder}>
          <label>
            Spin Package ID:
            <input
              type="number"
              value={orderSpinPackageId}
              onChange={(e) => setOrderSpinPackageId(parseInt(e.target.value, 10))}
            />
          </label>
          <br />
          <label>
            Final Price:
            <input
              type="number"
              value={orderFinalPrice}
              onChange={(e) => setOrderFinalPrice(parseFloat(e.target.value))}
            />
          </label>
          <br />
          <label>
            Default Price:
            <input
              type="number"
              value={orderDefaultPrice}
              onChange={(e) => setOrderDefaultPrice(parseFloat(e.target.value))}
            />
          </label>
          <br />
          <label>
            Wallet Address:
            <input
              type="text"
              value={orderWalletAddress}
              onChange={(e) => setOrderWalletAddress(e.target.value)}
            />
          </label>
          <br />
          <label>
            Currency:
            <select
              value={orderCurrency}
              onChange={(e) => setOrderCurrency(e.target.value)}
            >
              {paymentTypesEnum.map((pt) => (
                <option
                  key={pt}
                  value={pt}
                >
                  {pt}
                </option>
              ))}
            </select>
          </label>
          <br />

          <button type="submit">Add Order</button>
        </form>
        {addOrderMutation.isLoading && <p>Adding order...</p>}
        {addOrderMutation.data && <p>Order created! ID: {addOrderMutation.data.id}</p>}
        {addOrderMutation.error && <p style={{ color: "red" }}>Error: {addOrderMutation.error.message}</p>}
      </section>

      {/* 2) GET ORDER FORM */}
      <section style={{ marginBottom: "2rem", border: "1px solid #ddd", padding: "1rem" }}>
        <h2>Get Order</h2>
        <form onSubmit={handleGetOrder}>
          <label>
            Order ID:
            <input
              type="number"
              value={getOrderId}
              onChange={(e) => setGetOrderId(parseInt(e.target.value, 10))}
            />
          </label>
          <button type="submit">Fetch Order</button>
        </form>
        {getOrderQuery.isFetching && <p>Loading order...</p>}
        {getOrderQuery.data && (
          <div>
            <p>Order ID: {getOrderQuery.data.id}</p>
            <p>Spin Package ID: {getOrderQuery.data.spinPackageId}</p>
            <p>Status: {getOrderQuery.data.status}</p>
          </div>
        )}
        {getOrderQuery.error && <p style={{ color: "red" }}>Error: {getOrderQuery.error.message}</p>}
      </section>

      {/* 3) GET ACTIVE SPIN PACKAGES */}
      <section style={{ marginBottom: "2rem", border: "1px solid #ddd", padding: "1rem" }}>
        <h2>Get Active Spin Packages</h2>
        <form onSubmit={handleGetActivePackages}>
          <label>
            Campaign Type:
            <select
              value={activePackagesCampaignType}
              onChange={(e) => setActivePackagesCampaignType(e.target.value)}
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
          <button type="submit">Fetch Active Packages</button>
        </form>
        {getActivePackagesQuery.isFetching && <p>Loading spin packages...</p>}
        {getActivePackagesQuery.data && (
          <ul>
            {getActivePackagesQuery.data.map((pkg) => (
              <li key={pkg.id}>
                ID: {pkg.id}, Name: {pkg.name}, Active: {pkg.active ? "Yes" : "No"}
              </li>
            ))}
          </ul>
        )}
        {getActivePackagesQuery.error && <p style={{ color: "red" }}>Error: {getActivePackagesQuery.error.message}</p>}
      </section>

      {/* 4) SPIN FOR NFT */}
      <section style={{ marginBottom: "2rem", border: "1px solid #ddd", padding: "1rem" }}>
        <h2>Spin For NFT</h2>
        <form onSubmit={handleSpin}>
          <label>
            Campaign Type:
            <select
              value={spinCampaignType}
              onChange={(e) => setSpinCampaignType(e.target.value)}
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
          <br />
          <label>
            Spin Package ID:
            <input
              type="number"
              value={spinPackageId}
              onChange={(e) => setSpinPackageId(parseInt(e.target.value, 10))}
            />
          </label>
          <button type="submit">Spin!</button>
        </form>
        {spinMutation.isLoading && <p>Spinning...</p>}
        {spinMutation.data && (
          <div>
            <p>Random NFT Collection: {spinMutation.data.name}</p>
            <p>Description: {spinMutation.data.description}</p>
          </div>
        )}
        {spinMutation.error && <p style={{ color: "red" }}>Error: {spinMutation.error.message}</p>}
      </section>

      {/* 5) GET USER COLLECTIONS RESULT */}
      <section style={{ marginBottom: "2rem", border: "1px solid #ddd", padding: "1rem" }}>
        <h2>Get User Collections Result</h2>
        <form onSubmit={handleGetUserCollections}>
          <label>
            Campaign Type:
            <select
              value={collectionsCampaignType}
              onChange={(e) => setCollectionsCampaignType(e.target.value)}
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
          <button type="submit">Fetch Collections Result</button>
        </form>
        {getUserCollectionsQuery.isFetching && <p>Loading user collections...</p>}
        {getUserCollectionsQuery.data && (
          <ul>
            {getUserCollectionsQuery.data.map((col) => (
              <li key={col.id}>
                Collection ID: {col.id}, Name: {col.name}, Count: {col.count}
              </li>
            ))}
          </ul>
        )}
        {getUserCollectionsQuery.error && <p style={{ color: "red" }}>Error: {getUserCollectionsQuery.error.message}</p>}
      </section>
    </div>
  );
}
