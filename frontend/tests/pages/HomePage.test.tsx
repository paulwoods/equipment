import {describe, expect, it} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import HomePage from '../../src/pages/HomePage';

const renderPage = () => render(<MemoryRouter><HomePage/></MemoryRouter>);

describe('HomePage', () => {
    it('renders the main heading', () => {
        renderPage();
        expect(screen.getByRole('heading', {name: /Equipment Management System/i})).toBeInTheDocument();
    });

    it('renders a Dashboard link', () => {
        renderPage();
        expect(screen.getByRole('link', {name: /Go to Dashboard/i})).toHaveAttribute('href', '/dashboard');
    });

    it('renders a Manage Equipment link', () => {
        renderPage();
        expect(screen.getByRole('link', {name: /Manage Equipment/i})).toHaveAttribute('href', '/equipment');
    });
});
