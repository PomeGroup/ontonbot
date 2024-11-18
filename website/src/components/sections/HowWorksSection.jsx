import Link from 'next/link';

const Card = ({ title, description, link, linkText, disabled }) => (
  <div className="bg-[#E5F2FF] rounded-[8px] p-[12px] min-h-[116px] md:p-[24px] md:min-h-[144px] flex flex-col justify-between">
    <div>
      <h4 className="text-[15px] mb-[12px] font-medium md:text-[20px] md:mb-[16px]">
        {title}
      </h4>
      <p className="text-[15px] md:text-[17px]">
        {description}
      </p>
    </div>
    {disabled ? (
      <span className="text-gray-500 italic mt-2">Coming soon</span>
    ) : (
      <Link href={link} className="text-blue-600 hover:underline mt-2">
        {linkText || "Learn more"}
      </Link>
    )}
  </div>
);

const cards = [
  {
    title: "Attend Events",
    description: "Participate in various events hosted on ONton and earn Reward Tokens for your participation",
    link: "https://t.me/theontonbot",
    linkText: "View Events"
  },
  {
    title: "Earn Points",
    description: "Every SoulBound reward token you receive translates into points that accumulate weekly and monthly",
    link: "/points",
    disabled: true
  },
  {
    title: "Climb the Leaderboard",
    description: "Your points place you on our competitive leaderboards, updated regularly to reflect the most active and engaged participants",
    link: "/leaderboard",
    disabled: true
  }
];

export default function HowItWorksSection() {
  return (
    <section id='how-it-works' className="container mb-10 md:mb-20 scroll-mt-20">
      <h3 className="font-semibold text-[20px] md:text-[36px] mb-5">
        How It Works
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card, index) => (
          <Card key={index} {...card} />
        ))}
      </div>
    </section>
  );
}
