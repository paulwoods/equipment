import React from "react";
import {Moon, Sun} from "lucide-react";
import {useTheme} from "next-themes";

export const ThemeToggle = (): React.JSX.Element => {
    const {resolvedTheme, setTheme} = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <button
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle theme"
            >
                <div className="w-5 h-5"/>
            </button>
        );
    }

    return (
        <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle theme"
        >
            {resolvedTheme === "dark" ? (
                <Sun className="w-5 h-5 text-yellow-500"/>
            ) : (
                <Moon className="w-5 h-5 text-gray-700"/>
            )}
        </button>
    );
};
