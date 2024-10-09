import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const ticketApiSlice = createApi({
  reducerPath: 'ticketApi', // The key for this slice in the store
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL, // Your backend URL
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token; // Fetch JWT from auth state
      if (token) {
        headers.set('Authorization', `Bearer ${token}`); // Attach Bearer token
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    // Check-in Ticket API
    checkInTicket: builder.mutation({
      query: (body) => ({
        url: 'protected/checkin', // API endpoint for ticket check-in
        method: 'POST',
        body, // Pass the order_uuid as the body
      }),
    }),
  }),
});

export const { useCheckInTicketMutation } = ticketApiSlice;
