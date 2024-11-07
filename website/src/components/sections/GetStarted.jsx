import Link from 'next/link'
import { GetStartedLink } from '../GetstartedLink'

export default function GetStarted() {
  return (
    <section className="bg-white py-4 md:py-12 border-t-8 border-[#EFEFF4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:gap-10 md:items-center md:justify-between">
          <div className="md:w-1/2">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              How to work with ONton
            </h2>
            <p className="mt-4 text-md leading-6">
              In case you are willing to <span className="font-bold">Host an event</span>, contact <Link href="#" className="text-primary cursor-pointer">the ONton team</Link> with details of your event.
            </p>
            <p className="mt-4 text-md leading-6">
              Our team will assist you in setting up and promoting your event on the platform.
            </p>
            <h3 className="mt-8 text-2xl font-bold">
              Soon on ONton
            </h3>
            <p className="mt-4 text-md leading-6">
              Interested in hosting your event on ONton? Contact us today to learn more and get started. Please provide your contact information below, and our team will reach out to you promptly.
            </p>
          </div>
          <div className="mt-10 md:mt-0 md:w-1/2">
            <GetStartedLink />
          </div>
        </div>
      </div>
    </section>
  )
}
