import { Modal, Box } from "@mui/material";
import Typography from "@/components/Typography";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import TonSocietyLogo from "../_assets/images/ts-logo.svg";
import { CircleX } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
    open: boolean;
    onClose: () => void;
}

export const AccessRestrictedModal = ({ open, onClose }: Props) => {
    const router = useRouter();
    const handleOnClick = () => {
        router.push("/?from=accessibility-modal");
        onClose()
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            className="text-white grid place-items-center"
        >
            <Box className="bg-navy px-4 py-5 flex flex-col gap-4 rounded-2lg border border-brand-divider-dark w-10/12">
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <Typography variant="title2">Access Restricted</Typography>

                    <CircleX
                        className="cursor-pointer hover:opacity-80"
                        onClick={onClose}
                    />
                </Box>

                <div className="flex gap-3">
                    <Image
                        src={TonSocietyLogo}
                        width={60}
                        height={60}
                        alt="TON Society Logo"
                        className="rounded-full border-2"
                    />

                    <Typography
                        variant="subheadline1"
                        weight="normal"
                    >
                        You need an <strong>TON Society SBT</strong> to start. Please attend an event and claim a TS SBT to continue.
                    </Typography>
                </div>

                <hr />

                <div className="justify-between flex gap-1 h-13">
                    <Button
                        className="flex-1 h-full text-orange"
                        variant="link"
                        onClick={onClose}
                    >
                        <Typography
                            variant="body"
                            weight="medium"
                        >
                            Dismiss
                        </Typography>
                    </Button>

                    <Button
                        className="flex-1 h-full bg-orange hover:bg-orange/80"
                        onClick={handleOnClick}
                    >
                        <Typography
                            variant="body"
                            weight="medium"
                        >
                            Explore ONTON
                        </Typography>
                    </Button>
                </div>
            </Box>
        </Modal>
    );
};
