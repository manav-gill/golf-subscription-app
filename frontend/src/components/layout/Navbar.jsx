import Button from '../ui/Button';
import useAuth from '../../hooks/useAuth';

function Navbar({ title = 'Dashboard' }) {
  const { logout } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-6">
      <h1 className="text-lg font-semibold text-primary">{title}</h1>

      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-background text-sm font-semibold text-primary">
          U
        </div>
        <Button variant="outline" onClick={logout}>
          Logout
        </Button>
      </div>
    </header>
  );
}

export default Navbar;
