import {createContext, useContext} from "react";

interface AuthContextValue {
    username: string | null;
    setAuthenticated: (authenticated: boolean) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
    username: null,
    setAuthenticated: async () => {
    },
});

export const useAuth = (): AuthContextValue => {
    return useContext(AuthContext);
};
