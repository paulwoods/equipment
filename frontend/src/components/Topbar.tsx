import React from 'react';
import {Breadcrumbs} from './Breadcrumbs';
import {ThemeToggle} from './ThemeToggle';

export const Topbar = (): React.JSX.Element => {
  return (
    <div
      className="flex items-center justify-between h-[52px] px-6 border-b flex-shrink-0"
      style={{
        background: 'var(--background)',
        borderColor: 'var(--border)',
      }}
    >
      <Breadcrumbs />
      <ThemeToggle />
    </div>
  );
};
