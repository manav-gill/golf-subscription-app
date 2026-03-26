import { useEffect, useState } from 'react';

import DashboardLayout from '../components/layout/DashboardLayout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { addScore, getScores } from '../services/scoreService';

function Scores() {
  const [scoreInput, setScoreInput] = useState('');
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchScores = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await getScores();
      setScores(response?.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load scores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Scores page mounted');
    console.log(window.location.pathname);
    fetchScores();
  }, []);

  const handleAddScore = async () => {
    const parsedScore = Number(scoreInput);

    if (!Number.isInteger(parsedScore) || parsedScore < 1 || parsedScore > 45) {
      setError('Score must be an integer between 1 and 45.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await addScore(parsedScore);
      setScoreInput('');
      await fetchScores();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to add score.');
    } finally {
      setSubmitting(false);
    }
  };

  const isAddDisabled = scoreInput.trim() === '' || submitting;

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

          {loading ? (
            <p className="mt-4 text-secondary">Loading...</p>
          ) : scores.length === 0 ? (
            <p className="mt-4 text-secondary">No scores yet</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {scores.map((entry, index) => (
                <li
                  key={`${entry?.id || entry?.score}-${index}`}
                  className="rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium text-primary"
                >
                  {entry?.score}
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
