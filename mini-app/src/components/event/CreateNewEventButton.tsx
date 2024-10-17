import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BadgePlus } from "lucide-react";
import useWebApp from "@/hooks/useWebApp";

interface CreateNewEventButtonProps {
  className?: string;
}

export const CreateNewEventButton: React.FC<CreateNewEventButtonProps> = ({ className }) => {
  const WebApp = useWebApp();
  const hapticFeedback = WebApp?.HapticFeedback;
  return (
    <Link
      href={`/events/create`}
      className={`w-full ${className}`}
      onClick={() => {
        hapticFeedback?.impactOccurred("medium");
      }}
    >
      <Button
        className="w-full"
        variant="outline"
        type="button"
      >
        <BadgePlus
          className="mr-1"
          width={15}
        />
        Create New Event
      </Button>
    </Link>
  );
};
