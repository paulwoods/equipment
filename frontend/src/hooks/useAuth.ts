import {createContext, useContext} from "react";

interface AuthContextValue {
    username: string | null;
    setAuthenticated: (authenticated: boolean) => void;
}

export const AuthContext = createContext<AuthContextValue>({
    username: null,
    setAuthenticated: () => {
    },
});

export function useAuth() {
    return useContext(AuthContext);
}
