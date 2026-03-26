import { useState } from 'react';
import { Link } from 'react-router-dom';

import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import useAuth from '../hooks/useAuth';

function Signup() {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async event => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signup(name, email, password);
    } catch (err) {
      setError(err?.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-primary sm:flex sm:items-center sm:justify-center">
      <Card className="mx-auto w-full max-w-md p-8 shadow-soft">
        <h1 className="text-3xl font-semibold leading-tight">Create Account</h1>
        <p className="mt-2 text-sm text-secondary">Start your journey with rewards and charity impact.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <Input type="text" placeholder="Name" value={name} onChange={event => setName(event.target.value)} required />
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            required
          />

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Signup'}
          </Button>
        </form>

        <p className="mt-4 text-sm text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary underline underline-offset-2">
            Login
          </Link>
        </p>
      </Card>
    </main>
  );
}

export default Signup;
