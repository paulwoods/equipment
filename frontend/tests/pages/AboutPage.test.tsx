import {describe, expect, it} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {AboutPage} from '../../src/pages/AboutPage';

const renderPage = () => render(<MemoryRouter><AboutPage/></MemoryRouter>);

describe('AboutPage', () => {
    it('renders the heading', () => {
        renderPage();
        expect(screen.getByRole('heading', {name: /About Equipment Manager/i})).toBeInTheDocument();
    });

    it('renders Key Features section', () => {
        renderPage();
        expect(screen.getByText(/Key Features/i)).toBeInTheDocument();
    });

    it('renders technology stack tags', () => {
        renderPage();
        expect(screen.getByText('Spring Boot')).toBeInTheDocument();
        expect(screen.getByText('React')).toBeInTheDocument();
        expect(screen.getByText('TypeScript')).toBeInTheDocument();
    });

    it('renders a Get Started link to /equipment', () => {
        renderPage();
        expect(screen.getByRole('link', {name: /Get Started/i})).toHaveAttribute('href', '/equipment');
    });
});
