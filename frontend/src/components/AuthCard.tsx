import React from 'react';

interface AuthCardProps {
    title: string;
    subtitle: string;
    children: React.ReactNode;
}

export const AuthCard = ({title, subtitle, children}: AuthCardProps): React.JSX.Element => {
    return (
        <div className="max-w-md w-full space-y-8 p-8 rounded-xl border shadow-lg bg-card border-border">
            <div>
                <h2 className="text-center text-3xl font-extrabold text-card-foreground">{title}</h2>
                <p className="mt-2 text-center text-sm text-muted-foreground">{subtitle}</p>
            </div>
            {children}
        </div>
    );
};
