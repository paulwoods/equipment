import {describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MemoryRouter, Routes, Route} from 'react-router-dom';
import {AuthContext} from '../../src/hooks/useAuth';
import {AppLayout} from '../../src/components/AppLayout';

vi.mock('../../src/api/client', () => ({
  logout: vi.fn().mockResolvedValue(undefined),
  fetchEquipment: vi.fn().mockResolvedValue([]),
  getProcedure: vi.fn().mockResolvedValue(null),
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({resolvedTheme: 'light', setTheme: vi.fn()}),
}));

describe('AppLayout', () => {
  it('renders sidebar and outlet content', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthContext.Provider value={{username: 'alice@example.com', role: 'ADMIN', setAuthenticated: vi.fn()}}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<div>Dashboard content</div>} />
            </Route>
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('brand-name')).toBeInTheDocument();
    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
  });
});
