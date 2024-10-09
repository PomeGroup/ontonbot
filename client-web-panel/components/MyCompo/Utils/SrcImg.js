// replace api/v1 by  '' in process.env.NEXT_PUBLIC_BACKEND_URL_CLIENT and return base url + image scr
//


const srcImg = (src) => {
    return process.env.NEXT_PUBLIC_BACKEND_URL_CLIENT.replace('api/v1/', '') + src;
}

export default  srcImg;