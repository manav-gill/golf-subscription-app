import { useEffect, useMemo, useState } from 'react';

import DashboardLayout from '../components/layout/DashboardLayout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { getCharities } from '../services/charityService';
import { addCharity, getWinners, runDraw } from '../services/adminService';

function Admin() {
  const [drawResult, setDrawResult] = useState(null);
  const [winners, setWinners] = useState([]);
  const [charities, setCharities] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [runningDraw, setRunningDraw] = useState(false);
  const [addingCharity, setAddingCharity] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadAdminData() {
      setLoading(true);
      setError('');

      try {
        const [winnersResponse, charitiesResponse] = await Promise.all([getWinners(), getCharities()]);

        if (!isMounted) {
          return;
        }

        setWinners(winnersResponse?.data?.data || []);
        setCharities(charitiesResponse?.data?.data || []);
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setError(err?.response?.data?.message || 'Failed to load admin data.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadAdminData();

    return () => {
      isMounted = false;
    };
  }, []);

  const sortedDrawNumbers = useMemo(() => {
    const numbers = drawResult?.draw?.numbers;
    return Array.isArray(numbers) ? [...numbers].sort((a, b) => a - b) : [];
  }, [drawResult]);

  const winnerRows = useMemo(
    () =>
      winners.map(winner => ({
        id: winner.id,
        name: `User ${String(winner.user_id || '').slice(0, 8)}`,
        matches: winner.match_count,
        reward: winner.prize_amount || 0
      })),
    [winners]
  );

  const hasDrawResult = sortedDrawNumbers.length === 5;

  const formatCurrency = value =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(Number(value || 0));

  const handleRunDraw = async () => {
    setRunningDraw(true);
    setError('');
    setSuccessMessage('');

    try {
      const drawResponse = await runDraw();
      const payload = drawResponse?.data?.data || null;
      setDrawResult(payload);

      const winnersResponse = await getWinners();
      setWinners(winnersResponse?.data?.data || []);

      setSuccessMessage('Draw executed successfully.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to run draw.');
    } finally {
      setRunningDraw(false);
    }
  };

  const handleAddCharity = async () => {
    const trimmedName = inputValue.trim();

    if (!trimmedName) {
      return;
    }

    setAddingCharity(true);
    setError('');
    setSuccessMessage('');

    try {
      await addCharity(trimmedName);
      setInputValue('');

      const charitiesResponse = await getCharities();
      setCharities(charitiesResponse?.data?.data || []);

      setSuccessMessage('Charity added successfully.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to add charity.');
    } finally {
      setAddingCharity(false);
    }
  };

  const isAddCharityDisabled = inputValue.trim() === '' || addingCharity;

  return (
    <DashboardLayout title="Admin Panel">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold text-primary">Admin Panel</h1>
        <p className="mt-1 text-secondary">Manage draws and system data</p>
      </header>

      {loading ? <p className="mb-4 text-secondary">Loading...</p> : null}
      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
      {successMessage ? <p className="mb-4 text-sm text-green-700">{successMessage}</p> : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-soft hover:shadow-sm">
          <h2 className="text-xl font-semibold text-primary">Run Monthly Draw</h2>

          <div className="mt-4 flex flex-col gap-4">
            <Button
              type="button"
              variant="primary"
              onClick={handleRunDraw}
              disabled={runningDraw}
              className="w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {runningDraw ? 'Running Draw...' : 'Run Draw'}
            </Button>

            {hasDrawResult ? (
              <div className="rounded-2xl border border-border bg-background p-4">
                <p className="text-sm text-secondary">Last Draw Result</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {sortedDrawNumbers.map(number => (
                    <span
                      key={number}
                      className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-surface text-sm font-semibold text-primary"
                    >
                      {number}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </Card>

        <Card className="rounded-2xl shadow-soft hover:shadow-sm">
          <h2 className="text-xl font-semibold text-primary">Winners</h2>

          <ul className="mt-4 space-y-3">
            {winnerRows.length === 0 ? (
              <li className="rounded-2xl border border-border bg-background p-4 text-sm text-secondary">
                No winners available yet.
              </li>
            ) : null}

            {winnerRows.map(winner => (
              <li key={winner.id} className="rounded-2xl border border-border bg-background p-4">
                <p className="text-sm font-semibold text-primary">{winner.name}</p>
                <p className="mt-1 text-sm text-secondary">{winner.matches} matches</p>
                <p className="mt-1 text-sm font-medium text-primary">Reward: {formatCurrency(winner.reward)}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-6 rounded-2xl shadow-soft hover:shadow-sm">
        <h2 className="text-xl font-semibold text-primary">Manage Charities</h2>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-start">
          <Input
            type="text"
            placeholder="Enter charity name"
            value={inputValue}
            onChange={event => setInputValue(event.target.value)}
          />

          <Button
            type="button"
            variant="primary"
            onClick={handleAddCharity}
            disabled={isAddCharityDisabled}
            className="w-full md:w-auto disabled:cursor-not-allowed disabled:opacity-60"
          >
            {addingCharity ? 'Adding...' : 'Add Charity'}
          </Button>
        </div>

        <ul className="mt-4 space-y-2">
          {charities.map(charity => (
            <li key={charity.id} className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-primary">
              {charity.name}
            </li>
          ))}
        </ul>
      </Card>
    </DashboardLayout>
  );
}

export default Admin;
