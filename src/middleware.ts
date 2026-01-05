import type {NextRequest} from 'next/server';
import {NextResponse} from 'next/server';

export function middleware(request: NextRequest) {
    const {pathname} = request.nextUrl;

    // Define public routes
    const isPublicRoute = pathname === '/' || pathname === '/login' || pathname.startsWith('/_next') || pathname.includes('/api/') || pathname === '/favicon.ico' || pathname.includes('.');

    if (isPublicRoute) {
        return NextResponse.next();
    }

    const authToken = request.cookies.get('auth_token');

    if (!authToken) {
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
