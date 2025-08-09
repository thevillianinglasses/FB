import React, { useState } from 'react';
import { authAPI } from './api';

function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await authAPI.login(username, password);
      console.log('Login successful');
      onLoginSuccess();
    } catch (error) {
      console.error('Login error:', error);
      if (error.response?.status === 401) {
        setError('Invalid username or password');
      } else if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cornflower-blue flex flex-col justify-center items-center p-4">
      <div className="bg-white shadow-md rounded-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-charcoal-grey">Unicare Polyclinic</h1>
          <p className="text-coral-red mt-1 italic">care crafted for you</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-charcoal-grey text-sm font-bold mb-2" htmlFor="username">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="shadow appearance-none border border-cornflower-blue rounded w-full py-2 px-3 text-charcoal-grey leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Username"
              disabled={isLoading}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-charcoal-grey text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border border-cornflower-blue rounded w-full py-2 px-3 text-charcoal-grey mb-3 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="******************"
              disabled={isLoading}
              required
            />
          </div>
          {error && <p className="text-coral-red text-xs italic mb-4">{error}</p>}
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-cornflower-blue hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Default credentials: admin / admin_007
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;