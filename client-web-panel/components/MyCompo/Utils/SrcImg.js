// replace api/v1 by  '' in process.env.NEXT_PUBLIC_BACKEND_URL and return base url + image scr
//


const srcImg = (src) => {
    return process.env.NEXT_PUBLIC_BACKEND_URL.replace('api/v1/', '') + src;
}

export default  srcImg;