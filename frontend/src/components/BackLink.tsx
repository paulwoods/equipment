import React from "react";
import {Link} from "react-router-dom";

interface BackLinkProps {
    to: string;
    children: React.ReactNode;
}

export const BackLink = ({to, children}: BackLinkProps): React.JSX.Element => {
    return (
        <Link
            to={to}
            className="text-primary hover:opacity-80 flex items-center gap-2 font-medium"
        >
            <span aria-hidden="true">←</span> {children}
        </Link>
    );
};
