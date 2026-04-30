import {createContext, useContext} from "react";
import type {UserRole} from "../types/user";

interface AuthContextValue {
    email: string | null;
    username: string | null;
    userId: string | null;
    roles: UserRole[];
    setAuthenticated: (authenticated: boolean) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
    email: null,
    username: null,
    userId: null,
    roles: [],
    setAuthenticated: async () => {
    },
});

export const useAuth = (): AuthContextValue => {
    return useContext(AuthContext);
};
