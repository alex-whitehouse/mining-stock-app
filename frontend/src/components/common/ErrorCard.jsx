import React, { useState, useEffect } from 'react';
import { Button, Card, Typography, CircularProgress } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

const ErrorCard = ({ title = "Error", error, onRetry }) => {
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [retryDelay, setRetryDelay] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const errorMessage = error?.serverMessage ||
                      error?.details ||
                      error?.message ||
                      'An unknown error occurred';

  // Handle retry with exponential backoff
  const handleRetry = () => {
    if (isRetrying) return;
    
    setIsRetrying(true);
    setRetryDelay(1000 * Math.pow(2, retryAttempt));
    setRetryAttempt(prev => prev + 1);
  };

  // Countdown timer for retry
  useEffect(() => {
    if (!isRetrying) return;
    
    const timer = setTimeout(() => {
      setIsRetrying(false);
      if (onRetry) onRetry();
    }, retryDelay);
    
    return () => clearTimeout(timer);
  }, [isRetrying, retryDelay, onRetry]);

  return (
    <Card sx={{ p: 3, textAlign: 'center', maxWidth: 400, margin: '0 auto' }}>
      <Typography variant="h6" color="error" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        {errorMessage}
      </Typography>
      
      {error?.detailCode === 'AlphaVantageUnavailable' && (
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Alpha Vantage service is currently unavailable. Please try again later.
        </Typography>
      )}

      {onRetry && (
        <Button
          variant="contained"
          color="primary"
          startIcon={isRetrying ? <CircularProgress size={20} /> : <RefreshIcon />}
          onClick={handleRetry}
          disabled={isRetrying}
        >
          {isRetrying ? `Retrying in ${Math.ceil(retryDelay/1000)}s` : 'Retry Now'}
        </Button>
      )}
    </Card>
  );
};

export default ErrorCard;