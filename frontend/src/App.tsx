import React, {useEffect, useState} from "react";
import {BrowserRouter, Navigate, Route, Routes, useLocation} from 'react-router-dom';
import {Breadcrumbs, Footer, Header, ThemeProvider} from './components';
import {AuthContext} from './hooks';
import {getMe, getSetupStatus} from './api/client';
import type {UserRole} from './types/user';

import {
    AboutPage,
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

const Layout = ({children}: { children: React.ReactNode }): React.JSX.Element => {
    return (
        <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-950">
            <Header/>
            <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-3">
                <Breadcrumbs/>
            </div>
            <main className="flex-1">
                {children}
            </main>
            <Footer/>
        </div>
    );
};

const App = (): React.JSX.Element => {
    const [email, setEmail] = useState<string | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [setupRequired, setSetupRequired] = useState(false);

    useEffect(() => {
        Promise.all([
            getMe().then((data) => {
                setEmail(data?.email ?? null);
                if (data?.role) {
                    setRole(data.role.replace(/^ROLE_/, '') as UserRole);
                } else {
                    setRole(null);
                }
            }).catch(() => {
                setEmail(null);
                setRole(null);
            }),
            getSetupStatus().then((data) => setSetupRequired(data.setupRequired)).catch(() => {
            }),
        ]).finally(() => setAuthChecked(true));
    }, []);

    const setAuthenticated = async (authenticated: boolean): Promise<void> => {
        if (!authenticated) {
            setEmail(null);
            setRole(null);
        } else {
            const data = await getMe().catch(() => null);
            setEmail(data?.email ?? null);
            if (data?.role) {
                setRole(data.role.replace(/^ROLE_/, '') as UserRole);
            } else {
                setRole(null);
            }
        }
    };

    if (!authChecked) {
        return <></>;
    }

    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthContext.Provider value={{username: email, role, setAuthenticated}}>
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
                        <Route path="/" element={
                            <Layout>
                                <HomePage/>
                            </Layout>
                        }/>
                        <Route path="/dashboard" element={
                            <ProtectedRoute email={email}><Layout><DashboardPage/></Layout></ProtectedRoute>
                        }/>
                        <Route path="/equipment" element={
                            <ProtectedRoute email={email}><Layout><EquipmentPage/></Layout></ProtectedRoute>
                        }/>
                        <Route path="/equipment/new" element={
                            <ProtectedRoute email={email}><Layout><NewEquipmentPage/></Layout></ProtectedRoute>
                        }/>
                        <Route path="/equipment/import" element={
                            <ProtectedRoute email={email}><Layout><ImportEquipmentPage/></Layout></ProtectedRoute>
                        }/>
                        <Route path="/equipment/:id" element={
                            <ProtectedRoute email={email}><Layout><EquipmentShowPage/></Layout></ProtectedRoute>
                        }/>
                        <Route path="/equipment/:id/edit" element={
                            <ProtectedRoute email={email}><Layout><EditEquipmentPage/></Layout></ProtectedRoute>
                        }/>
                        <Route path="/equipment/:id/procedures" element={
                            <ProtectedRoute email={email}><Layout><ProceduresPage/></Layout></ProtectedRoute>
                        }/>
                        <Route path="/equipment/:id/procedures/new" element={
                            <ProtectedRoute email={email}><Layout><NewProcedurePage/></Layout></ProtectedRoute>
                        }/>
                        <Route path="/equipment/:id/procedures/:procedureId" element={
                            <ProtectedRoute email={email}><Layout><ProcedureShowPage/></Layout></ProtectedRoute>
                        }/>
                        <Route path="/equipment/:id/procedures/:procedureId/edit" element={
                            <ProtectedRoute email={email}><Layout><EditProcedurePage/></Layout></ProtectedRoute>
                        }/>
                        <Route path="/equipment/:id/procedures/:procedureId/perform" element={
                            <ProtectedRoute email={email}><Layout><PerformProcedurePage/></Layout></ProtectedRoute>
                        }/>
                        <Route path="/equipment/:id/procedures/:procedureId/history" element={
                            <ProtectedRoute email={email}><Layout><ProcedureHistoryPage/></Layout></ProtectedRoute>
                        }/>
                        <Route path="/users" element={
                            <ProtectedRoute email={email}><Layout><UsersPage/></Layout></ProtectedRoute>
                        }/>
                        <Route path="/users/new" element={
                            <ProtectedRoute email={email}><Layout><NewUserPage/></Layout></ProtectedRoute>
                        }/>
                        <Route path="/users/:id/edit" element={
                            <ProtectedRoute email={email}><Layout><EditUserPage/></Layout></ProtectedRoute>
                        }/>
                        <Route path="/about" element={<Layout><AboutPage/></Layout>}/>
                        <Route path="/contact" element={<Layout><ContactPage/></Layout>}/>
                    </Routes>
                </BrowserRouter>
            </AuthContext.Provider>
        </ThemeProvider>
    );
};

export {App};
