import React from 'react';
import {Menu} from 'lucide-react';
import {Breadcrumbs} from './Breadcrumbs';
import {ThemeToggle} from './ThemeToggle';

interface TopbarProps {
  onMenuToggle?: () => void;
}

export const Topbar = ({onMenuToggle}: TopbarProps): React.JSX.Element => {
  return (
    <div
      className="flex items-center justify-between h-[52px] px-6 border-b flex-shrink-0"
      style={{
        background: 'var(--background)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="flex items-center gap-3">
        <button
            type="button"
            onClick={onMenuToggle}
            className="lg:hidden p-1 rounded-md hover:bg-secondary cursor-pointer"
            aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5"/>
        </button>
        <Breadcrumbs/>
      </div>
      <ThemeToggle />
    </div>
  );
};
