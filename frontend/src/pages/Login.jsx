import { useState } from 'react';
import { Link } from 'react-router-dom';

import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import useAuth from '../hooks/useAuth';

function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async event => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-primary sm:flex sm:items-center sm:justify-center">
      <Card className="mx-auto w-full max-w-md p-8 shadow-soft">
        <h1 className="text-3xl font-semibold leading-tight">Welcome Back</h1>
        <p className="mt-2 text-sm text-secondary">Sign in to access your dashboard.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
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
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <p className="mt-4 text-sm text-secondary">
          No account yet?{' '}
          <Link to="/signup" className="font-medium text-primary underline underline-offset-2">
            Create one
          </Link>
        </p>
      </Card>
    </main>
  );
}

export default Login;
