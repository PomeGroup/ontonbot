import { unstable_noStore as noStore } from 'next/cache'
import { redirect } from 'next/navigation'

export default function Home({ searchParams }: { searchParams: any }) {
    noStore()
    const tgWebAppStartParam = searchParams.tgWebAppStartParam

    if (tgWebAppStartParam !== undefined) {
        redirect(`/events/${tgWebAppStartParam}`)
    }

    redirect('https://society.ton.org/activities/events')
}
