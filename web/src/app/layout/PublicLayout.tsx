import { Outlet } from 'react-router-dom';

export function PublicLayout() {
  return (
    <div className="public-layout">
      <main className="public-layout__main">
        <Outlet />
      </main>
    </div>
  );
}