
import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
}

import { useBrandingStore } from '../../store/brandingStore';

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon }) => {
    const { colorScheme } = useBrandingStore();

    return (
        <div className={`p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center col-span-1 gap-3 md:gap-0 transition-colors ${colorScheme === 'blue' ? '!bg-blue-500 !text-white shadow-md' : 'bg-card shadow-sm'}`}>
            <div className={`p-3 rounded-full md:mr-4 ${colorScheme === 'blue' ? 'bg-white/20' : 'bg-accent-light'}`}>
                <Icon className={`h-6 w-6 ${colorScheme === 'blue' ? '!text-white' : 'text-accent-dark'}`} />
            </div>
            <div>
                <p className={`text-sm font-medium ${colorScheme === 'blue' ? '!text-white' : 'text-muted'}`}>{title}</p>
                <p className={`text-2xl font-bold ${colorScheme === 'blue' ? '!text-white' : 'text-primary-text'}`}>{value}</p>
            </div>
        </div>
    );
};

export default React.memo(StatCard);