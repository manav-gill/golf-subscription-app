import { NavLink } from 'react-router-dom';

const navigationItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Scores', to: '/dashboard/scores' },
  { label: 'Charity', to: '/dashboard/charity' },
  { label: 'Draw', to: '/dashboard/draw' },
  { label: 'Admin', to: '/dashboard/admin' }
];

function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-60 border-r border-border bg-surface p-5">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Golf Charity</p>
        <h2 className="mt-2 text-xl font-semibold text-primary">Platform</h2>
      </div>

      <nav className="space-y-1">
        {navigationItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                'block rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-300',
                isActive ? 'bg-background text-primary' : 'text-secondary hover:bg-background hover:text-primary'
              ].join(' ')
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
