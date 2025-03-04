import { ReactNode, FC } from "react";

interface CheckUserInListProps {
  currentUserId: number | null | undefined;
  userList: number[];
  children: ReactNode | null;
}

const CheckUserInList: FC<CheckUserInListProps> = ({ currentUserId, userList, children }) => {
  if (!currentUserId) return null;
  const isUserInList = userList.includes(currentUserId);

  return isUserInList ? children : null;
};

export default CheckUserInList;
