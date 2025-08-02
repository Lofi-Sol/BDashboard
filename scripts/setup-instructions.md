# Google Sheets Auto-Sync Setup Instructions

This guide will help you set up automatic synchronization between your `user-bets.json` file and Google Sheets.

## Step 1: Install Required Dependencies

First, install the Google APIs client library:

```bash
npm install googleapis
```

## Step 2: Set Up Google Sheets API

1. **Go to Google Cloud Console**
   - Visit: https://console.developers.google.com/
   - Sign in with your Google account

2. **Create a New Project**
   - Click "Select a project" → "New Project"
   - Name it something like "Betting Dashboard"
   - Click "Create"

3. **Enable Google Sheets API**
   - In your project, go to "APIs & Services" → "Library"
   - Search for "Google Sheets API"
   - Click on it and press "Enable"

4. **Create Service Account Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "Service Account"
   - Fill in:
     - Service account name: "betting-dashboard-sync"
     - Service account ID: (auto-generated)
     - Description: "Auto-sync for betting dashboard data"
   - Click "Create and Continue"
   - Skip the optional steps and click "Done"

5. **Download Credentials**
   - In the Credentials page, find your service account
   - Click on the service account email
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Choose "JSON" format
   - Click "Create"
   - The JSON file will download automatically

6. **Save Credentials File**
   - Rename the downloaded file to `google-sheets-credentials.json`
   - Place it in your project root directory (same level as `package.json`)

## Step 3: Share Your Google Sheet

After running the sync script for the first time, you'll need to share the created Google Sheet:

1. **Get the Spreadsheet ID**
   - The script will output a spreadsheet ID like: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`
   - Or check the `spreadsheet-id.txt` file created by the script

2. **Share the Sheet**
   - Go to: https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]
   - Click "Share" in the top right
   - Add your Google account email with "Editor" permissions
   - Also add the service account email (found in the credentials JSON) with "Editor" permissions

## Step 4: Run the Setup

1. **Test the Setup**
   ```bash
   node scripts/setup-google-sheets-sync.js
   ```

2. **Start Auto-Sync Watcher**
   ```bash
   node scripts/auto-sync-watcher.js
   ```

## Step 5: Verify It's Working

1. **Check the Google Sheet**
   - Open the Google Sheet URL provided by the script
   - You should see 5 tabs: User Profiles, Active Bets, Faction Statistics, User Preferences, Summary Statistics

2. **Test Auto-Sync**
   - Make a change to your `data/user-bets.json` file
   - The watcher should automatically sync the changes to Google Sheets
   - Check the Google Sheet to see the updates

## Troubleshooting

### Common Issues:

1. **"Google Sheets credentials not found"**
   - Make sure `google-sheets-credentials.json` is in the project root
   - Check that the file contains valid JSON

2. **"Permission denied"**
   - Make sure you've shared the Google Sheet with the service account email
   - Check that the service account has "Editor" permissions

3. **"API not enabled"**
   - Go back to Google Cloud Console and ensure Google Sheets API is enabled
   - Check that you're using the correct project

4. **"Rate limit exceeded"**
   - The script includes a 5-second cooldown between syncs
   - If you're still hitting limits, increase the `syncInterval` in `auto-sync-watcher.js`

### Manual Sync

If the auto-sync isn't working, you can manually sync anytime:

```bash
node scripts/setup-google-sheets-sync.js
```

## Security Notes

- Keep your `google-sheets-credentials.json` file secure
- Don't commit it to version control
- Add it to your `.gitignore` file
- The service account has limited permissions only to the specific Google Sheet

## Advanced Configuration

### Custom Sync Interval

Edit `scripts/auto-sync-watcher.js` and change the `syncInterval` value:

```javascript
this.syncInterval = 10000; // 10 seconds instead of 5
```

### Custom Sheet Name

Edit `scripts/setup-google-sheets-sync.js` and change the title:

```javascript
await this.createSpreadsheet('My Custom Betting Dashboard');
```

### Multiple Sheets

You can create multiple sync instances for different data files by modifying the scripts accordingly. 