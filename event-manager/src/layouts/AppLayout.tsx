// Simple App Layout - Rewritten per user request
import { Outlet } from 'react-router-dom';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      {/* Simple header */}
      <header className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Event Manager</h1>
          <nav className="flex gap-4">
            {/* Navigation will go here */}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
