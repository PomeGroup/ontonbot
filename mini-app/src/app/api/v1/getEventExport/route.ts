
import type { NextApiResponse } from 'next'
type ResponseData = {
    initData?: string;
    hash?: string;
    error?: string;
}

const handler = async (req: Request, res: NextApiResponse<ResponseData>) => {
    // Extract query parameters

    const url = new URL(req.url);
    const searchParams = new URLSearchParams(url.search);

    const initData = searchParams.get('initData');
    const hash = searchParams.get('hash');

    if (typeof initData !== 'string' || typeof hash !== 'string') {
        return new Response(JSON.stringify({
            error: JSON.stringify({
                initData,
                hash
            })
        }), {
            status: 400, // Indicate a client error (bad request)
            headers: {
                'Content-Type': 'application/json', // Set appropriate content type
            }
        });
    }

    return new Response(JSON.stringify(
        {
            hello: JSON.stringify({
                initData,
                hash
            })
        }))
}

// Export the handler for both GET and POST requests
export { handler as GET, handler as POST };
