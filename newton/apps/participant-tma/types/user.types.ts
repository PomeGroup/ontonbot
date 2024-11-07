export type UserType = {
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  wallet_address: string | null;
  language_code: string;
  role: string;
  created_at: string;
};

export type UserStoreType = {
  user: UserType | null;
  setUser: (user: UserType) => void;
  resetUser: () => void;
};
