import {createContext, useContext} from "react";
import type {UserRole} from "../types/user";

interface AuthContextValue {
    username: string | null;
    userId: string | null;
    role: UserRole | null;
    setAuthenticated: (authenticated: boolean) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
    username: null,
    userId: null,
    role: null,
    setAuthenticated: async () => {
    },
});

export const useAuth = (): AuthContextValue => {
    return useContext(AuthContext);
};
