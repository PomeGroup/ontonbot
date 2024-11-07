import DoneIcon from "../icon/DoneIcon";

export default function Checkbox({ label, check }) {
    return (
        <label className={`flex items-center mb-2.5 ${check ? '' : 'text-[#8E8E93]'}`}>
            <div
                className={`w-[16px] h-[16px] rounded-[50%] flex items-center justify-center mr-2 border
                ${check ? 'bg-primary border-primary' : 'text-[#8E8E93] border-[#8E8E93]'}`}
            >
                {check && <DoneIcon />}
            </div>
            {label}
        </label>
    )
}