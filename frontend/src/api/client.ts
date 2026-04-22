import axios from 'axios';
import {apiClient} from '../lib/apiClient';
import type {DashboardItem, Equipment, ImportResult} from '../types/equipment';
import type {Perform, Procedure} from '../types/procedure';
import type {User, UserCreatePayload, UserUpdatePayload} from '../types/user';

// Version
export const getVersion = async (): Promise<{ version: string }> => {
    const {data} = await apiClient.get<{ version: string }>('/api/v1/version');
    return data;
};

// Auth
export const login = async (email: string, password: string): Promise<{ ok: boolean; status: number }> => {
    try {
        await apiClient.post('/api/v1/auth/login', {email, password});
        return {ok: true, status: 200};
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            return {ok: false, status: error.response.status};
        }
        return {ok: false, status: 500};
    }
};

export const logout = async (): Promise<void> => {
    await apiClient.post('/api/v1/auth/logout');
};

export const getMe = async (): Promise<{ email: string; role: string } | null> => {
    const {data} = await apiClient.get<{ email: string; role: string } | null>('/api/v1/auth/me');
    return data;
};

// Setup
export const getSetupStatus = async (): Promise<{ setupRequired: boolean }> => {
    const {data} = await apiClient.get<{ setupRequired: boolean }>('/api/v1/setup/status');
    return data;
};

export const setupAdmin = async (email: string, password: string): Promise<{ ok: boolean; status: number }> => {
    try {
        await apiClient.post('/api/v1/setup', {email, password});
        return {ok: true, status: 200};
    } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
            return {ok: false, status: error.response.status};
        }
        return {ok: false, status: 500};
    }
};

// Equipment
export const fetchEquipment = async (): Promise<Equipment[]> => {
    const {data} = await apiClient.get<{ content: Equipment[] }>('/api/v1/equipment');
    return data.content;
};

export const getEquipment = async (id: string): Promise<Equipment> => {
    const {data} = await apiClient.get<Equipment>(`/api/v1/equipment/${id}`);
    return data;
};

export const addEquipment = async (payload: Omit<Equipment, 'id'>): Promise<Equipment> => {
    const {data} = await apiClient.post<Equipment>('/api/v1/equipment', payload);
    return data;
};

export const updateEquipment = async (id: string, payload: Omit<Equipment, 'id'>): Promise<Equipment> => {
    const {data} = await apiClient.put<Equipment>(`/api/v1/equipment/${id}`, payload);
    return data;
};

export const deleteEquipment = async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/equipment/${id}`);
};

export const exportEquipment = async (): Promise<void> => {
    const response = await apiClient.get('/api/v1/equipment/export', {responseType: 'blob'});
    const blob = new Blob([response.data as BlobPart]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const disposition = response.headers['content-disposition'] as string | undefined;
    const match = disposition?.match(/filename="(.+)"/);
    a.download = match?.[1] ?? 'equipment-export.json';
    a.click();
    URL.revokeObjectURL(url);
};

export const importEquipment = async (file: File): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const {data} = await apiClient.post<ImportResult>('/api/v1/equipment/import', formData, {
        headers: {'Content-Type': 'multipart/form-data'},
    });
    return data;
};

// Procedures
export const fetchProcedures = async (equipmentId: string): Promise<Procedure[]> => {
    const {data} = await apiClient.get<Procedure[]>(`/api/v1/equipment/${equipmentId}/procedures`);
    return data;
};

export const getProcedure = async (equipmentId: string, procedureId: string): Promise<Procedure> => {
    const {data} = await apiClient.get<Procedure>(`/api/v1/equipment/${equipmentId}/procedures/${procedureId}`);
    return data;
};

export const addProcedure = async (equipmentId: string, payload: Omit<Procedure, 'id'>): Promise<Procedure> => {
    const {data} = await apiClient.post<Procedure>(`/api/v1/equipment/${equipmentId}/procedures`, payload);
    return data;
};

export const updateProcedure = async (
    equipmentId: string,
    procedureId: string,
    payload: Omit<Procedure, 'id'>,
): Promise<Procedure> => {
    const {data} = await apiClient.put<Procedure>(
        `/api/v1/equipment/${equipmentId}/procedures/${procedureId}`,
        payload,
    );
    return data;
};

export const deleteProcedure = async (equipmentId: string, procedureId: string): Promise<void> => {
    await apiClient.delete(`/api/v1/equipment/${equipmentId}/procedures/${procedureId}`);
};

// Performance History
export const fetchHistory = async (equipmentId: string, procedureId: string): Promise<Perform[]> => {
    const {data} = await apiClient.get<Perform[]>(
        `/api/v1/equipment/${equipmentId}/procedures/${procedureId}/history`,
    );
    return data;
};

export const recordPerformance = async (
    equipmentId: string,
    procedureId: string,
    date: string,
    notes: string,
): Promise<void> => {
    await apiClient.post(`/api/v1/equipment/${equipmentId}/procedures/${procedureId}/history`, {date, notes});
};

// Dashboard
export const getDashboard = async (): Promise<DashboardItem[]> => {
    const {data} = await apiClient.get<DashboardItem[]>('/api/v1/dashboard');
    return data;
};

// Email
export const sendDashboardEmail = async (): Promise<{ success?: boolean; error?: string }> => {
    const {data} = await apiClient.post<{ success?: boolean; error?: string }>('/api/v1/email/dashboard');
    return data;
};

// Users
export const fetchUsers = async (): Promise<User[]> => {
    const {data} = await apiClient.get<{ content: User[] }>('/api/v1/users');
    return data.content;
};

export const getUser = async (id: string): Promise<User> => {
    const {data} = await apiClient.get<User>(`/api/v1/users/${id}`);
    return data;
};

export const createUser = async (payload: UserCreatePayload): Promise<User> => {
    const {data} = await apiClient.post<User>('/api/v1/users', payload);
    return data;
};

export const updateUser = async (id: string, payload: UserUpdatePayload): Promise<User> => {
    const {data} = await apiClient.put<User>(`/api/v1/users/${id}`, payload);
    return data;
};

export const deleteUser = async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/users/${id}`);
};
