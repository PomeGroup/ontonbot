# Check Coupon API - README

## Overview

This document provides guidance on consuming the **Check Coupon** API endpoint within a React + Next.js application. It covers URL structure, required parameters, authentication, potential responses, and how to integrate requests in a front-end project.

---

## Endpoint Details

- **HTTP Method**: `GET`
- **Endpoint**:
  ```
  /api/v1/event/:id/checkCoupon/:couponCode
  ```
  - `:id` corresponds to an **Event ID** (positive integer).
  - `:couponCode` is the **Coupon Code** (non-empty string).
- **Example**:
  ```
  https://<your-domain>/api/v1/event/2053/checkCoupon/ABC123
  ```

### Authentication

- The endpoint expects a valid JWT token to be present in a cookie named `token`.
- If the user is not authenticated, you will likely receive a 401 response (or another error response as defined by your back-end).

### Rate Limiting

- Each user can only call this endpoint **3 times per 60 seconds**.
- Exceeding the limit returns:
  ```json
  {
    "message": "Rate limit exceeded. Please wait a minute."
  }
  ```
  with status code **429 (Too Many Requests)**.

---

## Request Parameters

The route is parameterized, so you **must** include both the `event ID` and `coupon code` in the URL path itself. For example:

```
GET /api/v1/event/2053/checkCoupon/SAVE10
```

**No request body** is needed, since this is a `GET` endpoint.

---

## Possible Responses

| Status | Meaning                                  | Example Body                                                  |
| ------ | ---------------------------------------- | ------------------------------------------------------------- |
| 200    | Success – Coupon is valid                | `{ "message": "Coupon is valid", "data": { ... } }`           |
| 400    | Invalid input or coupon in invalid state | `{ "message": "Coupon is not active" }`                       |
| 404    | Resource not found (event or coupon)     | `{ "message": "Coupon not found" }`                           |
| 401    | Unauthorized / Authentication failure    | Custom auth error response                                    |
| 429    | Rate limit exceeded                      | `{ "message": "Rate limit exceeded. Please wait a minute." }` |
| 500    | Internal server error                    | `{ "message": "Something Went Wrong" }`                       |

---

## Response Data Structure (200 OK)

```json
{
  "message": "Coupon is valid",
  "data": {
    "item": {
      "coupon_id": 12345,
      "coupon_code": "ABC123",
      "coupon_status": "unused",
      "coupon_definition_id": 9876
    },
    "definition": {
      "cpd_type": "fixed" | "percent",
      "cpd_status": "active",
      "value": 10,
      "start_date": 1672531200000,
      "end_date": 1675123200000
    }
  }
}
```

---

## Example cURL

```bash
curl --location 'https://your-domain/api/v1/event/2053/checkCoupon/69963870305a6969' \
  --header 'cookie: token=YOUR_JWT_TOKEN'
```

---

## Front-End Integration (React + Next.js)

```tsx
import { useState } from "react";

export default function CouponChecker() {
  const [eventId, setEventId] = useState<number>(2053);
  const [couponCode, setCouponCode] = useState<string>("ABC123");
  const [result, setResult] = useState<string>("");

  async function handleCheckCoupon() {
    try {
      const url = `/api/v1/event/${eventId}/checkCoupon/${encodeURIComponent(couponCode)}`;
      const response = await fetch(url, { method: "GET" });

      if (!response.ok) {
        const errorData = await response.json();
        setResult(`Error: ${errorData.message || "Unknown error"}`);
        return;
      }

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setResult(`Network error: ${err}`);
    }
  }

  return (
    <div>
      <input
        type="number"
        value={eventId}
        onChange={(e) => setEventId(Number(e.target.value))}
      />
      <input
        type="text"
        value={couponCode}
        onChange={(e) => setCouponCode(e.target.value)}
      />
      <button onClick={handleCheckCoupon}>Check Coupon</button>
      {result && <pre>{result}</pre>}
    </div>
  );
}
```

---

## Summary

- **Route**: `GET /api/v1/event/:id/checkCoupon/:couponCode`
- **Requires**: Authentication cookie (`token`)
- **Rate Limit**: 3 requests per minute
- **Returns**: Coupon item & definition if valid
