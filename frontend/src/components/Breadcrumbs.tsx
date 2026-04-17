import {Link, useLocation, useParams} from "react-router-dom";
import {ChevronRight, Home} from "lucide-react";
import {useEffect, useState} from "react";
import {fetchEquipment} from "../api/client";
import type {Equipment} from "../types/equipment";

interface BreadcrumbItem {
    label: string;
    href: string;
}

export default function Breadcrumbs() {
    const location = useLocation();
    const params = useParams();
    const pathname = location.pathname;
    const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);

    useEffect(() => {
        if (params.id) {
            fetchEquipment().then(setEquipmentList).catch(() => {
            });
        }
    }, [params.id]);

    if (pathname === "/" || pathname === "/login") return null;

    const pathSegments = pathname.split("/").filter((segment) => segment !== "");

    const breadcrumbs: BreadcrumbItem[] = pathSegments.map((segment, index) => {
        const href = `/${pathSegments.slice(0, index + 1).join("/")}`;

        let label = segment.charAt(0).toUpperCase() + segment.slice(1);

        if (segment === "equipment") label = "Equipment";
        if (segment === "procedures") label = "Procedures";
        if (segment === "new") label = "New";
        if (segment === "edit") label = "Edit";
        if (segment === "perform") label = "Perform";
        if (segment === "history") label = "History";
        if (segment === "dashboard") label = "Dashboard";

        if (params.id === segment) {
            const equipment = equipmentList.find(e => e.id === segment);
            label = equipment ? equipment.modelNumber : "Equipment Details";
        }

        if (params.procedureId === segment) {
            const equipmentId = params.id as string;
            const equipment = equipmentList.find(e => e.id === equipmentId);
            const procedure = equipment?.procedures?.find(p => p.id === segment);
            label = procedure ? procedure.name : "Procedure Details";
        }

        return {label, href};
    });

    return (
        <nav className="flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                    <Link
                        to="/"
                        className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
                    >
                        <Home className="w-4 h-4 mr-2"/>
                        Home
                    </Link>
                </li>
                {breadcrumbs.map((breadcrumb, index) => (
                    <li key={breadcrumb.href}>
                        <div className="flex items-center">
                            <ChevronRight className="w-4 h-4 text-gray-400 mx-1"/>
                            {index === breadcrumbs.length - 1 ? (
                                <span
                                    className="ml-1 text-sm font-medium text-gray-500 md:ml-2 dark:text-gray-400">
                                    {breadcrumb.label}
                                </span>
                            ) : (
                                <Link
                                    to={breadcrumb.href}
                                    className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2 dark:text-gray-400 dark:hover:text-white"
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
}
