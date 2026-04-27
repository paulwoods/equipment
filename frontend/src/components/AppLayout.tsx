import React, {useState} from 'react';
import {Outlet} from 'react-router-dom';
import {Sidebar} from './Sidebar';
import {Topbar} from './Topbar';

export const AppLayout = (): React.JSX.Element => {
    const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{background: 'var(--background)'}}>
        <div className="hidden lg:block">
            <Sidebar/>
        </div>

        {mobileOpen && (
            <>
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />
                <div className="fixed left-0 top-0 h-full z-50 lg:hidden">
                    <Sidebar onNavigate={() => setMobileOpen(false)}/>
                </div>
            </>
        )}

      <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar onMenuToggle={() => setMobileOpen(!mobileOpen)}/>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
