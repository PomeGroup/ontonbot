# TonFest and Onton API Integration

This document provides an overview of how TonFest and Onton integrate to handle payments and ticket issuance. It includes both the **TonFest API** and **Onton API** specifications along with typical flows.

---

## **Table of Contents**
1. [Overview](#overview)
2. [High-Level Payment Flows](#high-level-payment-flows)
   - [Flow 1: Pay with Telegram Stars](#flow-1-pay-with-telegram-stars-in-tonfest-mini-app)
   - [Flow 2: Pay with TON](#flow-2-pay-with-ton-directly-on-onton)
3. [TonFest API](#tonfest-api)
   - [addUserTicketFromOnton](#1-post-ton-fest-apiadduserticketfromonton)
4. [Onton API](#onton-api)
   - [verifaiedAsPaid](#1-post-ontonapiverifaiedaspaid)
   - [checkClaimStatus](#2-post-ontonapicheckclaimstatus)
5. [Usage Notes](#usage-notes)

---

## **Overview**

There are two primary systems:

1. **TonFest**: 
   - A platform or mini app where users can initiate payments (Telegram Stars or via TON directly on Onton).
   - Receives callbacks from Onton about successful payments.

2. **Onton**: 
   - A platform that mints SBT (Soulbound Token) tickets upon successful payments.
   - Provides a claim link for users to claim their tickets.
   - Notifies TonFest when SBT tickets have been minted.

---

## **High-Level Payment Flows**

### **Flow 1: Pay with Telegram Stars in TonFest Mini App**
1. **User initiates payment** in the TonFest mini app using Telegram Stars.
2. **TonFest calls Onton** using the `verifaiedAsPaid` endpoint to request minting of an SBT ticket.
3. **Onton creates an SBT** on the blockchain.
4. **Onton returns a claim link** to TonFest.
5. **TonFest redirects** the user to this claim link.
6. **User claims** the SBT ticket on Onton.

### **Flow 2: Pay with TON Directly on Onton**
1. **TonFest redirects** the user to Onton’s payment page.
2. **User pays** with TON on Onton.
3. **Onton mints** the SBT ticket.
4. **Onton calls TonFest** using the `addUserTicketFromOnton` endpoint, passing transaction info.
5. **TonFest records** the payment and ticket data.
6. **Optionally, TonFest** can check claim status using the `checkClaimStatus` endpoint on Onton.

---

## **TonFest API**

### 1. `POST /ton-fest/api/addUserTicketFromOnton`

**Purpose**  
Called by Onton after a user has paid with TON, allowing TonFest to record the payment and create a corresponding ticket entry on its platform.

**Request Body**

```json
{
  "trxHash": "abcdef123456",
  "userTelegramId": 123456789,
  "telegramUsername": "@user_name",
  "ownerWallet": "EQB4...walletAddress",
  "eventUuid": "event-uuid-string",
  "amount": 3.5,
  "paymentType": "TON"
}
```

**Response**
```json
{
  "success": true
}
```

**Error Response**
```json
{
  "success": false,
  "error": [
    "wrong_user_id",
    "wrong_event_uuid",
    "bad_request"
  ]
}
```

---

## **Onton API**

### 1. `POST /onton/api/verifaiedAsPaid`

**Request Body**

```json
{
  "telegramUserId": 123456789,
  "telegramUsername": "@user_name",
  "eventUuid": "event-uuid-string",
  "paymentType": "star",
  "paymentAmount": 50
}
```

**Response**
```json
{
  "success": true,
  "isOntonUser": true,
  "sbtClaimLink": "https://onton.app/claim/abcdef123"
}
```

**Error Response**
```json
{
  "success": false,
  "status": [
    "wrong_telegram_id",
    "event_not_exist",
    "wrong_payment_type",
    "bad_request"
  ]
}
```

---

### 2. `POST /onton/api/checkClaimStatus`

**Request Body**

```json
{
  "telegramUserId": 123456789,
  "eventUuid": "event-uuid-string"
}
```

**Response**
```json
{
  "success": true,
  "status": "CLAIMED"
}
```

**Error Response**
```json
{
  "success": false,
  "error": 404
}
```

---

## **Usage Notes**

1. **Validation**: Ensure all request fields are validated (e.g., correct format for event UUID, numeric fields, etc.).
2. **Error Handling**: Present meaningful messages to users for each error type.
3. **Security**: Use HTTPS (SSL/TLS) for API calls to protect sensitive data. Include necessary authentication or authorization mechanisms.
4. **Logging**: Log both incoming and outgoing requests and responses for debugging and record-keeping.

---

**End of README**
