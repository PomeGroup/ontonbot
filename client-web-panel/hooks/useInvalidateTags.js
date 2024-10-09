// import { useEffect } from 'react';
// import { useDispatch } from 'react-redux';
// import { apiSlice } from '@/redux/slices/dfzInvoiceApiSlice';
//
// const useInvalidateTags = () => {
//     const dispatch = useDispatch();
//     //
//     useEffect(() => {
//         const handleStorageChange = (event) => {
//             if (event.key && event.newValue) {
//                 const tags = JSON.parse(event.newValue);
//                 tags.forEach(tag => {
//                     dispatch(apiSlice.util.invalidateTags([tag]));
//                 });
//             }
//         };
//
//         window.addEventListener('storage', handleStorageChange);
//
//         return () => {
//             window.removeEventListener('storage', handleStorageChange);
//         };
//     }, [dispatch]);
// };
//
// export default useInvalidateTags;
