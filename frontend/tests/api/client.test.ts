import {afterEach, describe, expect, it, vi} from 'vitest';
import type {Equipment} from '../../src/types/equipment';
import type {Procedure} from '../../src/types/procedure';
import {
    addEquipment,
    addProcedure,
    deleteEquipment,
    deleteProcedure,
    fetchEquipment,
    fetchProcedures,
    getEquipment,
    getMe,
    getProcedure,
    login,
    logout,
    recordPerformance,
    sendDashboardEmail,
    updateEquipment,
    updateProcedure,
} from '../../src/api/client';

const {mockGet, mockPost, mockPut, mockDelete} = vi.hoisted(() => ({
    mockGet: vi.fn(),
    mockPost: vi.fn(),
    mockPut: vi.fn(),
    mockDelete: vi.fn(),
}));

vi.mock('../../src/lib/apiClient', () => ({
    apiClient: {
        get: mockGet,
        post: mockPost,
        put: mockPut,
        delete: mockDelete,
    },
}));

afterEach(() => vi.clearAllMocks());

describe('client', () => {
    describe('login', () => {
        it('POSTs to /api/v1/auth/login and returns ok:true on success', async () => {
            mockPost.mockResolvedValue({data: null});
            const result = await login('user@example.com', 'pass');
            expect(mockPost).toHaveBeenCalledWith('/api/v1/auth/login', {email: 'user@example.com', password: 'pass'});
            expect(result).toEqual({ok: true, status: 200});
        });

        it('returns ok:false with status on axios error', async () => {
            const err = Object.assign(new Error('Unauthorized'), {
                isAxiosError: true,
                response: {status: 401},
            });
            mockPost.mockRejectedValue(err);
            const result = await login('bad@example.com', 'wrong');
            expect(result).toEqual({ok: false, status: 401});
        });

        it('returns ok:false with status 500 on non-axios error', async () => {
            mockPost.mockRejectedValue(new Error('Network failure'));
            const result = await login('a@b.com', 'x');
            expect(result).toEqual({ok: false, status: 500});
        });
    });

    describe('logout', () => {
        it('POSTs to /api/v1/auth/logout', async () => {
            mockPost.mockResolvedValue({data: null});
            await logout();
            expect(mockPost).toHaveBeenCalledWith('/api/v1/auth/logout');
        });
    });

    describe('getMe', () => {
        it('returns email from response data', async () => {
            mockGet.mockResolvedValue({data: {email: 'alice@example.com'}});
            const result = await getMe();
            expect(result).toEqual({email: 'alice@example.com'});
            expect(mockGet).toHaveBeenCalledWith('/api/v1/auth/me');
        });

        it('returns null when data is null', async () => {
            mockGet.mockResolvedValue({data: null});
            const result = await getMe();
            expect(result).toBeNull();
        });
    });

    describe('fetchEquipment', () => {
        it('GETs /api/v1/equipment and returns content array', async () => {
            const equipment: Equipment[] = [{id: '1'} as Equipment];
            mockGet.mockResolvedValue({data: {content: equipment}});
            const result = await fetchEquipment();
            expect(mockGet).toHaveBeenCalledWith('/api/v1/equipment');
            expect(result).toEqual(equipment);
        });
    });

    describe('getEquipment', () => {
        it('GETs /api/v1/equipment/:id', async () => {
            const equipment = {id: '1'} as Equipment;
            mockGet.mockResolvedValue({data: equipment});
            const result = await getEquipment('1');
            expect(mockGet).toHaveBeenCalledWith('/api/v1/equipment/1');
            expect(result).toEqual(equipment);
        });
    });

    describe('addEquipment', () => {
        it('POSTs to /api/v1/equipment with payload', async () => {
            const payload = {manufacturer: 'Acme'} as Omit<Equipment, 'id'>;
            const created = {id: '1', ...payload} as Equipment;
            mockPost.mockResolvedValue({data: created});
            const result = await addEquipment(payload);
            expect(mockPost).toHaveBeenCalledWith('/api/v1/equipment', payload);
            expect(result).toEqual(created);
        });
    });

    describe('updateEquipment', () => {
        it('PUTs to /api/v1/equipment/:id with payload', async () => {
            const payload = {manufacturer: 'Acme'} as Omit<Equipment, 'id'>;
            const updated = {id: '1', ...payload} as Equipment;
            mockPut.mockResolvedValue({data: updated});
            const result = await updateEquipment('1', payload);
            expect(mockPut).toHaveBeenCalledWith('/api/v1/equipment/1', payload);
            expect(result).toEqual(updated);
        });
    });

    describe('deleteEquipment', () => {
        it('DELETEs /api/v1/equipment/:id', async () => {
            mockDelete.mockResolvedValue({});
            await deleteEquipment('1');
            expect(mockDelete).toHaveBeenCalledWith('/api/v1/equipment/1');
        });
    });

    describe('fetchProcedures', () => {
        it('GETs /api/v1/equipment/:id/procedures', async () => {
            const procedures: Procedure[] = [];
            mockGet.mockResolvedValue({data: procedures});
            const result = await fetchProcedures('eq1');
            expect(mockGet).toHaveBeenCalledWith('/api/v1/equipment/eq1/procedures');
            expect(result).toEqual(procedures);
        });
    });

    describe('getProcedure', () => {
        it('GETs /api/v1/equipment/:id/procedures/:procedureId', async () => {
            const procedure = {id: 'p1'} as Procedure;
            mockGet.mockResolvedValue({data: procedure});
            const result = await getProcedure('eq1', 'p1');
            expect(mockGet).toHaveBeenCalledWith('/api/v1/equipment/eq1/procedures/p1');
            expect(result).toEqual(procedure);
        });
    });

    describe('addProcedure', () => {
        it('POSTs to /api/v1/equipment/:id/procedures with payload', async () => {
            const payload = {name: 'Oil Change'} as Omit<Procedure, 'id'>;
            const created = {id: 'p1', ...payload} as Procedure;
            mockPost.mockResolvedValue({data: created});
            const result = await addProcedure('eq1', payload);
            expect(mockPost).toHaveBeenCalledWith('/api/v1/equipment/eq1/procedures', payload);
            expect(result).toEqual(created);
        });
    });

    describe('updateProcedure', () => {
        it('PUTs to /api/v1/equipment/:id/procedures/:procedureId with payload', async () => {
            const payload = {name: 'Filter Change'} as Omit<Procedure, 'id'>;
            const updated = {id: 'p1', ...payload} as Procedure;
            mockPut.mockResolvedValue({data: updated});
            const result = await updateProcedure('eq1', 'p1', payload);
            expect(mockPut).toHaveBeenCalledWith('/api/v1/equipment/eq1/procedures/p1', payload);
            expect(result).toEqual(updated);
        });
    });

    describe('deleteProcedure', () => {
        it('DELETEs /api/v1/equipment/:id/procedures/:procedureId', async () => {
            mockDelete.mockResolvedValue({});
            await deleteProcedure('eq1', 'p1');
            expect(mockDelete).toHaveBeenCalledWith('/api/v1/equipment/eq1/procedures/p1');
        });
    });

    describe('recordPerformance', () => {
        it('POSTs to history endpoint with date and notes', async () => {
            mockPost.mockResolvedValue({data: {id: 'h1'}});
            await recordPerformance('eq1', 'p1', '2026-01-01', 'Looks good');
            expect(mockPost).toHaveBeenCalledWith(
                '/api/v1/equipment/eq1/procedures/p1/history',
                {date: '2026-01-01', notes: 'Looks good'},
            );
        });
    });

    describe('sendDashboardEmail', () => {
        it('POSTs to /api/v1/email/dashboard and returns result', async () => {
            mockPost.mockResolvedValue({data: {success: true}});
            const result = await sendDashboardEmail();
            expect(mockPost).toHaveBeenCalledWith('/api/v1/email/dashboard');
            expect(result).toEqual({success: true});
        });
    });
});
