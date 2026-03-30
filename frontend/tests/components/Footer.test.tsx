import {describe, expect, it} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import Footer from '../../src/components/Footer';

const renderFooter = () =>
    render(
        <MemoryRouter>
            <Footer/>
        </MemoryRouter>
    );

describe('Footer', () => {
    it('renders copyright with current year', () => {
        renderFooter();
        expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeInTheDocument();
        expect(screen.getByText(/Equipment Manager\. All rights reserved\./)).toBeInTheDocument();
    });

    it('renders navigation links', () => {
        renderFooter();
        expect(screen.getByRole('link', {name: 'About'})).toHaveAttribute('href', '/about');
        expect(screen.getByRole('link', {name: 'Contact'})).toHaveAttribute('href', '/contact');
        expect(screen.getByRole('link', {name: 'Equipment'})).toHaveAttribute('href', '/equipment');
        expect(screen.getByRole('link', {name: 'Dashboard'})).toHaveAttribute('href', '/dashboard');
    });
});
