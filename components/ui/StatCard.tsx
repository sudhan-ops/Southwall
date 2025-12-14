
import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon }) => {
    return (
        <div className={`p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center col-span-1 gap-3 md:gap-0 transition-colors bg-card shadow-sm`}>
            <div className={`p-3 rounded-full md:mr-4 bg-accent-light`}>
                <Icon className={`h-6 w-6 text-accent-dark`} />
            </div>
            <div>
                <p className={`text-sm font-medium text-muted`}>{title}</p>
                <p className={`text-2xl font-bold text-primary-text`}>{value}</p>
            </div>
        </div>
    );
};

export default React.memo(StatCard);