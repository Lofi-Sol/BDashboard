# Quick Setup Reference

## Essential Steps (5 minutes)

### 1. Get API Credentials
- Go to: https://console.developers.google.com/
- Create project → Enable Google Sheets API → Create Service Account → Download JSON
- Save as: `google-sheets-credentials.json` in project root

### 2. Test Setup
```bash
node scripts/test-sync.js
```

### 3. Create Google Sheet
```bash
node scripts/setup-google-sheets-sync.js
```

### 4. Share Sheet
- Open the Google Sheet URL from step 3
- Click "Share" → Add your email + service account email as "Editor"

### 5. Start Auto-Sync
```bash
node scripts/auto-sync-watcher.js
```

## File Locations
```
BDashboard/
├── google-sheets-credentials.json  ← Place here
├── package.json
├── data/user-bets.json
└── scripts/
```

## Common Issues
- **"Credentials not found"** → Check file name and location
- **"Permission denied"** → Share Google Sheet with service account
- **"API not enabled"** → Enable Google Sheets API in console

## Service Account Email
Found in your `google-sheets-credentials.json` file:
```json
{
  "client_email": "betting-dashboard-sync@project-id.iam.gserviceaccount.com"
}
```
Add this email to your Google Sheet with "Editor" permissions. 