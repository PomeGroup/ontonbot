import { Check } from "lucide-react"

export const ListItem = ({ children }: { children: React.ReactNode }) => {
    return <li className="flex gap-2 items-center">
        <Check className="w-3 h-3 text-green-light" />
        {children}
    </li>
}