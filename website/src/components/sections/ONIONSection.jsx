import Image from 'next/image'
import Link from 'next/link'
import image05 from '../../assets/images/image-05.png'

export default function ONIONSection() {
    return (
        <section className="container pb-4 md:pb-12">
            <div className="flex flex-col md:flex-row pt-4 gap-8 items-center">
                <div className="md:basis-5/12 lg:basis-6/12 md:order-1">
                    <Image
                        src={image05.src}
                        alt=""
                        height={574}
                        width={580}
                    />
                </div>
                <div className="md:basis-7/12 lg:basis-6/12">
                    <h2 className="font-bold text-[32px] mb-2 md:text-[64px] md:mb-6">
                        ONION
                    </h2>
                    <h3 className="font-bold text-[20px] md:text-[36px] mb-2 leading-tight">
                        Find out what ONION is?
                    </h3>
                    <p className="mb-4 md:mb-[32px] md:text-[17px]">
                        Curious about ONION? Join the exclusive Mystery event to uncover what it is and how it ties into ONton&#39;s point system. Gain access, earn points, and discover the hidden potential behind ONION—something far more exciting than you might expect. What could it be? Find out soon...
                    </p>

                    <Link target='_blank' href='https://t.me/theontonbot/event?startapp=43d33878-a1ba-4209-9169-4845066004c6' className='btn-primary btn'>
                        Unlock ONION Mystery
                    </Link>
                </div>
            </div>
        </section>
    )
}
