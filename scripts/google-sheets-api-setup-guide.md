# Google Sheets API Setup Guide

## Step-by-Step Instructions with Screenshots

### Step 1: Go to Google Cloud Console

1. **Open your browser** and go to: https://console.developers.google.com/
2. **Sign in** with your Google account (the same one you use for Google Sheets)

### Step 2: Create a New Project

1. **Click "Select a project"** at the top of the page
2. **Click "New Project"**
3. **Enter a project name** like "Betting Dashboard Sync"
4. **Click "Create"**
5. **Wait for the project to be created** (you'll see a notification)

### Step 3: Enable Google Sheets API

1. **In your new project**, go to the left sidebar
2. **Click "APIs & Services"** → **"Library"**
3. **Search for "Google Sheets API"** in the search box
4. **Click on "Google Sheets API"** in the results
5. **Click "Enable"** button
6. **Wait for it to enable** (you'll see a green checkmark)

### Step 4: Create Service Account Credentials

1. **Go to "APIs & Services"** → **"Credentials"**
2. **Click "Create Credentials"** → **"Service Account"**
3. **Fill in the details:**
   - **Service account name**: `betting-dashboard-sync`
   - **Service account ID**: (leave as auto-generated)
   - **Description**: `Auto-sync for betting dashboard data`
4. **Click "Create and Continue"**
5. **Skip the optional steps** (click "Continue" and "Done")

### Step 5: Download the Credentials File

1. **In the Credentials page**, find your service account (it will have an email like `betting-dashboard-sync@project-id.iam.gserviceaccount.com`)
2. **Click on the service account email**
3. **Go to the "Keys" tab**
4. **Click "Add Key"** → **"Create new key"**
5. **Choose "JSON"** format
6. **Click "Create"**
7. **The JSON file will download automatically** to your Downloads folder

### Step 6: Save the Credentials File

1. **Find the downloaded file** in your Downloads folder
2. **Rename it** to `google-sheets-credentials.json`
3. **Move it** to your project root directory (same folder as `package.json`)
4. **Your file structure should look like this:**
   ```
   BDashboard/
   ├── package.json
   ├── google-sheets-credentials.json  ← Place it here
   ├── data/
   ├── scripts/
   └── ...
   ```

### Step 7: Test the Setup

1. **Open your terminal** in the BDashboard directory
2. **Run the test script:**
   ```bash
   node scripts/test-sync.js
   ```
3. **You should see:**
   ```
   ✅ Google Sheets credentials found!
   ```

### Step 8: Create Your First Google Sheet

1. **Run the sync script:**
   ```bash
   node scripts/setup-google-sheets-sync.js
   ```
2. **The script will:**
   - Create a new Google Sheet
   - Show you the spreadsheet ID
   - Give you a URL to view the sheet
3. **Copy the spreadsheet ID** (you'll need it for sharing)

### Step 9: Share the Google Sheet

1. **Open the Google Sheet URL** provided by the script
2. **Click "Share"** in the top right corner
3. **Add these emails with "Editor" permissions:**
   - **Your Google account email** (the one you're signed in with)
   - **The service account email** (found in the credentials JSON file)
4. **Click "Send"** (you can uncheck "Notify people")

### Step 10: Start Auto-Sync

1. **Run the auto-sync watcher:**
   ```bash
   node scripts/auto-sync-watcher.js
   ```
2. **The watcher will:**
   - Monitor your `user-bets.json` file
   - Automatically sync changes to Google Sheets
   - Show you when syncs happen

## Troubleshooting

### "Google Sheets credentials not found"
- Make sure `google-sheets-credentials.json` is in the project root
- Check that the file name is exactly correct (case-sensitive)

### "Permission denied"
- Make sure you've shared the Google Sheet with the service account email
- Check that both your email and service account email have "Editor" permissions

### "API not enabled"
- Go back to Google Cloud Console
- Make sure you're in the correct project
- Verify Google Sheets API is enabled

### "Rate limit exceeded"
- The script includes a 5-second cooldown between syncs
- If you're still hitting limits, wait a bit longer between changes

## Security Notes

- **Keep your credentials file secure** - don't share it
- **Add to .gitignore** - don't commit it to version control
- **The service account has limited permissions** - only to your specific Google Sheet

## Next Steps

Once everything is working:

1. **Test the auto-sync** by making a change to `user-bets.json`
2. **Check your Google Sheet** to see the updates
3. **Customize the sync interval** if needed (edit `syncInterval` in the watcher script)

## Need Help?

If you get stuck at any step:

1. **Check the error messages** carefully
2. **Verify each step** was completed correctly
3. **Make sure all file names** match exactly
4. **Check that you're in the right project** in Google Cloud Console

The setup process takes about 10-15 minutes, but once it's working, you'll have automatic real-time sync between your JSON data and Google Sheets! 