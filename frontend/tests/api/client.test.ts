import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
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

// Must mock fetch before importing the module under test
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock window.location
const mockLocation = {href: ''};
vi.stubGlobal('location', mockLocation);

const makeResponse = (body: unknown, status = 200, ok = true) =>
    ({
        ok,
        status,
        json: () => Promise.resolve(body),
        text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
    }) as unknown as Response;

describe('client', () => {
    beforeEach(() => {
        mockLocation.href = '';
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    // ─── Auth ──────────────────────────────────────────────────────────────

    describe('login', () => {
        it('POSTs to /api/auth/login with JSON credentials', async () => {
            mockFetch.mockResolvedValue(makeResponse(null));
            await login('user@example.com', 'pass');

            expect(mockFetch).toHaveBeenCalledOnce();
            const [url, opts] = mockFetch.mock.calls[0];
            expect(url).toBe('/api/auth/login');
            expect(opts.method).toBe('POST');
            expect(opts.headers['Content-Type']).toBe('application/json');
            expect(opts.body).toBe(JSON.stringify({email: 'user@example.com', password: 'pass'}));
        });
    });

    describe('logout', () => {
        it('POSTs to /api/auth/logout', async () => {
            mockFetch.mockResolvedValue(makeResponse(null));
            await logout();

            expect(mockFetch).toHaveBeenCalledOnce();
            const [url, opts] = mockFetch.mock.calls[0];
            expect(url).toBe('/api/auth/logout');
            expect(opts.method).toBe('POST');
        });
    });

    describe('getMe', () => {
        it('returns JSON on success', async () => {
            const user = {username: 'alice'};
            mockFetch.mockResolvedValue(makeResponse(user));
            const result = await getMe();
            expect(result).toEqual(user);
        });

        it('throws when response is not ok', async () => {
            mockFetch.mockResolvedValue(makeResponse(null, 401, false));
            await expect(getMe()).rejects.toThrow('Unauthorized');
        });
    });

    // ─── 401 redirect ─────────────────────────────────────────────────────

    describe('401 handling', () => {
        it('does not redirect on 401', async () => {
            mockFetch.mockResolvedValue(makeResponse(null, 401, false));
            await expect(fetchEquipment()).rejects.toThrow();
            expect(mockLocation.href).not.toBe('/login');
        });
    });

    // ─── Equipment ────────────────────────────────────────────────────────

    describe('fetchEquipment', () => {
        it('GETs /api/equipment and returns array', async () => {
            const equipment: Equipment[] = [];
            mockFetch.mockResolvedValue(makeResponse(equipment));
            const result = await fetchEquipment();
            expect(mockFetch).toHaveBeenCalledWith('/api/equipment', {credentials: 'include'});
            expect(result).toEqual(equipment);
        });
    });

    describe('getEquipment', () => {
        it('GETs /api/equipment/:id', async () => {
            const equipment = {id: '1'} as Equipment;
            mockFetch.mockResolvedValue(makeResponse(equipment));
            const result = await getEquipment('1');
            expect(mockFetch).toHaveBeenCalledWith('/api/equipment/1', {credentials: 'include'});
            expect(result).toEqual(equipment);
        });
    });

    describe('addEquipment', () => {
        it('POSTs to /api/equipment with JSON body', async () => {
            const data = {manufacturer: 'Acme'} as Omit<Equipment, 'id'>;
            const created = {id: '1', ...data} as Equipment;
            mockFetch.mockResolvedValue(makeResponse(created));
            const result = await addEquipment(data);

            const [url, opts] = mockFetch.mock.calls[0];
            expect(url).toBe('/api/equipment');
            expect(opts.method).toBe('POST');
            expect(JSON.parse(opts.body)).toEqual(data);
            expect(result).toEqual(created);
        });
    });

    describe('updateEquipment', () => {
        it('PUTs to /api/equipment/:id with JSON body', async () => {
            const data = {manufacturer: 'Acme'} as Omit<Equipment, 'id'>;
            const updated = {id: '1', ...data} as Equipment;
            mockFetch.mockResolvedValue(makeResponse(updated));
            const result = await updateEquipment('1', data);

            const [url, opts] = mockFetch.mock.calls[0];
            expect(url).toBe('/api/equipment/1');
            expect(opts.method).toBe('PUT');
            expect(JSON.parse(opts.body)).toEqual(data);
            expect(result).toEqual(updated);
        });
    });

    describe('deleteEquipment', () => {
        it('DELETEs /api/equipment/:id', async () => {
            mockFetch.mockResolvedValue(makeResponse(null));
            await deleteEquipment('1');

            const [url, opts] = mockFetch.mock.calls[0];
            expect(url).toBe('/api/equipment/1');
            expect(opts.method).toBe('DELETE');
        });
    });

    // ─── Procedures ───────────────────────────────────────────────────────

    describe('fetchProcedures', () => {
        it('GETs /api/equipment/:id/procedures', async () => {
            const procedures: Procedure[] = [];
            mockFetch.mockResolvedValue(makeResponse(procedures));
            const result = await fetchProcedures('eq1');
            expect(mockFetch).toHaveBeenCalledWith('/api/equipment/eq1/procedures', {credentials: 'include'});
            expect(result).toEqual(procedures);
        });
    });

    describe('getProcedure', () => {
        it('GETs /api/equipment/:id/procedures/:procedureId', async () => {
            const procedure = {id: 'p1'} as Procedure;
            mockFetch.mockResolvedValue(makeResponse(procedure));
            const result = await getProcedure('eq1', 'p1');
            expect(mockFetch).toHaveBeenCalledWith('/api/equipment/eq1/procedures/p1', {credentials: 'include'});
            expect(result).toEqual(procedure);
        });
    });

    describe('addProcedure', () => {
        it('POSTs to /api/equipment/:id/procedures with JSON body', async () => {
            const data = {name: 'Oil Change'} as Omit<Procedure, 'id'>;
            const created = {id: 'p1', ...data} as Procedure;
            mockFetch.mockResolvedValue(makeResponse(created));
            const result = await addProcedure('eq1', data);

            const [url, opts] = mockFetch.mock.calls[0];
            expect(url).toBe('/api/equipment/eq1/procedures');
            expect(opts.method).toBe('POST');
            expect(JSON.parse(opts.body)).toEqual(data);
            expect(result).toEqual(created);
        });
    });

    describe('updateProcedure', () => {
        it('PUTs to /api/equipment/:id/procedures/:procedureId with JSON body', async () => {
            const data = {name: 'Filter Change'} as Omit<Procedure, 'id'>;
            const updated = {id: 'p1', ...data} as Procedure;
            mockFetch.mockResolvedValue(makeResponse(updated));
            const result = await updateProcedure('eq1', 'p1', data);

            const [url, opts] = mockFetch.mock.calls[0];
            expect(url).toBe('/api/equipment/eq1/procedures/p1');
            expect(opts.method).toBe('PUT');
            expect(JSON.parse(opts.body)).toEqual(data);
            expect(result).toEqual(updated);
        });
    });

    describe('deleteProcedure', () => {
        it('DELETEs /api/equipment/:id/procedures/:procedureId', async () => {
            mockFetch.mockResolvedValue(makeResponse(null));
            await deleteProcedure('eq1', 'p1');

            const [url, opts] = mockFetch.mock.calls[0];
            expect(url).toBe('/api/equipment/eq1/procedures/p1');
            expect(opts.method).toBe('DELETE');
        });
    });

    // ─── Performance History ──────────────────────────────────────────────

    describe('recordPerformance', () => {
        it('POSTs to history endpoint with date and notes', async () => {
            const response = {id: 'h1'};
            mockFetch.mockResolvedValue(makeResponse(response));
            const result = await recordPerformance('eq1', 'p1', '2026-01-01', 'Looks good');

            const [url, opts] = mockFetch.mock.calls[0];
            expect(url).toBe('/api/equipment/eq1/procedures/p1/history');
            expect(opts.method).toBe('POST');
            expect(JSON.parse(opts.body)).toEqual({date: '2026-01-01', notes: 'Looks good'});
            expect(result).toEqual(response);
        });
    });

    // ─── Email ────────────────────────────────────────────────────────────

    describe('sendDashboardEmail', () => {
        it('POSTs to /api/email/dashboard and returns result', async () => {
            mockFetch.mockResolvedValue(makeResponse({success: true}));
            const result = await sendDashboardEmail();

            const [url, opts] = mockFetch.mock.calls[0];
            expect(url).toBe('/api/email/dashboard');
            expect(opts.method).toBe('POST');
            expect(result).toEqual({success: true});
        });
    });

    // ─── Error handling ───────────────────────────────────────────────────

    describe('error handling', () => {
        it('throws error with response text when request fails', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 500,
                json: () => Promise.resolve(null),
                text: () => Promise.resolve('Internal Server Error'),
            } as unknown as Response);
            await expect(fetchEquipment()).rejects.toThrow('Internal Server Error');
        });

        it('throws generic error when response text is empty', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 503,
                json: () => Promise.resolve(null),
                text: () => Promise.resolve(''),
            } as unknown as Response);
            await expect(fetchEquipment()).rejects.toThrow('Request failed: 503');
        });
    });
});
