import React from 'react';
import {Link, useLocation} from 'react-router-dom';
import {Calendar, CircleQuestionMark, LayoutDashboard, LogOut, Monitor, PhoneCall, Users} from 'lucide-react';
import {useAuth} from '../hooks';
import {logout} from '../api/client';
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from './ui/dropdown-menu';
import {Separator} from './ui/separator';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const mainNav: NavItem[] = [
  {label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard},
  {label: 'Calendar', href: '/calendar', icon: Calendar},
  {label: 'Equipment', href: '/equipment', icon: Monitor},
];

const adminNav: NavItem[] = [
  {label: 'Users', href: '/users', icon: Users},
];

const linksNav: NavItem[] = [
  {label: 'About', href: '/about', icon: CircleQuestionMark},
  {label: 'Contact', href: '/contact', icon: PhoneCall},
];

const NavLink = ({item}: {item: NavItem}): React.JSX.Element => {
  const {pathname} = useLocation();
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const Icon = item.icon;

  return (
    <Link
      to={item.href}
      className={[
        'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors border-l-2',
        isActive
          ? 'bg-[var(--sidebar-active)] border-[var(--sidebar-active-border)] text-[var(--accent-foreground)]'
          : 'border-transparent text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]',
      ].join(' ')}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {item.label}
    </Link>
  );
};

export const Sidebar = (): React.JSX.Element => {
  const {username, setAuthenticated} = useAuth();

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
    } finally {
      setAuthenticated(false);
      window.location.href = '/';
    }
  };

  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : '??';

  return (
    <aside
      className="flex flex-col w-56 flex-shrink-0 border-r"
      style={{
        background: 'var(--sidebar-background)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b" style={{borderColor: 'var(--border)'}}>
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
          style={{background: 'var(--primary)'}}
        >
          <Monitor className="w-4 h-4 text-white" />
        </div>
        <div>
          <div data-testid="brand-name" className="text-sm font-bold" style={{color: 'var(--foreground)'}}>Equipment</div>
          <div className="text-xs" style={{color: 'var(--muted-foreground)'}}>Manager</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1 px-2 py-4">
        <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-widest" style={{color: 'var(--muted-foreground)'}}>
          Main
        </p>
        {mainNav.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        <Separator className="my-3" />

        <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-widest" style={{color: 'var(--muted-foreground)'}}>
          Admin
        </p>
        {adminNav.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        <Separator className="my-3"/>

        <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-widest"
           style={{color: 'var(--muted-foreground)'}}>
          Links
        </p>
        {linksNav.map((item) => (
            <NavLink key={item.href} item={item}/>
        ))}

      </nav>

      {/* User footer */}
      <div className="border-t px-2 py-3" style={{borderColor: 'var(--border)'}}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full px-2 py-2 rounded-md text-left transition-colors hover:bg-[var(--secondary)] cursor-pointer">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                style={{
                  background: 'color-mix(in srgb, var(--primary) 20%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--primary) 40%, transparent)',
                  color: 'var(--primary)',
                }}
              >
                {initials}
              </div>
              <span className="text-xs font-medium truncate flex-1" style={{color: 'var(--foreground)'}}>
                {username ?? 'Guest'}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-48">
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-[var(--destructive)]">
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
};
