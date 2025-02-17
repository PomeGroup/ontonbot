import { List, ListItem } from "konsta/react";
import CustomButton from "./Button/CustomButton";

type TaskProps = {
  title: string;
  status: "pending" | "done";
};

const Task = ({ title, status }: TaskProps) => {
  const handleClick = () => {
    // Define the click behavior based on status
    if (status === "pending") {
      // Implement pending action
    } else if (status === "done") {
      // Implement done action
    }
  };

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
            variant={status === "pending" ? "outline" : "link"}
            onClick={handleClick}
            fontWeight="normal"
            size="md"
            color={status === "done" ? "success" : undefined}
          >
            {status === "pending" ? "Go" : "Done!"}
          </CustomButton>
        }
      />
    </List>
  );
};

export default Task;
