import { CircleCheck, CircleX, Info } from "lucide-react";
import { toast } from "sonner";

export function customToast() { }

customToast.success = function (message: string) {
    toast(message, {
        unstyled: true,
        className: 'toast',
        position: 'bottom-center',
        icon: <CircleCheck className="text-green-300" />
    });
}

customToast.error = function (message: string) {
    toast(message, {
        unstyled: true,
        className: 'toast',
        position: 'bottom-center',
        icon: <CircleX className="text-red-400" />
    });
}

customToast.info = function (message: string) {
    toast(message, {
        unstyled: true,
        className: 'toast',
        position: 'bottom-center',
        icon: <Info className="text-blue-400" />
    });
}