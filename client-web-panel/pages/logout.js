// logout page

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '@/redux/slices/authSlice';
import { useRouter } from "next/router";

const Logout = () => {
    const dispatch = useDispatch();
    const router = useRouter();

    useEffect(() => {
        dispatch(logout());
        router.push('/');
    }, []);

    return null;
}
export default Logout;