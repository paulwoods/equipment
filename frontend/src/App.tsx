import React, {useEffect, useState} from "react";
import {BrowserRouter, Navigate, Route, Routes, useLocation} from 'react-router-dom';
import {AppLayout, ThemeProvider} from './components';
import {AuthContext} from './hooks';
import {getMe, getSetupStatus} from './api/client';
import type {UserRole} from './types/user';

import {
    AboutPage,
    CalendarPage,
    ContactPage,
    DashboardPage,
    EditEquipmentPage,
    EditProcedurePage,
    EditUserPage,
    EquipmentPage,
    EquipmentShowPage,
    HomePage,
    ImportEquipmentPage,
    LoginPage,
    NewEquipmentPage,
    NewProcedurePage,
    NewUserPage,
    PerformProcedurePage,
    ProcedureHistoryPage,
    ProcedureShowPage,
    ProceduresPage,
    SetupPage,
    UsersPage
} from './pages';

const ProtectedRoute = ({email, children}: { email: string | null; children: React.ReactNode }): React.JSX.Element => {
    const location = useLocation();
    if (!email) {
        const returnTo = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/login?returnTo=${returnTo}`} replace/>;
    }
    return <>{children}</>;
};

const parseRole = (raw: string | undefined): UserRole | null =>
    raw ? (raw.replace(/^ROLE_/, '') as UserRole) : null;

const App = (): React.JSX.Element => {
    const [email, setEmail] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [setupRequired, setSetupRequired] = useState(false);

    const applyAuthData = (data: { id: string; email: string; role: string } | null): void => {
        setEmail(data?.email ?? null);
        setUserId(data?.id ?? null);
        setRole(parseRole(data?.role));
    };

    useEffect(() => {
        Promise.all([
            getMe().then(applyAuthData).catch(() => applyAuthData(null)),
            getSetupStatus().then((data) => setSetupRequired(data.setupRequired)).catch(() => {
            }),
        ]).finally(() => setAuthChecked(true));
    }, []);

    const setAuthenticated = async (authenticated: boolean): Promise<void> => {
        if (!authenticated) {
            applyAuthData(null);
        } else {
            const data = await getMe().catch(() => null);
            applyAuthData(data);
        }
    };

    if (!authChecked) {
        return <></>;
    }

    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthContext.Provider value={{username: email, userId, role, setAuthenticated}}>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={
                            setupRequired
                                ? <Navigate to="/setup" replace/>
                                : <LoginPage/>
                        }/>
                        <Route path="/setup" element={
                            !setupRequired
                                ? <Navigate to="/login" replace/>
                                : email
                                    ? <Navigate to="/dashboard" replace/>
                                    : <SetupPage onSetupComplete={(e) => {
                                        setSetupRequired(false);
                                        setEmail(e);
                                        setRole('ADMIN');
                                    }}/>
                        }/>
                        <Route element={<AppLayout/>}>
                            <Route path="/" element={<HomePage/>}/>
                            <Route path="/dashboard" element={<ProtectedRoute email={email}><DashboardPage/></ProtectedRoute>}/>
                            <Route path="/calendar" element={<ProtectedRoute email={email}><CalendarPage/></ProtectedRoute>}/>
                            <Route path="/equipment" element={<ProtectedRoute email={email}><EquipmentPage/></ProtectedRoute>}/>
                            <Route path="/equipment/new" element={<ProtectedRoute email={email}><NewEquipmentPage/></ProtectedRoute>}/>
                            <Route path="/equipment/import" element={<ProtectedRoute email={email}><ImportEquipmentPage/></ProtectedRoute>}/>
                            <Route path="/equipment/:id" element={<ProtectedRoute email={email}><EquipmentShowPage/></ProtectedRoute>}/>
                            <Route path="/equipment/:id/edit" element={<ProtectedRoute email={email}><EditEquipmentPage/></ProtectedRoute>}/>
                            <Route path="/equipment/:id/procedures" element={<ProtectedRoute email={email}><ProceduresPage/></ProtectedRoute>}/>
                            <Route path="/equipment/:id/procedures/new" element={<ProtectedRoute email={email}><NewProcedurePage/></ProtectedRoute>}/>
                            <Route path="/equipment/:id/procedures/:procedureId" element={<ProtectedRoute email={email}><ProcedureShowPage/></ProtectedRoute>}/>
                            <Route path="/equipment/:id/procedures/:procedureId/edit" element={<ProtectedRoute email={email}><EditProcedurePage/></ProtectedRoute>}/>
                            <Route path="/equipment/:id/procedures/:procedureId/perform" element={<ProtectedRoute email={email}><PerformProcedurePage/></ProtectedRoute>}/>
                            <Route path="/equipment/:id/procedures/:procedureId/history" element={<ProtectedRoute email={email}><ProcedureHistoryPage/></ProtectedRoute>}/>
                            <Route path="/users" element={<ProtectedRoute email={email}><UsersPage/></ProtectedRoute>}/>
                            <Route path="/users/new" element={<ProtectedRoute email={email}><NewUserPage/></ProtectedRoute>}/>
                            <Route path="/users/:id/edit" element={<ProtectedRoute email={email}><EditUserPage/></ProtectedRoute>}/>
                            <Route path="/about" element={<AboutPage/>}/>
                            <Route path="/contact" element={<ContactPage/>}/>
                        </Route>
                    </Routes>
                </BrowserRouter>
            </AuthContext.Provider>
        </ThemeProvider>
    );
};

export {App};
