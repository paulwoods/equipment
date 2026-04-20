import React, {useEffect, useState} from "react";
import {getVersion} from "../api/client";

export const Footer = (): React.JSX.Element => {
    const [serverVersion, setServerVersion] = useState<string | null>(null);

    useEffect(() => {
        getVersion()
            .then(data => setServerVersion(data.version))
            .catch(() => {
            });
    }, []);

    return (
        <footer
            className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-4 px-4 sm:px-6 lg:px-8 mt-auto">
            <div
                className="max-w-4xl mx-auto flex justify-center items-center gap-8 text-sm text-gray-500 dark:text-gray-400">
                <span>Equipment Manager</span>
                <span>
                    {serverVersion && <>Server Version {serverVersion} / </>}
                    Client Version {__APP_VERSION__}
                </span>
            </div>
        </footer>
    );
};
