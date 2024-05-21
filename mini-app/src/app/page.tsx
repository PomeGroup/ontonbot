import { redirect } from 'next/navigation'

export default function Home({ searchParams }: { searchParams: any }) {
    const tgWebAppStartParam = searchParams.tgWebAppStartParam

    if (tgWebAppStartParam !== undefined) {
        redirect('/events/' + tgWebAppStartParam)
    }

    redirect('https://society.ton.org/activities/events')
}
