import {useEffect, useState} from 'react';
import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
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
    const [username, setUsername] = useState<string | null>(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [setupRequired, setSetupRequired] = useState(false);

    useEffect(() => {
        Promise.all([
            getMe().then((data) => setUsername(data.username)).catch(() => setUsername(null)),
            getSetupStatus().then((data) => setSetupRequired(data.setupRequired)).catch(() => {
            }),
        ]).finally(() => setAuthChecked(true));
    }, []);

    const setAuthenticated = (authenticated: boolean) => {
        if (!authenticated) {
            setUsername(null);
        } else {
            getMe().then((data) => setUsername(data.username)).catch(() => setUsername(null));
        }
    };

    if (!authChecked) {
        return null;
    }

    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthContext.Provider value={{username, setAuthenticated}}>
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
                                : username
                                    ? <Navigate to="/dashboard" replace/>
                                    : <SetupPage onSetupComplete={(email) => {
                                        setSetupRequired(false);
                                        setUsername(email);
                                    }}/>
                        }/>
                        <Route path="/" element={
                            <Layout>
                                <HomePage/>
                            </Layout>
                        }/>
                        <Route path="/dashboard" element={
                            username ? <Layout><DashboardPage/></Layout> : <Navigate to="/login" replace/>
                        }/>
                        <Route path="/equipment" element={
                            username ? <Layout><EquipmentPage/></Layout> : <Navigate to="/login" replace/>
                        }/>
                        <Route path="/equipment/new" element={
                            username ? <Layout><NewEquipmentPage/></Layout> : <Navigate to="/login" replace/>
                        }/>
                        <Route path="/equipment/import" element={
                            username ? <Layout><ImportEquipmentPage/></Layout> : <Navigate to="/login" replace/>
                        }/>
                        <Route path="/equipment/:id" element={
                            username ? <Layout><EquipmentShowPage/></Layout> : <Navigate to="/login" replace/>
                        }/>
                        <Route path="/equipment/:id/edit" element={
                            username ? <Layout><EditEquipmentPage/></Layout> : <Navigate to="/login" replace/>
                        }/>
                        <Route path="/equipment/:id/procedures" element={
                            username ? <Layout><ProceduresPage/></Layout> : <Navigate to="/login" replace/>
                        }/>
                        <Route path="/equipment/:id/procedures/new" element={
                            username ? <Layout><NewProcedurePage/></Layout> : <Navigate to="/login" replace/>
                        }/>
                        <Route path="/equipment/:id/procedures/:procedureId" element={
                            username ? <Layout><ProcedureShowPage/></Layout> : <Navigate to="/login" replace/>
                        }/>
                        <Route path="/equipment/:id/procedures/:procedureId/edit" element={
                            username ? <Layout><EditProcedurePage/></Layout> : <Navigate to="/login" replace/>
                        }/>
                        <Route path="/equipment/:id/procedures/:procedureId/perform" element={
                            username ? <Layout><PerformProcedurePage/></Layout> : <Navigate to="/login" replace/>
                        }/>
                        <Route path="/equipment/:id/procedures/:procedureId/history" element={
                            username ? <Layout><ProcedureHistoryPage/></Layout> : <Navigate to="/login" replace/>
                        }/>
                        <Route path="/about" element={<Layout><AboutPage/></Layout>}/>
                        <Route path="/contact" element={<Layout><ContactPage/></Layout>}/>
                    </Routes>
                </BrowserRouter>
            </AuthContext.Provider>
        </ThemeProvider>
    );
}
