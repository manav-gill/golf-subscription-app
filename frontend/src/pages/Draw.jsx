import { useEffect, useMemo, useState } from 'react';

import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
import { getLatestDraw, getUserResult } from '../services/drawService';

function Draw() {
  const [drawNumbers, setDrawNumbers] = useState([]);
  const [result, setResult] = useState({ matches: 0, reward: 0, status: 'No Win' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function fetchDrawData() {
      setLoading(true);
      setError('');

      try {
        const [drawResponse, resultResponse] = await Promise.all([getLatestDraw(), getUserResult()]);

        if (!isMounted) {
          return;
        }

        const latestDraw = drawResponse?.data?.data || null;
        const nextNumbers = Array.isArray(latestDraw?.numbers) ? latestDraw.numbers : [];
        const nextResult = resultResponse?.data?.data || { matches: 0, reward: 0, status: 'No Win' };

        setDrawNumbers(nextNumbers);
        setResult(nextResult);
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setError(err?.response?.data?.message || 'Failed to load draw result.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchDrawData();

    return () => {
      isMounted = false;
    };
  }, []);

  const formattedReward = useMemo(() => {
    const rewardValue = Number(result?.reward || 0);

    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(rewardValue);
  }, [result?.reward]);

  if (loading) {
    return (
      <DashboardLayout title="Draw Results">
        <Card className="rounded-2xl shadow-soft">
          <p className="text-secondary">Loading...</p>
        </Card>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Draw Results">
        <Card className="rounded-2xl shadow-soft">
          <p className="text-red-600">{error}</p>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Draw Results">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold text-primary">Draw Results</h1>
        <p className="mt-1 text-secondary">Check your matches and winnings</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl shadow-soft hover:shadow-sm lg:col-span-2">
          <h2 className="text-xl font-semibold text-primary">Latest Draw</h2>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
            {drawNumbers.map(number => (
              <div
                key={number}
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background text-base font-semibold text-primary"
              >
                {number}
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-2xl shadow-soft hover:shadow-sm">
          <h2 className="text-xl font-semibold text-primary">Your Result</h2>

          <div className="mt-4 rounded-2xl border border-border bg-background p-4">
            <p className="text-sm text-secondary">Matches</p>
            <p className="mt-1 text-2xl font-semibold text-primary">{result.matches} Matches</p>

            <p className="mt-4 text-sm text-secondary">Status</p>
            <p className="mt-1 text-lg font-semibold text-primary">{result.status}</p>
          </div>
        </Card>
      </div>

      <Card className="mt-6 rounded-2xl shadow-soft hover:shadow-sm">
        <h2 className="text-xl font-semibold text-primary">Your Reward</h2>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-sm text-secondary">Current Reward</p>
            <p className="mt-1 text-2xl font-semibold text-primary">{formattedReward}</p>
          </div>

          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-sm text-secondary">Reward Tiers</p>
            <p className="mt-1 text-sm font-medium text-primary">3 Matches: ₹500</p>
            <p className="mt-1 text-sm font-medium text-primary">4 Matches: ₹2,000</p>
            <p className="mt-1 text-sm font-medium text-primary">5 Matches: ₹10,000</p>
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
}

export default Draw;
