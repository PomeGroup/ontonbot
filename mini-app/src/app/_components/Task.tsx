import { List, ListItem } from "konsta/react";
import CustomButton from "./Button/CustomButton";
import { FaSpinner } from "react-icons/fa6";

type TaskProps = {
  title: string;
  status: "not_done" | "done" | "checking";
  onClick?: () => void;
};

const Task = ({ title, status, onClick }: TaskProps) => {
  return (
    <List
      outline
      inset
      className={"!mx-0"}
      margin="m-0"
    >
      <ListItem
        title={title}
        after={
          <CustomButton
            variant={status === "not_done" ? "outline" : "link"}
            onClick={onClick}
            fontWeight="normal"
            size="md"
            color={status === "done" ? "success" : undefined}
          >
            {status === "not_done" && "Go"}
            {status === "done" && "Done!"}
            {status === "checking" && <FaSpinner className="animate-spin" />}
          </CustomButton>
        }
      />
    </List>
  );
};

export default Task;
