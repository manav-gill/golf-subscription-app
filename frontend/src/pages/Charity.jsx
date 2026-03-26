import { useEffect, useState } from 'react';

import DashboardLayout from '../components/layout/DashboardLayout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { getCharities, getUserCharity, saveUserCharity } from '../services/charityService';

function Charity() {
  const [charities, setCharities] = useState([]);
  const [selectedCharity, setSelectedCharity] = useState('');
  const [contribution, setContribution] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    console.log('Charity page mounted');
    console.log(window.location.pathname);

    let isMounted = true;

    async function loadCharityData() {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      try {
        const [charitiesResponse, userCharityResponse] = await Promise.all([
          getCharities(),
          getUserCharity()
        ]);

        if (!isMounted) {
          return;
        }

        const charityList = charitiesResponse?.data?.data || [];
        const savedPreference = userCharityResponse?.data?.data || null;

        setCharities(charityList);
        setSelectedCharity(savedPreference?.charityId || '');

        if (savedPreference?.contributionPercentage !== null && savedPreference?.contributionPercentage !== undefined) {
          setContribution(String(savedPreference.contributionPercentage));
        }
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setError(err?.response?.data?.message || 'Failed to load charity data.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCharityData();

    return () => {
      isMounted = false;
    };
  }, []);

  const contributionValue = Number(contribution);

  const isContributionValid = Number.isFinite(contributionValue) && contributionValue >= 10 && contributionValue <= 100;

  const isSaveEnabled = Boolean(selectedCharity) && isContributionValid && !saving;

  const handleSavePreference = async () => {
    if (!selectedCharity) {
      setError('Please select a charity.');
      return;
    }

    if (!isContributionValid) {
      setError('Contribution must be between 10% and 100%.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      await saveUserCharity({
        charityId: selectedCharity,
        percentage: contributionValue
      });

      setSuccessMessage('Preference saved successfully.');

      // Refetch to keep backend as source of truth.
      const refreshedPreference = await getUserCharity();
      const savedData = refreshedPreference?.data?.data || null;

      if (savedData?.charityId) {
        setSelectedCharity(savedData.charityId);
      }

      if (savedData?.contributionPercentage !== null && savedData?.contributionPercentage !== undefined) {
        setContribution(String(savedData.contributionPercentage));
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save charity preference.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Charity">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold text-primary">Charity</h1>
        <p className="mt-1 text-secondary">Choose where your contribution goes</p>
      </header>

      <section className="mb-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {loading ? <p className="text-secondary">Loading...</p> : null}

          {!loading && charities.length === 0 ? <p className="text-secondary">No charities available.</p> : null}

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
                <p className="mt-2 text-sm text-secondary">{charity.description || 'No description available.'}</p>

                <div className="mt-4">
                  <Button
                    type="button"
                    variant={isSelected ? 'primary' : 'outline'}
                    onClick={() => {
                      setSelectedCharity(charity.id);
                      setError('');
                      setSuccessMessage('');
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
                setSuccessMessage('');
              }}
              placeholder="Enter contribution (10-100)"
            />

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {successMessage ? <p className="text-sm text-green-700">{successMessage}</p> : null}

            <Button
              type="button"
              variant="primary"
              onClick={handleSavePreference}
              disabled={!isSaveEnabled}
              className="w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Preference'}
            </Button>
          </div>
        </Card>
      </section>
    </DashboardLayout>
  );
}

export default Charity;
