import {describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {AuthContext, useAuth} from '../../src/hooks/useAuth';

function TestConsumer() {
    const {username, setAuthenticated} = useAuth();
    return (
        <div>
            <span data-testid="username">{username ?? 'null'}</span>
            <button onClick={() => setAuthenticated(true)}>set</button>
        </div>
    );
}

describe('useAuth', () => {
    it('returns default context values when no provider is present', () => {
        render(<TestConsumer/>);
        expect(screen.getByTestId('username').textContent).toBe('null');
    });

    it('returns username from AuthContext provider', () => {
        render(
            <AuthContext.Provider value={{username: 'alice', setAuthenticated: vi.fn()}}>
                <TestConsumer/>
            </AuthContext.Provider>
        );
        expect(screen.getByTestId('username').textContent).toBe('alice');
    });

    it('calls setAuthenticated from context when invoked', async () => {
        const setAuthenticated = vi.fn();
        const {getByRole} = render(
            <AuthContext.Provider value={{username: 'alice', setAuthenticated}}>
                <TestConsumer/>
            </AuthContext.Provider>
        );
        getByRole('button', {name: 'set'}).click();
        expect(setAuthenticated).toHaveBeenCalledWith(true);
    });
});
