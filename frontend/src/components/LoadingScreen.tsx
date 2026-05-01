import React from 'react';

interface LoadingScreenProps {
    message?: string;
}

export const LoadingScreen = ({message = 'Loading...'}: LoadingScreenProps): React.JSX.Element => {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <p className="text-muted-foreground">{message}</p>
        </div>
    );
};
