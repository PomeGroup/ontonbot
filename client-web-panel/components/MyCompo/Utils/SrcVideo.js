// replace api/v1 by  '' in process.env.NEXT_PUBLIC_BACKEND_URL and return base url + image scr
//

const SrcVideo = (src) => {
    // Trim leading slash if it exists
    const trimmedSrc = src.startsWith('/') ? src.substring(1) : src;

    return `${process.env.NEXT_PUBLIC_BACKEND_URL.replace('api/v1/', '')}${trimmedSrc}`;
}

export default SrcVideo;