'use client'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

export const Statistic = ({ title, number, image }) => (
    <div className="flex flex-col items-center">
        <DotLottieReact
            loop
            autoplay
            src={image}
            alt={title}
            height={80}
            width={80}
            className="mx-auto mb-3 lg:w-[180px]"
        />
        <span className="block text-[20px] font-semibold mb-1">{number}</span>
        <span className="text-center">{title}</span>
    </div>
)

export default function StatisticsSection() {
    return (
        <section className="border-y border-[#C8C7CB] md:border-0 my-4 py-4">
            <div className="container">
                <h3 className="font-bold text-[20px] md:text-[36px] mb-5">Statistics</h3>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-10">
                    <Statistic
                        title="SoulBound Tokens Awarded"
                        number="+1,600,000"
                        image="/love-frog-emoji.lottie"
                    />
                    <Statistic
                        title="Events"
                        number="+430"
                        image="/tea-green-frog.lottie"
                    />
                    <Statistic
                        title="NFT Tickets Sold"
                        number="+1,300"
                        image="/money-emoji.lottie"
                    />
                    <Statistic
                        title="Active users/month"
                        number="+300,000"
                        image="/waving-hand-emoji.lottie"
                    />
                </div>
            </div>
        </section>
    )
}

