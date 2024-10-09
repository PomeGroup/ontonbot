import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import {store} from "@/redux/store";

export const customBaseQuery = async ({url, method, body}) => {
  const state = store.getState();  // access the Redux state
  const token = state.auth.token;  // access the token from the state

  const response = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? {Authorization: `${token}`} : {}),
    },
    body: body ? JSON.stringify(body) : undefined,  // handle if no body is provided
  });

  const data = await response.json();
  return {data};
};

export const usersApiSlice = createApi({
  reducerPath: 'usersApi',
  baseQuery: customBaseQuery,
  keepUnusedDataFor: 0, // This will effectively disable caching
  tagTypes: ['Users'],
  endpoints: (builder) => ({
    // Getting all users
    getAllUsers: builder.query({
      query: () => ({
        url: 'admin/users',
        method: 'GET'
      }),
    }),
    // Getting a user by ID
    getUserById: builder.query({
      query: (userId) => ({
        url: `admin/user/${userId}`,
        method: 'GET'
      }),
    }),
    // Searching users by telephone or email
    searchUsersByTelOrEmail: builder.query({
      query: (searchString) => ({
        url: `admin/user/search/${searchString}`,
        method: 'GET',
      }),
    }),
    // Toggling user active status
    toggleUserActiveStatus: builder.mutation({
      query: ({userId, isActive}) => ({
        url: isActive ? 'admin/user/active' : 'admin/user/deactive',
        method: 'POST',
        body: {userId},
      }),
      invalidatesTags: ['Users'],
    }),
    // Updating user access courses
    updateUserAccessCourses: builder.mutation({
      query: ({userId, courses}) => ({
        url: 'admin/user/access',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: {userId, courses},
      }),
      invalidatesTags: ['Users'],
    }),
  }),
});

// Exporting hooks for each endpoint
export const {
  useGetAllUsersQuery,
  useGetUserByIdQuery,
  useSearchUsersByTelOrEmailQuery,
  useToggleUserActiveStatusMutation,
  useUpdateUserAccessCoursesMutation,
} = usersApiSlice;
