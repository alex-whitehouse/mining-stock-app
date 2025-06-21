import React, { useState } from 'react';
import { signUp, confirmSignUp, signIn } from '../services/auth';

const AuthModal = ({ isOpen, onClose, onLogin }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await signUp(email, password);
      setIsConfirming(true);
    } catch (err) {
      setError(err.message || 'Sign up failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSignUp = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await confirmSignUp(email, confirmationCode);
      const user = await signIn(email, password);
      onLogin(user);
      onClose();
    } catch (err) {
      setError(err.message || 'Confirmation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const user = await signIn(email, password);
      onLogin(user);
      onClose();
    } catch (err) {
      setError(err.message || 'Sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setConfirmationCode('');
    setError('');
    setIsConfirming(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              {isConfirming ? 'Confirm Account' : activeTab === 'login' ? 'Sign In' : 'Create Account'}
            </h2>
            <button 
              onClick={() => { onClose(); resetForm(); }} 
              className="text-gray-500 hover:text-gray-700"
            >
              &times;
            </button>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          {isConfirming ? (
            <div>
              <p className="mb-4 text-gray-600">
                We sent a confirmation code to {email}. Please enter it below.
              </p>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="code">
                  Confirmation Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Enter your code"
                />
              </div>
              <button
                onClick={handleConfirmSignUp}
                disabled={isLoading || !confirmationCode}
                className="w-full bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700 transition disabled:opacity-50"
              >
                {isLoading ? 'Confirming...' : 'Confirm Account'}
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="your@email.com"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="••••••••"
                />
              </div>
              
              {activeTab === 'signup' && (
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2" htmlFor="confirmPassword">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="••••••••"
                  />
                </div>
              )}
              
              <button
                onClick={activeTab === 'login' ? handleSignIn : handleSignUp}
                disabled={isLoading || !email || !password || (activeTab === 'signup' && !confirmPassword)}
                className="w-full bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700 transition disabled:opacity-50 mb-4"
              >
                {isLoading 
                  ? (activeTab === 'login' ? 'Signing In...' : 'Creating Account...') 
                  : (activeTab === 'login' ? 'Sign In' : 'Create Account')}
              </button>
              
              <div className="text-center">
                <button
                  onClick={() => setActiveTab(activeTab === 'login' ? 'signup' : 'login')}
                  className="text-amber-600 hover:text-amber-800 text-sm"
                >
                  {activeTab === 'login' 
                    ? "Don't have an account? Sign Up" 
                    : "Already have an account? Sign In"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;