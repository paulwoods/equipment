import type {Equipment, ImportResult} from "../types/equipment";
import type {Procedure} from "../types/procedure";

const api = async (path: string, opts?: RequestInit) => {
    const res = await fetch(path, {credentials: 'include', ...opts});
    if (res.status === 401) {
        window.location.href = '/login';
        throw new Error('Unauthorized');
    }
    return res;
};

const json = async (path: string, opts?: RequestInit) => {
    const res = await api(path, opts);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed: ${res.status}`);
    }
    return res.json();
};

const jsonBody = (method: string, data: unknown) => ({
    method,
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data),
});

// Auth
export const login = (username: string, password: string) =>
    fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        body: new URLSearchParams({username, password}),
    });

export const logout = () => api('/api/auth/logout', {method: 'POST'});

export const getMe = () =>
    fetch('/api/auth/me', {credentials: 'include'}).then(res => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
    });

// Setup
export const getSetupStatus = (): Promise<{ setupRequired: boolean }> =>
    fetch('/api/setup/status', {credentials: 'include'}).then(res => res.json());

export const setupAdmin = (email: string, password: string) =>
    fetch('/api/setup', {
        method: 'POST',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password}),
    });

// Equipment
export const fetchEquipment = (): Promise<Equipment[]> => json('/api/equipment');

export const getEquipment = (id: string): Promise<Equipment> => json(`/api/equipment/${id}`);

export const addEquipment = (data: Omit<Equipment, 'id'>): Promise<Equipment> =>
    json('/api/equipment', jsonBody('POST', data));

export const updateEquipment = (id: string, data: Omit<Equipment, 'id'>): Promise<Equipment> =>
    json(`/api/equipment/${id}`, jsonBody('PUT', data));

export const deleteEquipment = (id: string): Promise<void> =>
    api(`/api/equipment/${id}`, {method: 'DELETE'}).then(() => undefined);

export const importEquipment = async (file: File): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api('/api/equipment/import', {method: 'POST', body: formData});
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Import failed: ${res.status}`);
    }
    return res.json();
};

// Procedures
export const fetchProcedures = (equipmentId: string): Promise<Procedure[]> =>
    json(`/api/equipment/${equipmentId}/procedures`);

export const getProcedure = (equipmentId: string, procedureId: string): Promise<Procedure> =>
    json(`/api/equipment/${equipmentId}/procedures/${procedureId}`);

export const addProcedure = (equipmentId: string, data: Omit<Procedure, 'id'>): Promise<Procedure> =>
    json(`/api/equipment/${equipmentId}/procedures`, jsonBody('POST', data));

export const updateProcedure = (equipmentId: string, procedureId: string, data: Omit<Procedure, 'id'>): Promise<Procedure> =>
    json(`/api/equipment/${equipmentId}/procedures/${procedureId}`, jsonBody('PUT', data));

export const deleteProcedure = (equipmentId: string, procedureId: string): Promise<void> =>
    api(`/api/equipment/${equipmentId}/procedures/${procedureId}`, {method: 'DELETE'}).then(() => undefined);

// Performance History
export const recordPerformance = (equipmentId: string, procedureId: string, date: string, notes: string) =>
    json(`/api/equipment/${equipmentId}/procedures/${procedureId}/history`, jsonBody('POST', {date, notes}));

// Email
export const sendDashboardEmail = (): Promise<{ success?: boolean; error?: string }> =>
    json('/api/email/dashboard', {method: 'POST'});
