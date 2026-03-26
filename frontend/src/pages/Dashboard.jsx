import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';

function Dashboard() {
  const stats = [
    { title: 'Subscription', value: 'Active' },
    { title: 'Total Winnings', value: '₹12,500' },
    { title: 'Donations', value: '₹3,200' },
    { title: 'Active Scores', value: '5' }
  ];

  const recentScores = [32, 41, 28, 35, 39];

  const charity = {
    name: 'Helping Hands Foundation',
    contribution: '15%'
  };

  return (
    <DashboardLayout title="Dashboard">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold text-primary">Dashboard</h1>
        <p className="mt-1 text-secondary">Overview of your activity</p>
      </header>

      <section className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => (
          <Card key={stat.title} className="rounded-2xl shadow-soft hover:shadow-sm">
            <p className="text-sm text-secondary">{stat.title}</p>
            <p className="mt-3 text-2xl font-semibold text-primary">{stat.value}</p>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="rounded-2xl shadow-soft hover:shadow-sm">
          <h2 className="text-xl font-semibold text-primary">Recent Scores</h2>

          <ul className="mt-4 space-y-3">
            {recentScores.map((score, index) => (
              <li
                key={`${score}-${index}`}
                className="rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium text-primary"
              >
                {score}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="rounded-2xl shadow-soft hover:shadow-sm">
          <h2 className="text-xl font-semibold text-primary">Your Charity</h2>

          <div className="mt-4 space-y-3 rounded-2xl border border-border bg-background p-4">
            <p className="text-sm text-secondary">Charity Name</p>
            <p className="text-lg font-semibold text-primary">{charity.name}</p>

            <p className="pt-2 text-sm text-secondary">Contribution</p>
            <p className="text-lg font-semibold text-primary">{charity.contribution}</p>
          </div>
        </Card>
      </section>
    </DashboardLayout>
  );
}

export default Dashboard;
