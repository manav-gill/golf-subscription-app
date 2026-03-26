import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
import { getProfile } from '../services/authService';

function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
      setLoading(true);
      setError('');

      console.log('Fetching profile...');

      try {
        const res = await getProfile();

        console.log('Profile response:', res.data);

        if (!isMounted) {
          return;
        }

        setProfile(res?.data?.data || null);
      } catch (error) {
        console.log('Error:', error?.response || error?.message);

        if (!isMounted) {
          return;
        }

        if (error?.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login', { replace: true });
          return;
        }

        setError(error?.response?.data?.message || 'Failed to fetch user data.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const stats = useMemo(() => {
    const subscriptionValue = profile?.is_subscribed ? 'Active' : 'Inactive';

    // TODO: Replace with backend-provided financial summary fields once available.
    return [
      { title: 'Subscription', value: subscriptionValue },
      { title: 'Total Winnings', value: 'Pending API' },
      { title: 'Donations', value: 'Pending API' },
      { title: 'Active Scores', value: 'Pending API' }
    ];
  }, [profile]);

  const recentScores = [32, 41, 28, 35, 39];

  const charity = {
    name: 'Helping Hands Foundation',
    contribution: '15%'
  };

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <Card className="rounded-2xl shadow-soft">
          <p className="text-secondary">Loading...</p>
        </Card>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Dashboard">
        <Card className="rounded-2xl shadow-soft">
          <p className="text-red-600">{error}</p>
        </Card>
      </DashboardLayout>
    );
  }

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
