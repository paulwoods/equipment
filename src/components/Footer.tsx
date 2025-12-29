import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-8 px-4 sm:px-6 lg:px-8 mt-auto">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="text-center md:text-left">
                    &copy; {new Date().getFullYear()} Equipment Manager. All rights reserved.
                </div>
                <div className="flex gap-6">
                    <Link href="/about" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        About
                    </Link>
                    <Link href="/contact" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        Contact
                    </Link>
                    <Link href="/equipment" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        Equipment
                    </Link>
                    <Link href="/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        Dashboard
                    </Link>
                </div>
            </div>
        </footer>
    );
}
