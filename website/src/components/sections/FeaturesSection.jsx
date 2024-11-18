import Image from 'next/image'
import Link from 'next/link'
import imageArrow from '../../assets/images/arrow.png'
import Checkbox from '../ui/Checkbox'

export default function FeaturesSection() {
  return (
    <section className="relative mb-5 md:mb-16 bg-[#EFEFF4] py-10 scroll-mt-20" id="features">
      <div className="container relative">
        <h3 className="font-bold text-[20px] md:text-[36px] mb-5">Features</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
          <div className="text-center relative grid grid-cols-3 gap-8 px-7 py-6">
            <Image
              src={imageArrow.src}
              alt=""
              width={382}
              height={124}
              className="absolute top-1/2 -translate-y-1/2 left-0 right-0 w-full md:hidden"
            />
            <Image 
              src='/images/image-24.png'
              alt=""
              width={601}
              height={351} 
              className="mx-auto relative" />
            <Image 
              src='/images/image-25.png'
              alt=""
              width={601}
              height={351} 
              className="mx-auto relative" />
            <Image 
              src='/images/image-26.png'
              alt=""
              width={601}
              height={351} 
              className="mx-auto relative" />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Checkbox
              check
              label={
                <span>
                  <strong>Create </strong>and<strong> Manage </strong>Events
                </span>
              }
            />
            <Checkbox
              check
              label={
                <span>
                  Integration with <strong>TON Society</strong>
                </span>
              }
            />
            <Checkbox
              check
              label={
                <span>
                  Paid Events with <strong>NFT Tickets</strong>
                </span>
              }
            />
            <Checkbox
              check
              label={
                <span>
                  Minting Soulbound Tokens
                </span>
              }
            />
            <Checkbox
              label={
                <span>
                  <strong>LeaderBoard</strong> and <strong>Points</strong> System
                </span>
              }
            />
            <Checkbox
              label={
                <span>
                  <strong>Organizers</strong> Incentivized System
                </span>
              }
            />
            <Checkbox
              label={
                <span>
                  <strong>Calendar</strong> Integration
                </span>
              }
            />
            <Checkbox
              label={
                <span>
                  <strong>Referral</strong> System
                </span>
              }
            />

            <Link
              target="_blank"
              href="https://t.me/theontonbot"
              className="btn btn-primary block md:inline-block md:w-[270px] mt-[38px]"
            >
              Discover App
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
