import {describe, expect, it} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {ContactPage} from '../../src/pages/ContactPage';

const renderPage = () => render(<MemoryRouter><ContactPage/></MemoryRouter>);

describe('ContactPage', () => {
    it('renders the Contact Us heading', () => {
        renderPage();
        expect(screen.getByRole('heading', {name: /Contact Us/i})).toBeInTheDocument();
    });

    it('renders contact details', () => {
        renderPage();
        expect(screen.getByText(/support@equipmentmanager\.com/i)).toBeInTheDocument();
        expect(screen.getByText(/\+1 \(555\) 123-4567/i)).toBeInTheDocument();
    });

    it('renders the contact form with required fields', () => {
        renderPage();
        expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Message/i)).toBeInTheDocument();
        expect(screen.getByRole('button', {name: /Send Message/i})).toBeInTheDocument();
    });

    it('renders a Return to Home link', () => {
        renderPage();
        expect(screen.getByRole('link', {name: /Return to Home/i})).toHaveAttribute('href', '/');
    });
});
