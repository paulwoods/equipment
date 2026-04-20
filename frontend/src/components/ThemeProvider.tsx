import React from "react";
import {ThemeProvider as NextThemesProvider} from "next-themes";

export const ThemeProvider = ({
                                  children,
                                  ...props
                              }: React.ComponentProps<typeof NextThemesProvider>): React.JSX.Element => {
    return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
};
