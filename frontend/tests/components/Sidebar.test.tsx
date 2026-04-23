import {describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {AuthContext} from '../../src/hooks/useAuth';
import {Sidebar} from '../../src/components/Sidebar';

vi.mock('../../src/api/client', () => ({
  logout: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({resolvedTheme: 'light', setTheme: vi.fn()}),
}));

const renderSidebar = (username = 'alice@example.com', initialPath = '/dashboard') => {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthContext.Provider value={{username, role: 'ADMIN', setAuthenticated: vi.fn()}}>
        <Sidebar />
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe('Sidebar', () => {
  it('renders the app brand name', () => {
    renderSidebar();
    expect(screen.getByTestId('brand-name')).toBeInTheDocument();
  });

  it('renders main nav links', () => {
    renderSidebar();
    expect(screen.getByRole('link', {name: /dashboard/i})).toBeInTheDocument();
    expect(screen.getByRole('link', {name: /equipment/i})).toBeInTheDocument();
    expect(screen.getByRole('link', {name: /procedures/i})).toBeInTheDocument();
  });

  it('renders admin nav links', () => {
    renderSidebar();
    expect(screen.getByRole('link', {name: /users/i})).toBeInTheDocument();
    expect(screen.getByRole('link', {name: /setup/i})).toBeInTheDocument();
  });

  it('renders the logged-in username', () => {
    renderSidebar();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
  });

  it('marks the current route as active', () => {
    renderSidebar('alice@example.com', '/dashboard');
    const dashboardLink = screen.getByRole('link', {name: /dashboard/i});
    expect(dashboardLink.className).toMatch(/border-l-2/);
  });
});
