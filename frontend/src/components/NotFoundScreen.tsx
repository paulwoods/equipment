import React from 'react';
import {Link} from 'react-router-dom';

interface NotFoundScreenProps {
    title: string;
    backTo: string;
    backLabel: string;
}

export const NotFoundScreen = ({title, backTo, backLabel}: NotFoundScreenProps): React.JSX.Element => {
    return (
        <div className="min-h-screen bg-background py-8 px-4">
            <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-2xl font-bold text-foreground mb-4">{title}</h1>
                <Link to={backTo} className="text-primary hover:underline">
                    {backLabel}
                </Link>
            </div>
        </div>
    );
};
