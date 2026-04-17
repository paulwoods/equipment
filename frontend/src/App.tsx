import {useEffect, useState} from 'react';
import {BrowserRouter, Navigate, Route, Routes, useLocation} from 'react-router-dom';
import {ThemeProvider} from './components/ThemeProvider';
import {AuthContext} from './hooks/useAuth';
import {getMe, getSetupStatus} from './api/client';
import Header from './components/Header';
import Breadcrumbs from './components/Breadcrumbs';
import Footer from './components/Footer';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SetupPage from './pages/SetupPage';
import DashboardPage from './pages/DashboardPage';
import EquipmentPage from './pages/EquipmentPage';
import NewEquipmentPage from './pages/NewEquipmentPage';
import EquipmentShowPage from './pages/EquipmentShowPage';
import EditEquipmentPage from './pages/EditEquipmentPage';
import ProceduresPage from './pages/ProceduresPage';
import NewProcedurePage from './pages/NewProcedurePage';
import ProcedureShowPage from './pages/ProcedureShowPage';
import EditProcedurePage from './pages/EditProcedurePage';
import PerformProcedurePage from './pages/PerformProcedurePage';
import ProcedureHistoryPage from './pages/ProcedureHistoryPage';
import ImportEquipmentPage from './pages/ImportEquipmentPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';

function ProtectedRoute({email, children}: { email: string | null; children: React.ReactNode }) {
    const location = useLocation();
    if (!email) {
        const returnTo = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/login?returnTo=${returnTo}`} replace/>;
    }
    return <>{children}</>;
}

function Layout({children}: { children: React.ReactNode }) {
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
}

export default function App() {
    const [email, setEmail] = useState<string | null>(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [setupRequired, setSetupRequired] = useState(false);

    useEffect(() => {
        Promise.all([
            getMe().then((data) => setEmail(data?.email ?? null)).catch(() => setEmail(null)),
            getSetupStatus().then((data) => setSetupRequired(data.setupRequired)).catch(() => {
            }),
        ]).finally(() => setAuthChecked(true));
    }, []);

    const setAuthenticated = async (authenticated: boolean) => {
        if (!authenticated) {
            setEmail(null);
        } else {
            const data = await getMe().catch(() => null);
            setEmail(data?.email ?? null);
        }
    };

    if (!authChecked) {
        return null;
    }

    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthContext.Provider value={{username: email, setAuthenticated}}>
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
                                    : <SetupPage onSetupComplete={(email) => {
                                        setSetupRequired(false);
                                        setEmail(email);
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
                        <Route path="/about" element={<Layout><AboutPage/></Layout>}/>
                        <Route path="/contact" element={<Layout><ContactPage/></Layout>}/>
                    </Routes>
                </BrowserRouter>
            </AuthContext.Provider>
        </ThemeProvider>
    );
}
