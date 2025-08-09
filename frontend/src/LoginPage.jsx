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
      const response = await authAPI.login(username, password);
      console.log('Login successful', response);
      onLoginSuccess(response.user_role, response.user_name);
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
      <div className="bg-white shadow-xl rounded-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-charcoal-grey">Unicare Polyclinic</h1>
          <p className="text-coral-red mt-2 text-lg italic">care crafted for you</p>
          <div className="w-24 h-1 bg-coral-red mx-auto mt-3"></div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-charcoal-grey text-sm font-semibold mb-2" htmlFor="username">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-cornflower-blue transition-colors"
              placeholder="Enter your username"
              disabled={isLoading}
              required
            />
          </div>
          
          <div>
            <label className="block text-charcoal-grey text-sm font-semibold mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-cornflower-blue transition-colors"
              placeholder="Enter your password"
              disabled={isLoading}
              required
            />
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-cornflower-blue hover:bg-opacity-90 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Signing In...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-xs text-gray-500 mb-2">System Access Levels:</p>
            <div className="text-xs text-gray-600 space-y-1">
              <div><strong>Admin:</strong> Full system access</div>
              <div><strong>Reception:</strong> Patient management</div>
              <div><strong>Laboratory:</strong> Lab tests & results</div>
              <div><strong>Pharmacy:</strong> Medication management</div>
              <div><strong>Nursing:</strong> Patient vitals & procedures</div>
              <div><strong>Doctor:</strong> Consultations & prescriptions</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center text-white">
        <p className="text-sm opacity-80">
          © 2025 Unicare Polyclinic. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default LoginPage;