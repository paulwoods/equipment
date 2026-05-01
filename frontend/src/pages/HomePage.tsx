import React from "react";
import {Link} from "react-router-dom";
import {ArrowRight, Info, LayoutDashboard, Mail, Package} from "lucide-react";

const HomePage = (): React.JSX.Element => {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                <div className="text-center mb-12">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground mb-4 tracking-tight">
                        Equipment Management System
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Track your equipment, schedule maintenance procedures, and monitor performance history all in
                        one place.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Link
                        to="/dashboard"
                        className="group bg-card p-8 rounded-2xl shadow-sm border border-border hover:border-indigo-500 hover:shadow-md transition-all duration-300 flex flex-col items-center text-center"
                    >
                        <div
                            className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                            <LayoutDashboard className="w-10 h-10"/>
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-3">Dashboard</h2>
                        <p className="text-muted-foreground mb-6 flex-grow">
                            View upcoming maintenance, due procedures, and overall status of your equipment fleet.
                        </p>
                        <div
                            className="flex items-center text-indigo-600 dark:text-indigo-400 font-semibold group-hover:gap-2 transition-all">
                            Go to Dashboard <ArrowRight
                            className="ml-2 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"/>
                        </div>
                    </Link>

                    <Link
                        to="/equipment"
                        className="group bg-card p-8 rounded-2xl shadow-sm border border-border hover:border-blue-500 hover:shadow-md transition-all duration-300 flex flex-col items-center text-center"
                    >
                        <div
                            className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Package className="w-10 h-10"/>
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-3">Equipment</h2>
                        <p className="text-muted-foreground mb-6 flex-grow">
                            Manage your equipment inventory, add new items, and configure specific maintenance
                            procedures.
                        </p>
                        <div
                            className="flex items-center text-blue-600 dark:text-blue-400 font-semibold group-hover:gap-2 transition-all">
                            Manage Equipment <ArrowRight
                            className="ml-2 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"/>
                        </div>
                    </Link>

                    <Link
                        to="/about"
                        className="group bg-card p-8 rounded-2xl shadow-sm border border-border hover:border-emerald-500 hover:shadow-md transition-all duration-300 flex flex-col items-center text-center"
                    >
                        <div
                            className="p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Info className="w-10 h-10"/>
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-3">About</h2>
                        <p className="text-muted-foreground mb-6 flex-grow">
                            Learn more about the Equipment Management System, its features, and the technology behind
                            it.
                        </p>
                        <div
                            className="flex items-center text-emerald-600 dark:text-emerald-400 font-semibold group-hover:gap-2 transition-all">
                            Learn More <ArrowRight
                            className="ml-2 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"/>
                        </div>
                    </Link>

                    <Link
                        to="/contact"
                        className="group bg-card p-8 rounded-2xl shadow-sm border border-border hover:border-amber-500 hover:shadow-md transition-all duration-300 flex flex-col items-center text-center"
                    >
                        <div
                            className="p-4 bg-amber-50 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Mail className="w-10 h-10"/>
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-3">Contact</h2>
                        <p className="text-muted-foreground mb-6 flex-grow">
                            Get in touch with us for support, questions, or feedback about the system.
                        </p>
                        <div
                            className="flex items-center text-amber-600 dark:text-amber-400 font-semibold group-hover:gap-2 transition-all">
                            Get in Touch <ArrowRight
                            className="ml-2 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"/>
                        </div>
                    </Link>
                </div>

                <div className="mt-16 text-center text-sm text-muted-foreground">
                    Built with Spring Boot and React
                </div>
            </div>
        </div>
    );
};

export {HomePage};
