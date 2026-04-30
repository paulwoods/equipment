import React, {useEffect, useState} from "react";
import {Link, useLocation, useParams} from "react-router-dom";
import {ChevronRight, Home} from "lucide-react";
import {fetchEquipment, getProcedure} from "../api/client";
import type {Equipment} from "../types/equipment";
import type {Procedure} from "../types/procedure";

interface BreadcrumbItem {
    label: string;
    href: string;
}

export const Breadcrumbs = (): React.JSX.Element | null => {
    const location = useLocation();
    const params = useParams();
    const pathname = location.pathname;
    const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
    const [procedure, setProcedure] = useState<Procedure | null>(null);

    useEffect(() => {
        if (params.id) {
            fetchEquipment().then(setEquipmentList).catch(() => {
            });
        }
    }, [params.id]);

    useEffect(() => {
        if (!params.id || !params.procedureId) return;
        let cancelled = false;
        getProcedure(params.id, params.procedureId)
            .then(p => {
                if (!cancelled) setProcedure(p);
            })
            .catch(() => {
            });
        return () => {
            cancelled = true;
        };
    }, [params.id, params.procedureId]);

    if (pathname === "/" || pathname === "/login") return null;

    const pathSegments = pathname.split("/").filter((segment) => segment !== "");

    const breadcrumbs: BreadcrumbItem[] = pathSegments.reduce<BreadcrumbItem[]>((acc, segment, index) => {
        if (params.id === segment && pathSegments[index - 1] !== 'equipment') {
            return acc;
        }

        const href = `/${pathSegments.slice(0, index + 1).join("/")}`;

        let label = segment.charAt(0).toUpperCase() + segment.slice(1);

        if (segment === "equipment") label = "Equipment";
        if (segment === "procedures") label = "Procedures";
        if (segment === "new") label = "New";
        if (segment === "edit") label = "Edit";
        if (segment === "perform") label = "Perform";
        if (segment === "history") label = "History";
        if (segment === "dashboard") label = "Dashboard";

        if (params.id === segment && pathSegments[index - 1] === 'equipment') {
            const equipment = equipmentList.find(e => e.id === segment);
            label = equipment ? equipment.modelNumber : "Equipment Details";
        }

        if (params.procedureId === segment) {
            label = procedure ? procedure.name : "Procedure Details";
        }

        acc.push({label, href});
        return acc;
    }, []);

    return (
        <nav className="flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                    <Link
                        to="/"
                        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                        <Home className="w-4 h-4 mr-2"/>
                        Home
                    </Link>
                </li>
                {breadcrumbs.map((breadcrumb, index) => (
                    <li key={breadcrumb.href}>
                        <div className="flex items-center">
                            <ChevronRight className="w-4 h-4 text-muted-foreground mx-1"/>
                            {index === breadcrumbs.length - 1 ? (
                                <span
                                    className="ml-1 text-sm font-medium text-muted-foreground md:ml-2">
                                    {breadcrumb.label}
                                </span>
                            ) : (
                                <Link
                                    to={breadcrumb.href}
                                    className="ml-1 text-sm font-medium text-muted-foreground hover:text-foreground md:ml-2"
                                >
                                    {breadcrumb.label}
                                </Link>
                            )}
                        </div>
                    </li>
                ))}
            </ol>
        </nav>
    );
};
