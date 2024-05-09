import React from 'react';
import { Skeleton } from '@mui/material';

const loading = () => {
    return (
        <div>
            <div className="flex justify-between">
                <Skeleton
                    className="rounded-[14px]"
                    variant="rectangular"
                    width={131}
                    height={40}
                />

                <Skeleton
                    className="text-end mb-4 "
                    variant="circular"
                    width={40}
                    height={40}
                />
            </div>

            <Skeleton
                className="rounded-[14px]"
                variant="rectangular"
                width={'100%'}
                height={220}
            />

            <Skeleton
                className="my-4 rounded-[14px]"
                variant="rectangular"
                width={'100%'}
                height={87.5}
            />

            <Skeleton
                className="mt-6 mb-3 rounded-[6px]"
                variant="rectangular"
                width={'100%'}
                height={32}
            />

            {[...Array(5)].map((_, index) => (
                <Skeleton
                    className=""
                    variant="text"
                    sx={{ fontSize: '1rem' }}
                    key={index}
                />
            ))}

            {[...Array(2)].map((_, index) => (
                <Skeleton
                    className="my-4 rounded-[14px]"
                    variant="rectangular"
                    width={'100%'}
                    height={84}
                    key={index}
                />
            ))}
        </div>
    );
};

export default loading;
