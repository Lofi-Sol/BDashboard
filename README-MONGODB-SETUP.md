# MongoDB & GitHub Actions Setup for Faction Data Collection

## Overview

This setup uses GitHub Actions to continuously collect faction data from the Torn API and store it in MongoDB to avoid rate limiting issues. The betting system then fetches this data from MongoDB instead of making direct API calls.

## Architecture

```
GitHub Actions (Every 5 minutes)
    ↓
Torn API (factionhof endpoint)
    ↓
MongoDB Atlas Database
    ↓
Express.js Server (/api/factions endpoint)
    ↓
Betting Dashboard (uses faction data for odds calculation)
```

## Components

### 1. GitHub Actions Workflow
- **File**: `.github/workflows/faction-data-collector.yml`
- **Schedule**: Runs twice a week (Tuesday and Sunday at 2:00 AM UTC)
- **Purpose**: Fetches faction data from Torn API and stores in MongoDB
- **Features**:
  - Fetches top 100 factions at a time (API limit)
  - Uses upsert to avoid duplicates
  - Updates existing entries when data changes
  - Includes comprehensive logging
  - Respects API rate limits with delays

### 2. MongoDB Database
- **Connection**: `mongodb+srv://oowol003:TornData2341@torndata.vxouoj6.mongodb.net/`
- **Database**: `torn_data`
- **Collection**: `factions`
- **Schema**:
  ```javascript
  {
    id: Number,           // Faction ID
    name: String,         // Faction name
    members: Number,      // Member count
    position: Number,     // Hall of fame position
    rank: String,         // Faction rank (Diamond I, etc.)
    respect: Number,      // Respect points
    chain: Number,        // Current chain (if available)
    chain_duration: Number, // Chain duration (if available)
    last_updated: Date,   // Last update timestamp
    created_at: Date      // First insertion timestamp
  }
  ```

### 3. Express.js Server
- **File**: `server.js`
- **Endpoint**: `/api/factions`
- **Purpose**: Serves faction data from MongoDB to the betting dashboard
- **Features**:
  - Accepts optional `factionIds` query parameter
  - Returns data in format expected by betting system
  - Includes error handling and logging

### 4. Betting Dashboard Integration
- **File**: `Betting/bettingdashboard.html`
- **Function**: `fetchFactionRespectData()`
- **Purpose**: Fetches faction data from server and uses it for odds calculation
- **Features**:
  - Fetches from `/api/factions` endpoint
  - Processes MongoDB data format
  - Integrates with odds calculation engine

## Setup Instructions

### 1. GitHub Repository Setup

1. **Fork/Clone the Repository**:
   ```bash
   git clone https://github.com/Lofi-Sol/Bet.git
   cd Bet
   ```

2. **Add Torn API Key Secret**:
   - Go to your GitHub repository
   - Navigate to Settings → Secrets and variables → Actions
   - Add new repository secret:
     - **Name**: `TORN_API_KEY`
     - **Value**: Your Torn API key

3. **Enable GitHub Actions**:
   - Go to Actions tab in your repository
   - The workflow will automatically start running every 5 minutes

### 2. MongoDB Setup

The MongoDB connection is already configured in the code. The database will be automatically created when the first data is inserted.

### 3. Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Server**:
   ```bash
   npm start
   ```

3. **Access the Dashboard**:
   - Open `http://localhost:3000/Betting/bettingdashboard.html`
   - The system will automatically fetch faction data from MongoDB

## Data Flow

### 1. Data Collection (GitHub Actions)
```javascript
// Twice a week (Tuesday and Sunday at 2:00 AM UTC)
1. Fetch faction data from Torn API
2. Process each faction (respect, rank, members, position)
3. Upsert into MongoDB (update existing or insert new)
4. Log results and statistics
```

### 2. Data Serving (Express.js Server)
```javascript
// When betting dashboard requests faction data
1. Connect to MongoDB
2. Query factions collection
3. Transform data to betting system format
4. Return JSON response
```

### 3. Data Usage (Betting Dashboard)
```javascript
// When loading betting interface
1. Fetch faction data from /api/factions
2. Process respect, rank, members data
3. Use in odds calculation
4. Display in betting cards
```

## API Endpoints

### GET /api/factions
Fetches faction data from MongoDB.

**Query Parameters**:
- `factionIds` (optional): Comma-separated list of faction IDs to fetch specific factions

**Response**:
```javascript
{
  "success": true,
  "data": {
    "12345": {
      "respect": 15000000,
      "rank": "Diamond I",
      "members": 95,
      "position": 5,
      "chain": 0,
      "chain_duration": null,
      "last_updated": "2024-01-15T10:30:00.000Z",
      "name": "Faction Name"
    }
  },
  "count": 1,
  "message": "Fetched 1 factions from MongoDB"
}
```

## Monitoring

### GitHub Actions Logs
- Go to Actions tab in your repository
- Click on "Faction Data Collector" workflow
- View logs for each run
- Download artifacts for detailed logs

### MongoDB Monitoring
- Check MongoDB Atlas dashboard for:
  - Collection size and growth
  - Query performance
  - Connection statistics

### Server Logs
- Check server console for:
  - API endpoint usage
  - Error messages
  - Connection status

## Troubleshooting

### Common Issues

1. **GitHub Actions Not Running**:
   - Check if workflow is enabled
   - Verify `TORN_API_KEY` secret is set
   - Check Actions tab for error messages

2. **MongoDB Connection Issues**:
   - Verify connection string is correct
   - Check network connectivity
   - Ensure MongoDB Atlas is accessible

3. **No Faction Data in Dashboard**:
   - Check if server is running (`npm start`)
   - Verify `/api/factions` endpoint returns data
   - Check browser console for errors

4. **Rate Limiting**:
   - GitHub Actions runs twice a week (Tuesday and Sunday)
   - 1-second delay between API calls
   - Respects Torn API rate limits

### Debugging

1. **Test GitHub Actions Locally**:
   ```bash
   node collect-faction-data.js
   ```

2. **Test Server Endpoint**:
   ```bash
   curl http://localhost:3000/api/factions
   ```

3. **Check MongoDB Data**:
   ```javascript
   // In MongoDB shell or Atlas
   use torn_data
   db.factions.find().limit(5)
   ```

## Benefits

### Rate Limit Avoidance
- ✅ No direct API calls from betting dashboard
- ✅ Centralized data collection
- ✅ Respects Torn API rate limits

### Performance
- ✅ Fast data access from MongoDB
- ✅ Reduced API calls
- ✅ Cached faction data

### Reliability
- ✅ Automatic data updates twice a week (Tuesday and Sunday)
- ✅ Fallback to cached data if API fails
- ✅ Comprehensive error handling

### Scalability
- ✅ Can handle multiple users
- ✅ Database can store thousands of factions
- ✅ Easy to extend with more data sources

## Future Enhancements

1. **Additional Data Sources**:
   - Faction chain data collection
   - Historical war data
   - User betting statistics

2. **Advanced Features**:
   - Real-time updates via WebSocket
   - Data analytics and insights
   - Automated odds optimization

3. **Monitoring**:
   - Dashboard for data collection status
   - Alerts for API failures
   - Performance metrics

## Security Notes

- ✅ API key stored as GitHub secret
- ✅ MongoDB connection string in code (consider environment variables)
- ✅ No sensitive data exposed in logs
- ✅ Rate limiting prevents abuse

## Support

For issues or questions:
1. Check GitHub Actions logs
2. Review server console output
3. Verify MongoDB connection
4. Test API endpoints manually 