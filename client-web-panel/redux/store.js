import {configureStore, getDefaultMiddleware} from '@reduxjs/toolkit';
import storage from 'redux-persist/lib/storage';
import {persistReducer, persistStore} from 'redux-persist';
import authReducer from '@/redux/slices/authSlice';
import {authApi} from '@/redux//slices/authApiSlice';
import {eventsApiSlice} from '@/redux/slices/eventsApiSlice';
import {usersApiSlice} from '@/redux/slices/usersApiSlice';
import {ticketApiSlice} from "@/redux/slices/ticketApiSlice";

const persistConfig = {
  key: 'auth',
  storage,
  whitelist: ['token', 'userData', 'isLogin']
};

const persistedReducer = persistReducer(persistConfig, authReducer);

const customizedMiddleware = getDefaultMiddleware({
  serializableCheck: {
    ignoredActions: ['persist/PERSIST'],
  },
});

export const store = configureStore({
  reducer: {

    [authApi.reducerPath]: authApi.reducer,
    [usersApiSlice.reducerPath]: usersApiSlice.reducer,
    [eventsApiSlice.reducerPath]: eventsApiSlice.reducer,
    [ticketApiSlice.reducerPath]: ticketApiSlice.reducer,

    auth: persistedReducer
  },
  middleware: customizedMiddleware
    .concat(
      authApi.middleware,
      usersApiSlice.middleware,
      eventsApiSlice.middleware,
      ticketApiSlice.middleware,

    ),
});

export const Persistor = persistStore(store);
