import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({ baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL + 'public/' }),
  endpoints: (builder) => ({
    sendOtpCode: builder.mutation({
      query: ({ organizerId, userId }) => ({
        url: 'sendCode',
        method: 'POST',
        body: { organizerId, userId },  // Now passing both organizerId and userId
      }),
    }),
    loginWithOtp: builder.mutation({
      query: ({ organizerId, userId, loginCode }) => ({
        url: 'login',
        method: 'POST',
        body: { organizerId, userId, loginCode },  // Send organizerId, userId, and loginCode
      }),
    }),
    logout: builder.mutation({
      query: ({ telegramUserId, token }) => ({
        url: 'logout',
        method: 'POST',
        body: { telegramUserId },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    }),
  }),
});

export const {
  useSendOtpCodeMutation,
  useLoginWithOtpMutation,
  useLogoutMutation,
} = authApi;
