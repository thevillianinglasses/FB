import React, { useState } from 'react';

// Placeholder for actual navigation function after login
// In a real app, this would come from a routing library or App.js props
const navigateToMainApp = () => {
  console.log("Login successful, navigating to main app...");
  // This will be replaced by actual navigation logic
};

function LoginPage({ onLoginSuccess }) { // Added onLoginSuccess prop
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin123') {
      setError('');
      console.log('Login successful');
      onLoginSuccess(); // Call the callback on successful login
    } else {
      setError('Invalid username or password');
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
            />
          </div>
          {error && <p className="text-coral-red text-xs italic mb-4">{error}</p>}
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-cornflower-blue hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
