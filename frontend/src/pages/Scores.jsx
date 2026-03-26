import { useState } from 'react';

import DashboardLayout from '../components/layout/DashboardLayout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';

function Scores() {
  const [scoreInput, setScoreInput] = useState('');
  const [scores, setScores] = useState([]);
  const [error, setError] = useState('');

  const handleAddScore = () => {
    const parsedScore = Number(scoreInput);

    if (!Number.isInteger(parsedScore) || parsedScore < 1 || parsedScore > 45) {
      setError('Score must be an integer between 1 and 45.');
      return;
    }

    setScores(previousScores => {
      const nextScores = [...previousScores, parsedScore];

      if (nextScores.length > 5) {
        nextScores.shift();
      }

      return nextScores;
    });

    setError('');
    setScoreInput('');
  };

  const isAddDisabled = scoreInput.trim() === '';

  return (
    <DashboardLayout title="Scores">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold text-primary">Scores</h1>
        <p className="mt-1 text-secondary">Add and manage your scores</p>
      </header>

      <div className="grid grid-cols-1 gap-6">
        <Card className="rounded-2xl shadow-soft hover:shadow-sm">
          <h2 className="text-xl font-semibold text-primary">Add Score</h2>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
            <Input
              type="number"
              min="1"
              max="45"
              step="1"
              value={scoreInput}
              onChange={event => {
                setScoreInput(event.target.value);
                setError('');
              }}
              placeholder="Enter score (1-45)"
            />

            <Button
              type="button"
              variant="primary"
              onClick={handleAddScore}
              disabled={isAddDisabled}
              className="w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add Score
            </Button>
          </div>

          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        </Card>

        <Card className="rounded-2xl shadow-soft hover:shadow-sm">
          <h2 className="text-xl font-semibold text-primary">Your Scores</h2>

          {scores.length === 0 ? (
            <p className="mt-4 text-secondary">No scores yet</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {scores.map((score, index) => (
                <li
                  key={`${score}-${index}`}
                  className="rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium text-primary"
                >
                  {score}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default Scores;
