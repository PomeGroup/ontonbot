import Link from "next/link";

export function GetStartedLink() {
  return (
    <div className="bg-gray-100 p-8 rounded-xl">
      <h3 className="text-[28px] font-bold mb-4">Organizer Onboarding</h3>
      <p className="text-md leading-6 mb-6">
        Interested in <span className="font-bold">hosting your event</span> on ONton? Contact us today to learn more and get started. 
      </p>
      <Link
        href="https://cutt.ly/regUTOEj"
        target="_blank"
        className="btn btn-primary w-full"
        >
        Get started
      </Link>
    </div>
  )
}
