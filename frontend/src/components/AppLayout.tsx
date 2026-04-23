import React from 'react';
import {Outlet} from 'react-router-dom';
import {Sidebar} from './Sidebar';
import {Topbar} from './Topbar';

export const AppLayout = (): React.JSX.Element => {
  return (
    <div className="flex h-screen overflow-hidden" style={{background: 'var(--background)'}}>
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
