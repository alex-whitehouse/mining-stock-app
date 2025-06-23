import React from 'react';
import { Button, Card, CardContent, CardHeader, Grid, Typography } from '@mui/material';
import { Star, Refresh } from '@mui/icons-material';
import ValueMetrics from './ValueMetrics';
import FinancialCharts from './FinancialCharts';
import ErrorCard from './common/ErrorCard';

const Dashboard = ({
  stock,
  watchlist = [],
  onAddToWatchlist,
  onRemoveFromWatchlist,
  metricsError,
  financialsError,
  overviewError,
  onRetryMetrics,
  onRetryFinancials,
  onRetryOverview
}) => {
  // Safe access to properties
  const financials = stock?.financials || {};
  
  // Check if stock is in watchlist
  const isInWatchlist = watchlist.some(item => item.symbol === stock.info.symbol);
  
  return (
    <div style={{ marginTop: '32px' }}>
      {/* Global error banner */}
      {(financialsError || overviewError) && (
        <ErrorCard
          title="Data Load Failure"
          error={{
            message: `${overviewError ? 'Company overview failed. ' : ''}${financialsError ? 'Financial data failed.' : ''}`,
            detailCode: 'MultipleErrors',
            serverMessage: 'One or more data requests failed'
          }}
          onRetry={onRetryOverview}
        />
      )}
      
      <Card>
        <CardHeader
          title={
            <div>
              <Typography variant="h5">
                {stock.info.symbol} - {stock.info.name}
              </Typography>
              <Typography variant="subtitle2">
                {stock.info.exchange} | {stock.info.currency}
              </Typography>
            </div>
          }
          action={
            <Button
              onClick={() => {
                if (isInWatchlist) {
                  onRemoveFromWatchlist(stock.info.symbol);
                } else {
                  onAddToWatchlist(stock.info.symbol, stock.info.name);
                }
              }}
              variant={isInWatchlist ? "contained" : "outlined"}
              color={isInWatchlist ? "warning" : "primary"}
              startIcon={<Star />}
            >
              {isInWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
            </Button>
          }
        />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              {financialsError ? (
                <ErrorCard
                  title="Financial Data Failed"
                  error={{
                    message: financialsError.message,
                    detailCode: financialsError.detailCode || 'FinancialsError',
                    serverMessage: financialsError.serverMessage
                  }}
                  onRetry={onRetryFinancials}
                />
              ) : (
                <FinancialCharts financials={financials} />
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      <Card style={{ marginTop: '24px', padding: '24px' }}>
        <Typography variant="h6" gutterBottom>
          Company Overview
        </Typography>
        
        {overviewError ? (
          <ErrorCard
            title="Company Overview Failed"
            error={{
              message: overviewError.message,
              detailCode: overviewError.detailCode || 'OverviewError',
              serverMessage: overviewError.serverMessage
            }}
            onRetry={onRetryOverview}
          />
        ) : stock.overview ? (
          <>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography variant="subtitle1">Description</Typography>
                <Typography variant="body2">
                  {stock.overview.description || 'No description available'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1">Sector</Typography>
                    <Typography>{stock.overview.sector || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1">Industry</Typography>
                    <Typography>{stock.overview.industry || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1">Market Cap</Typography>
                    <Typography>{stock.overview.market_cap || 'N/A'}</Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            
            <Grid container spacing={2} style={{ marginTop: '16px' }}>
              <Grid item xs={6} md={3}>
                <Card variant="outlined" style={{ backgroundColor: '#FFFBEB', borderColor: '#FBBF24' }}>
                  <CardContent>
                    <Typography variant="subtitle2">PE Ratio</Typography>
                    <Typography variant="h6">{stock.overview.pe_ratio || 'N/A'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={3}>
                <Card variant="outlined" style={{ backgroundColor: '#EFF6FF', borderColor: '#60A5FA' }}>
                  <CardContent>
                    <Typography variant="subtitle2">Dividend Yield</Typography>
                    <Typography variant="h6">{stock.overview.dividend_yield || 'N/A'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={3}>
                <Card variant="outlined" style={{ backgroundColor: '#ECFDF5', borderColor: '#34D399' }}>
                  <CardContent>
                    <Typography variant="subtitle2">52-Week High</Typography>
                    <Typography variant="h6">{stock.overview['52_week_high'] || 'N/A'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={3}>
                <Card variant="outlined" style={{ backgroundColor: '#F5F3FF', borderColor: '#A78BFA' }}>
                  <CardContent>
                    <Typography variant="subtitle2">52-Week Low</Typography>
                    <Typography variant="h6">{stock.overview['52_week_low'] || 'N/A'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <Refresh style={{ animation: 'spin 2s linear infinite', fontSize: '48px' }} />
            <Typography variant="body1" style={{ marginTop: '16px' }}>Loading company overview...</Typography>
          </div>
        )}
      </Card>
    </div>
  );
};


export default Dashboard;
