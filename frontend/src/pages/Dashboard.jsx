import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import useAuth from '../hooks/useAuth';

function Dashboard() {
  const { logout } = useAuth();

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-primary sm:flex sm:items-center sm:justify-center">
      <Card className="mx-auto w-full max-w-2xl p-8 shadow-soft">
        <h1 className="text-3xl font-semibold leading-tight">Dashboard</h1>
        <p className="mt-2 text-secondary">Welcome to your dashboard.</p>

        <div className="mt-6">
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>
      </Card>
    </main>
  );
}

export default Dashboard;
