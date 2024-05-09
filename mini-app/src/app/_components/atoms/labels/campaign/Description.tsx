import { cn } from '@/utils';
import React from 'react';

const CampaignDescription: React.FC<{ description: string, className?: string }> = ({
    description,
    className
}) => {
    return <div className={cn(className)}>{description}</div>;
};

export default CampaignDescription;
