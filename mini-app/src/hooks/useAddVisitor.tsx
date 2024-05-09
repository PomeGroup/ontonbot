'use client'

import { useLayoutEffect } from 'react';

import useWebApp from '@/hooks/useWebApp';
import { trpc } from '@/app/_trpc/client';

const useAddVisitor = (hash: string) => {
    const addVisitorMutation = trpc.visitors.add.useMutation();
    const WebApp = useWebApp();

    useLayoutEffect(() => {
        const addVisitor = async () => {
            await addVisitorMutation.mutateAsync({
                initData: WebApp?.initData,
                event_uuid: hash,
            });
        };

        addVisitor();
    }, [hash, WebApp?.initData]);
};

export default useAddVisitor;
