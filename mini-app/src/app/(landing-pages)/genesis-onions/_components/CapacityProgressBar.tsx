interface Props {
    total: number;
    progress: number;
}

export default function CapacityProgressBar({ total, progress }: Props) {
    const percentage = (progress / total) * 100;

    return (
        <div className="w-full h-1 relative" aria-roledescription="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={progress}>
            <div className="w-full bg-brand-divider-dark h-[2px] absolute top-1/2 -translate-y-1/2 rounded-sm" />
            <div
                className="bg-white h-1 rounded-full relative z-10"
                style={{ width: `${percentage}%` }}
            ></div>
        </div>
    );
}
