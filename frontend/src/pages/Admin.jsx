import { useMemo, useState } from 'react';

import DashboardLayout from '../components/layout/DashboardLayout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';

const dummyWinners = [
  { id: 'winner-1', name: 'User A', matches: 5, reward: '₹10000' },
  { id: 'winner-2', name: 'User B', matches: 4, reward: '₹2000' },
  { id: 'winner-3', name: 'User C', matches: 3, reward: '₹500' }
];

const initialCharities = ['Helping Hands Foundation', 'Green Earth Initiative', 'Education For All'];

function generateDrawNumbers() {
  const pool = Array.from({ length: 45 }, (_, index) => index + 1);
  const values = [];

  while (values.length < 5) {
    const randomIndex = Math.floor(Math.random() * pool.length);
    values.push(pool[randomIndex]);
    pool.splice(randomIndex, 1);
  }

  return values;
}

function Admin() {
  const [drawNumbers, setDrawNumbers] = useState([]);
  const [drawRan, setDrawRan] = useState(false);
  const [charityInput, setCharityInput] = useState('');
  const [charities, setCharities] = useState(initialCharities);

  const hasDrawResult = drawNumbers.length === 5;

  const sortedDrawNumbers = useMemo(() => [...drawNumbers].sort((a, b) => a - b), [drawNumbers]);

  const handleRunDraw = () => {
    const nextDraw = generateDrawNumbers();
    setDrawNumbers(nextDraw);
    setDrawRan(true);
  };

  const handleAddCharity = () => {
    const trimmedName = charityInput.trim();

    if (!trimmedName) {
      return;
    }

    setCharities(previous => [...previous, trimmedName]);
    setCharityInput('');
  };

  const isAddCharityDisabled = charityInput.trim() === '';

  return (
    <DashboardLayout title="Admin Panel">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold text-primary">Admin Panel</h1>
        <p className="mt-1 text-secondary">Manage draws and system data</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-soft hover:shadow-sm">
          <h2 className="text-xl font-semibold text-primary">Run Monthly Draw</h2>

          <div className="mt-4 flex flex-col gap-4">
            <Button
              type="button"
              variant="primary"
              onClick={handleRunDraw}
              disabled={drawRan}
              className="w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              Run Draw
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
            {dummyWinners.map(winner => (
              <li key={winner.id} className="rounded-2xl border border-border bg-background p-4">
                <p className="text-sm font-semibold text-primary">{winner.name}</p>
                <p className="mt-1 text-sm text-secondary">{winner.matches} matches</p>
                <p className="mt-1 text-sm font-medium text-primary">Reward: {winner.reward}</p>
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
            value={charityInput}
            onChange={event => setCharityInput(event.target.value)}
          />

          <Button
            type="button"
            variant="primary"
            onClick={handleAddCharity}
            disabled={isAddCharityDisabled}
            className="w-full md:w-auto disabled:cursor-not-allowed disabled:opacity-60"
          >
            Add Charity
          </Button>
        </div>

        <ul className="mt-4 space-y-2">
          {charities.map((charity, index) => (
            <li key={`${charity}-${index}`} className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-primary">
              {charity}
            </li>
          ))}
        </ul>
      </Card>
    </DashboardLayout>
  );
}

export default Admin;
