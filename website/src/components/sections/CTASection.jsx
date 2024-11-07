'use client';
import Image from 'next/image';
import Link from 'next/link';

export default function CTASection() {
  return (
    <section id='cta' className="container-xl scroll-mt-20">
      <div className="flex flex-col md:flex-row pt-4 gap-8 items-center">

        <div className="md:basis-7/12 md:order-1">
          <Image src={'/onton-landing-1.svg'} alt="" height={760} width={760}/>
        </div>

        <div className="md:basis-5/12">
          <h2 className="font-bold text-[32px] mb-2 md:text-[64px] md:mb-6">ONton</h2>
          <h3 className="font-bold text-[28px] mb-2 leading-tight">Experience the Future of Event Management</h3>
          <p className="mb-4 md:mb-10">
            ONton is a cutting-edge <b>event management platform</b> integrated with <b>Telegram</b> and powered by <b>TON</b>. Our app allows users to seamlessly organize, manage, and participate in events with secure, transparent transactions. Join TON Society and experience the future of event management.
          </p>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5 gap-border-b border-[#C8C7CB] md:border-0 pb-4">
            <Link target="_blank"
              href="https://t.me/theontonbot"
              className='flex-grow'>
              <button 
                className="btn btn-primary w-full" 
                >
                Discover app
              </button>
            </Link>
            <Link target="_blank"
              href="https://t.me/ontonsupport"
              className='flex-grow'>
              <button className="btn btn-light w-full">
                Join Telegram Community
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
