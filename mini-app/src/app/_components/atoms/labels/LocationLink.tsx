'use client'

import Link from 'next/link'
import { useUtils } from '@tma.js/sdk-react'
import Labels from '@/app/_components/atoms/labels/index'

// const normalizeURL = (url: string) => {
//     return url.replace(/www\./, '').replace(/(^\w+:|^)\/\//, '').replace(/\/.*/, '')
// }

const normalizeURL2 = (url: string) => {
    // remove protocol from the url, remove www if any, keep the rest of it, but cut it after 30 characters
    return url.replace(/(^\w+:|^)\/\//, '').replace(/www\./, '').slice(0, 30)
}

type Props = {
    location: string;
};

const WebsiteLink = ({ location }: Props) => {
    const tmaUtils = useUtils()

    return (
        <Link
            href={'#'}
            onClick={() => tmaUtils?.openLink(location)}
        >
            <Labels.Label>
                {normalizeURL2(location)}
            </Labels.Label>
        </Link>
    )
}
export default WebsiteLink
