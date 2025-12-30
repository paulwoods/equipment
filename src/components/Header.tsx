import Link from "next/link";
import Image from "next/image";
import {ThemeToggle} from "@/components/ThemeToggle";

export default function Header() {
    return (
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 sm:gap-3">
                    <Image
                        src="/logo.svg"
                        alt="Equipment Manager Logo"
                        width={40}
                        height={40}
                        className="w-8 h-8 sm:w-10 sm:h-10"
                    />
                    <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">Equipment Manager</span>
                </Link>
                <ThemeToggle/>
            </div>
        </header>
    );
}
