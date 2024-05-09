
import React from 'react';
import { Skeleton } from '@mui/material';

const EventsSkeleton = () => {
    return (
        <div>
            <Skeleton
                className="rounded-[6px] mb-4"
                variant="rectangular"
                width={'100%'}
                height={40}
            />

            <Skeleton
                className="rounded-[14px] mb-4"
                variant="rectangular"
                width={'100%'}
                height={346}
            />

            <Skeleton
                className="rounded-[14px]"
                variant="rectangular"
                width={'100%'}
                height={346}
            />
        </div>
    );
};

export default EventsSkeleton;
