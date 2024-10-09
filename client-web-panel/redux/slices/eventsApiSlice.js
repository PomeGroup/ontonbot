import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const eventsApiSlice = createApi({
  reducerPath: 'eventsApi', // The key for this slice in the store
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL_CLIENT, // Set your backend URL from environment variable
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token; // Assuming the JWT token is stored in the auth slice
      if (token) {
        headers.set('Authorization', `Bearer ${token}`); // Add the Bearer token to the headers
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getEvents: builder.query({
      query: ({ limit, offset }) => {
        let query = `protected/events`;
        const params = new URLSearchParams();
        if (limit) params.append('limit', limit);
        if (offset) params.append('offset', offset);
        if (params.toString()) query += `?${params.toString()}`;
        return query;
      },
    }),

    // Add the getGuestList endpoint here
    getGuestList: builder.query({
      query: ({ eventUuid, limit, cursor, search }) => {
        let query = `protected/guestList/${eventUuid}`;
        const params = new URLSearchParams();
        if (limit) params.append('limit', limit);
        if (cursor) params.append('cursor', cursor);
        if (search) params.append('search', search);
        if (params.toString()) query += `?${params.toString()}`;
        return query;
      },
    }),
  }),
});

export const { useGetEventsQuery, useGetGuestListQuery } = eventsApiSlice;
