import DashboardLayout from '../components/layout/DashboardLayout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

function getResultStatus(matchCount) {
  if (matchCount === 5) {
    return 'Jackpot';
  }

  if (matchCount === 4) {
    return 'Medium Win';
  }

  if (matchCount === 3) {
    return 'Small Win';
  }

  return 'No Win';
}

function getRewardAmount(matchCount) {
  if (matchCount === 5) {
    return '₹10,000';
  }

  if (matchCount === 4) {
    return '₹2,000';
  }

  if (matchCount === 3) {
    return '₹500';
  }

  return '₹0';
}

function Draw() {
  const drawNumbers = [12, 25, 33, 41, 7];
  const userScores = [12, 30, 33, 8, 41];

  const matchedNumbers = drawNumbers.filter(number => userScores.includes(number));
  const matchCount = matchedNumbers.length;
  const resultStatus = getResultStatus(matchCount);
  const rewardAmount = getRewardAmount(matchCount);

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
            {drawNumbers.map(number => {
              const isMatched = matchedNumbers.includes(number);

              return (
                <div
                  key={number}
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl border text-base font-semibold ${
                    isMatched
                      ? 'border-accent bg-accent text-white'
                      : 'border-border bg-background text-primary'
                  }`}
                >
                  {number}
                </div>
              );
            })}
          </div>

          <p className="mt-5 text-center text-sm text-secondary">Your scores: {userScores.join(', ')}</p>
        </Card>

        <Card className="rounded-2xl shadow-soft hover:shadow-sm">
          <h2 className="text-xl font-semibold text-primary">Your Result</h2>

          <div className="mt-4 rounded-2xl border border-border bg-background p-4">
            <p className="text-sm text-secondary">Matches</p>
            <p className="mt-1 text-2xl font-semibold text-primary">{matchCount} Matches</p>

            <p className="mt-4 text-sm text-secondary">Status</p>
            <p className="mt-1 text-lg font-semibold text-primary">{resultStatus}</p>
          </div>

          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => console.log('Draw result preview', { drawNumbers, userScores, matchedNumbers })}
            >
              View Match Details
            </Button>
          </div>
        </Card>
      </div>

      <Card className="mt-6 rounded-2xl shadow-soft hover:shadow-sm">
        <h2 className="text-xl font-semibold text-primary">Your Reward</h2>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-sm text-secondary">Current Reward</p>
            <p className="mt-1 text-2xl font-semibold text-primary">{rewardAmount}</p>
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
