import React from "react";
import {cn} from "../lib/utils";

interface PageContainerProps {
    children: React.ReactNode;
    className?: string;
}

export const PageContainer = ({children, className}: PageContainerProps): React.JSX.Element => {
    return (
        <div className="min-h-screen bg-background px-4 sm:px-6 lg:px-8">
            <div className={cn("mx-auto", className)}>{children}</div>
        </div>
    );
};
