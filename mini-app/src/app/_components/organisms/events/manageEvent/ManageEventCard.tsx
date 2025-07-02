import Typography from "@/components/Typography";
import { Switch } from "@/components/ui/switch";
import { ReactNode, useState } from "react";

export type ManageEventCardProps = {
  title: ReactNode;
  children: ReactNode;
  /* 
    Shows a switch that toggles the visibility of the children content.
    When the switch is toggled off, the children content is hidden.
  */
  hasSwitch?: boolean;
  hiddenContent?: ReactNode;
};

const ManageEventCard = (props: ManageEventCardProps) => {
  const [switchToggled, setSwitchToggled] = useState(false);

  return (
    <div className="bg-white p-3 flex flex-col gap-4 rounded-2lg">
      {/* Title */}
      <div className="flex items-center justify-between">
        <Typography
          variant="title3"
          weight="normal"
          className="flex-1 capitalize me-auto"
        >
          {props.title}
        </Typography>
        {props.hasSwitch && (
          <Switch
            checked={switchToggled}
            onClick={() => setSwitchToggled(!switchToggled)}
          />
        )}
      </div>

      {/* Content */}
      {props.hasSwitch ? (switchToggled ? props.children : props.hiddenContent) : props.children}
    </div>
  );
};

export default ManageEventCard;
