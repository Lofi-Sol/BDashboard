# Torn City Betting System

This folder contains the betting system for Torn City faction wars.

## Files

- `bettingdashboard.html` - Main dashboard for betting interface
- `bet-tracking.html` - Dedicated bet tracking interface
- `odds-engine.js` - Advanced odds calculation engine
- `logtypes.json` - Log type definitions for Torn City
- `itemdetails.json` - Complete Torn City items database
- `README.md` - This documentation file

## Betting Dashboard

The betting dashboard provides a comprehensive interface for Torn City faction war betting.

### Features

- **Real-time Data**: Fetches current war data from Torn API
- **Interactive Interface**: Modern, responsive design with tabs
- **Odds Calculation**: Advanced odds engine with market sentiment
- **Bet Tracking**: Monitor personal betting activity
- **Auto-refresh**: Automatic data updates

### API Endpoint

Uses the Torn City API endpoint: `https://api.torn.com/torn/?selections=rankedwars`

### Dashboard Tabs

1. **Colosseum**: Live betting interface for faction wars
2. **War Logs**: View and track ranked wars data
3. **Bet Tracking**: Monitor personal betting activity

### Usage

1. Open `bettingdashboard.html` in a web browser
2. Enter your Torn City API key
3. Navigate between tabs to access different features
4. Place bets and track your activity

### Environment Variables

Required environment variables:
- `TORN_API_KEY` - Torn City API key

### Data Flow

1. **Fetch**: Collects war data from Torn API
2. **Process**: Calculates odds using advanced algorithms
3. **Display**: Shows betting interface with real-time updates
4. **Track**: Monitors user betting activity 