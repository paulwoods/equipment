import Link from "next/link";
import Image from "next/image";

export default function Header() {
    return (
        <header className="bg-white shadow">
            <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center gap-4">
                <Link href="/" className="flex items-center gap-3">
                    <Image
                        src="/logo.svg"
                        alt="Equipment Manager Logo"
                        width={40}
                        height={40}
                        className="w-10 h-10"
                    />
                    <span className="text-2xl font-bold text-gray-900">Equipment Manager</span>
                </Link>
            </div>
        </header>
    );
}
