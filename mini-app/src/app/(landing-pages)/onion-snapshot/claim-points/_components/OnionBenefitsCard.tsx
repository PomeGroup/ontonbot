import Typography from "@/components/Typography";

export default function OnionBenefitsCard() {
  // TODO: the disks should look like the disks in the design
  return (
    <div className="flex flex-col gap-2 p-3 rounded-[10px] bg-[#EFEFF4]/50">
      <Typography
        variant="subheadline1"
        className="text-black font-normal leading-tight tracking-tighter text-sm"
      >
        Use ONION, the governance token, to enable:
      </Typography>
      <ul className={`list-inside list-disc space-y-1`}>
        <li className="text-black font-normal leading-snug tracking-tight text-xs">
          <Typography
            variant="footnote"
            className="inline text-black font-normal leading-snug tracking-tight text-xs"
          >
            Event discounts, staking yields, and access to community events.
          </Typography>
        </li>
        <li className="text-black font-normal leading-snug tracking-tight text-xs">
          <Typography
            variant="footnote"
            className="inline text-black font-normal leading-snug tracking-tight text-xs"
          >
            Participation airdrops reward community contributors.
          </Typography>
        </li>
        <li className="text-black font-normal leading-snug tracking-tight text-xs">
          <Typography
            variant="footnote"
            className="inline text-black font-normal leading-snug tracking-tight text-xs"
          >
            DAO governance enhances decision-making with SBT-weighted voting for fair representation.
          </Typography>
        </li>
      </ul>
    </div>
  );
}
