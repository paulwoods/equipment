import React from "react";

interface PageLoaderProps {
    message?: string;
}

export const PageLoader = ({message = "Loading..."}: PageLoaderProps): React.JSX.Element => {
    return <div className="p-8 text-center text-muted-foreground">{message}</div>;
};
