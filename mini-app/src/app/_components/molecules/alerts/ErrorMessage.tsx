import { FiAlertCircle } from "react-icons/fi";

export const ErrorMessage = ({ message }: { message: string }) => (
  <div className="flex items-center">
    <FiAlertCircle className="mr-2" /> {message}
  </div>
);
