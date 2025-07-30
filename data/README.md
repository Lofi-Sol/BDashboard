# Faction Data Sync

This directory contains automatically synced faction data from the Torn City MongoDB database.

## Files

- `factions.json` - Contains all faction data synced from MongoDB
- `README.md` - This documentation file

## Data Structure

The `factions.json` file contains:

```json
{
  "lastUpdated": "2025-01-27T12:00:00.000Z",
  "totalFactions": 1234,
  "factions": [
    {
      "id": 12345,
      "name": "Faction Name",
      "respect": 1000000,
      "rank": "Gold I",
      "members": 50,
      "position": 150,
      "lastUpdated": "2025-01-27T12:00:00.000Z"
    }
  ]
}
```

## Sync Schedule

The faction data is automatically synced every 6 hours via GitHub Actions.

## Manual Sync

To manually sync faction data, run:

```bash
npm install
node scripts/sync-faction-data.js
```

## GitHub Action

The sync is handled by `.github/workflows/faction-data-sync.yml` which:

1. Runs every 6 hours automatically
2. Can be triggered manually via GitHub Actions
3. Connects to MongoDB and fetches all faction data
4. Transforms and saves the data to `factions.json`
5. Commits and pushes the changes to the repository

## Data Source

Data is pulled from the Torn City MongoDB database at:
`mongodb+srv://oowol003:TornData2341@torndata.vxouoj6.mongodb.net/` 