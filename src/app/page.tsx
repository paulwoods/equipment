import Link from "next/link";
import {LayoutDashboard, Package, ArrowRight} from "lucide-react";

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                <div className="text-center mb-12">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-gray-100 mb-4 tracking-tight">
                        Equipment Management System
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Track your equipment, schedule maintenance procedures, and monitor performance history all in one place.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Dashboard Card */}
                    <Link
                        href="/dashboard"
                        className="group bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all duration-300 flex flex-col items-center text-center"
                    >
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                            <LayoutDashboard className="w-10 h-10"/>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Dashboard</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 flex-grow">
                            View upcoming maintenance, due procedures, and overall status of your equipment fleet.
                        </p>
                        <div className="flex items-center text-indigo-600 dark:text-indigo-400 font-semibold group-hover:gap-2 transition-all">
                            Go to Dashboard <ArrowRight className="ml-2 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </Link>

                    {/* Equipment Card */}
                    <Link
                        href="/equipment"
                        className="group bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all duration-300 flex flex-col items-center text-center"
                    >
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Package className="w-10 h-10"/>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Equipment</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 flex-grow">
                            Manage your equipment inventory, add new items, and configure specific maintenance procedures.
                        </p>
                        <div className="flex items-center text-blue-600 dark:text-blue-400 font-semibold group-hover:gap-2 transition-all">
                            Manage Equipment <ArrowRight className="ml-2 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </Link>
                </div>

                <div className="mt-16 text-center text-sm text-gray-500 dark:text-gray-500">
                    Built with Next.js and Tailwind CSS
                </div>
            </div>
        </div>
    );
}
