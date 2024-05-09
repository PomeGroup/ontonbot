import React from 'react'
import { headers } from "next/headers";

const Page = async (params: any) => {
    console.log(params)
    const heads = headers()
    const header_url = heads.get('x-url') || "";


    return (
        <div>
            {header_url} - url
            {JSON.stringify(params)} - params
            {JSON.stringify(heads)} - headers

        </div>
    )
}

export default Page