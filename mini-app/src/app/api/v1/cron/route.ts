import { NextResponse } from 'next/server'

export async function GET() {
    console.log('Cron job running...')
    // Your cron job logic here
    return NextResponse.json({
        message: 'Cron job executed successfully',
        now: Date.now(),
    })
}

export const revalidate = 600
