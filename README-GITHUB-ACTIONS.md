# GitHub Actions Setup for Automated Bet Processing

This document explains how to set up the automated bet processing system using GitHub Actions.

## Overview

The system uses two GitHub Actions workflows:

1. **Bet Log Processor** - Fetches Torn City logs every 10 minutes and filters for bet confirmations
2. **Bet Confirmation Processor** - Processes filtered logs every 5 minutes and confirms pending bets

## Setup Instructions

### 1. Add GitHub Secret

You need to add your Torn City API key as a GitHub secret:

1. Go to your GitHub repository
2. Click on "Settings" tab
3. Click on "Secrets and variables" → "Actions"
4. Click "New repository secret"
5. Name: `TORN_API_KEY`
6. Value: Your Torn City API key (e.g., `C0wctKtdsgjJYpWe`)

### 2. Enable GitHub Actions

The workflows are located in `.github/workflows/`:

- `bet-log-processor.yml` - Fetches and filters Torn City logs
- `bet-confirmation-processor.yml` - Processes bet confirmations

These will automatically run on the schedule:
- Log processor: Every 10 minutes
- Confirmation processor: Every 5 minutes

### 3. Manual Testing

You can manually trigger the workflows:

1. Go to "Actions" tab in your repository
2. Select either workflow
3. Click "Run workflow" → "Run workflow"

### 4. Data Files

The system creates and maintains these files:

- `data/bet-logs.json` - Filtered bet confirmation logs
- `data/bets.json` - All bet data (pending, confirmed, completed)

## How It Works

### Bet Log Processing

1. **Fetches Logs**: Calls Torn City API every 10 minutes
2. **Filters Logs**: Looks for logs with:
   - `title: "Item receive"`
   - `category: "Item sending"`
   - Items with `id: 206` (Xanax)
   - Message format: `BET:warId:factionId:amount:betId`
3. **Stores Data**: Saves filtered logs to `data/bet-logs.json`

### Bet Confirmation Processing

1. **Reads Logs**: Loads unprocessed bet logs from `data/bet-logs.json`
2. **Matches Bets**: Finds pending bets with matching bet IDs
3. **Confirms Bets**: Updates bet status from "pending" to "confirmed"
4. **Updates Statistics**: Maintains running totals and user counts

## Sample Log Format

The system looks for logs like this:

```json
{
  "log": {
    "YUeFY9g65nzh975KQTEP": {
      "log": 4103,
      "title": "Item receive",
      "timestamp": 1754074055,
      "category": "Item sending",
      "data": {
        "sender": 3566110,
        "items": [
          {
            "id": 206,
            "uid": 15370893048,
            "qty": 1
          }
        ],
        "message": "BET:28667:8076:1:VW7VAC60"
      },
      "params": {
        "italic": 1,
        "color": "green"
      }
    }
  }
}
```

## Bet Message Format

Users should send bet messages in this format:
```
BET:warId:factionId:xanaxAmount:betId
```

Example:
```
BET:28667:8076:1:VW7VAC60
```

Where:
- `28667` = War ID
- `8076` = Faction ID
- `1` = Xanax amount
- `VW7VAC60` = Unique bet ID

## Monitoring

### GitHub Actions Logs

Check the Actions tab to see:
- When workflows run
- Success/failure status
- Processing statistics

### Data Files

Monitor these files for system health:
- `data/bet-logs.json` - Should have recent timestamps
- `data/bets.json` - Should show active bets and statistics

### Manual Testing

You can test the system by:

1. **Placing a bet** through the dashboard
2. **Sending Xanax** with the correct bet message
3. **Checking logs** in the Actions tab
4. **Verifying confirmation** in the bet tracking

## Troubleshooting

### Common Issues

1. **API Key Issues**
   - Check if `TORN_API_KEY` secret is set correctly
   - Verify the API key has proper permissions

2. **Rate Limiting**
   - Torn City API has rate limits
   - The 10-minute interval should avoid most issues

3. **Data File Issues**
   - Check if `data/` directory exists
   - Verify JSON files are valid

4. **Workflow Failures**
   - Check Actions tab for error messages
   - Verify Node.js version compatibility

### Debugging

1. **Manual Trigger**: Run workflows manually to test
2. **Check Logs**: Review workflow execution logs
3. **Verify Data**: Check generated JSON files
4. **Test API**: Verify Torn City API access

## Security Notes

- API key is stored as GitHub secret (encrypted)
- Only filtered bet data is stored (no sensitive user info)
- All data is stored in public repository (consider private repo for production)

## Performance

- **Log Processing**: ~30 seconds per run
- **Confirmation Processing**: ~10 seconds per run
- **Data Storage**: Minimal (JSON files)
- **API Calls**: 1 call every 10 minutes to Torn City

## Next Steps

1. Set up the GitHub secret
2. Enable the workflows
3. Test with a manual bet
4. Monitor the system
5. Scale as needed

The system will automatically process bet confirmations and maintain centralized data for cross-device synchronization. 