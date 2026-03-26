import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';

function Dashboard() {
  return (
    <DashboardLayout title="Dashboard">
      <Card className="max-w-2xl shadow-soft">
        <h2 className="text-2xl font-semibold text-primary">Dashboard</h2>
        <p className="mt-2 text-secondary">Your monthly progress and charity impact will appear here.</p>

        <div className="mt-5 rounded-xl bg-background p-4">
          <p className="text-sm text-secondary">This is a sample dashboard card. More widgets can be added here.</p>
        </div>
      </Card>
    </DashboardLayout>
  );
}

export default Dashboard;
