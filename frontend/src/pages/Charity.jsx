import { useMemo, useState } from 'react';

import DashboardLayout from '../components/layout/DashboardLayout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';

const charities = [
  {
    id: 'helping-hands-foundation',
    name: 'Helping Hands Foundation',
    description: 'Supports families with food security and essential care.'
  },
  {
    id: 'green-earth-initiative',
    name: 'Green Earth Initiative',
    description: 'Drives tree plantation and climate-focused local projects.'
  },
  {
    id: 'education-for-all',
    name: 'Education For All',
    description: 'Provides learning resources and scholarships for students.'
  },
  {
    id: 'health-support-trust',
    name: 'Health Support Trust',
    description: 'Funds medical camps and preventive healthcare awareness.'
  }
];

function Charity() {
  const [selectedCharity, setSelectedCharity] = useState('');
  const [contribution, setContribution] = useState('');
  const [error, setError] = useState('');

  const contributionValue = Number(contribution);

  const isContributionValid = Number.isFinite(contributionValue) && contributionValue >= 10 && contributionValue <= 100;

  const isSaveEnabled = Boolean(selectedCharity) && isContributionValid;

  const selectedCharityDetails = useMemo(
    () => charities.find(charity => charity.id === selectedCharity) || null,
    [selectedCharity]
  );

  const handleSavePreference = () => {
    if (!selectedCharity) {
      setError('Please select a charity.');
      return;
    }

    if (!isContributionValid) {
      setError('Contribution must be between 10% and 100%.');
      return;
    }

    setError('');

    const payload = {
      charityId: selectedCharity,
      charityName: selectedCharityDetails?.name,
      contributionPercentage: contributionValue
    };

    console.log('Saved charity preference:', payload);
    alert('Preference saved successfully.');
  };

  return (
    <DashboardLayout title="Charity">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold text-primary">Charity</h1>
        <p className="mt-1 text-secondary">Choose where your contribution goes</p>
      </header>

      <section className="mb-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {charities.map(charity => {
            const isSelected = selectedCharity === charity.id;

            return (
              <Card
                key={charity.id}
                className={`rounded-2xl shadow-soft hover:shadow-sm ${
                  isSelected ? 'border-accent bg-background' : ''
                }`}
              >
                <h2 className="text-lg font-semibold text-primary">{charity.name}</h2>
                <p className="mt-2 text-sm text-secondary">{charity.description}</p>

                <div className="mt-4">
                  <Button
                    type="button"
                    variant={isSelected ? 'primary' : 'outline'}
                    onClick={() => {
                      setSelectedCharity(charity.id);
                      setError('');
                    }}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <Card className="rounded-2xl shadow-soft hover:shadow-sm">
          <h2 className="text-xl font-semibold text-primary">Contribution Selection</h2>

          <div className="mt-4 grid grid-cols-1 gap-4 md:max-w-sm">
            <label className="text-sm font-medium text-secondary" htmlFor="contributionPercentage">
              Contribution %
            </label>

            <Input
              id="contributionPercentage"
              type="number"
              min="10"
              max="100"
              step="1"
              value={contribution}
              onChange={event => {
                setContribution(event.target.value);
                setError('');
              }}
              placeholder="Enter contribution (10-100)"
            />

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <Button
              type="button"
              variant="primary"
              onClick={handleSavePreference}
              disabled={!isSaveEnabled}
              className="w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save Preference
            </Button>
          </div>
        </Card>
      </section>
    </DashboardLayout>
  );
}

export default Charity;
