# 🌍 Global Betting System Setup

This guide will help you set up the global betting system that works 24/7 with GitHub as the central database.

## 🚀 **Quick Setup**

### **Step 1: Set GitHub Token**

Create a GitHub Personal Access Token with repository permissions:

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with these permissions:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
3. Copy the token and set it as an environment variable:

```bash
export GITHUB_TOKEN=your_token_here
```

### **Step 2: Test the System**

Run the test script to verify everything works:

```bash
node scripts/test-global-system.js
```

### **Step 3: Commit and Push**

Commit all the new files to GitHub:

```bash
git add .
git commit -m "🌍 Add global betting system with GitHub API integration"
git push origin master
```

## 📋 **System Architecture**

### **🌐 Global Data Flow**

```
User Places Bet → GitHub API → user-bets.json on GitHub
     ↓
User Sends Xanax → Torn API → GitHub Actions → filtered-logs.json
     ↓
GitHub Actions (every 5 min) → Confirm Bets → Update user-bets.json
```

### **📁 File Structure**

```
scripts/
├── github-bets-api.js          # GitHub API integration
├── global-confirm-bets.js      # Global bet confirmation
└── test-global-system.js       # System testing

.github/workflows/
└── bet-confirmation-processor.yml  # Automated confirmation

server.js                       # Updated to use GitHub API
```

## 🔧 **Configuration**

### **GitHub Repository Settings**

Make sure your repository has:
- ✅ GitHub Actions enabled
- ✅ Proper permissions for the `GITHUB_TOKEN`
- ✅ Repository is public or token has private repo access

### **Environment Variables**

Required environment variables:
- `GITHUB_TOKEN`: Your GitHub Personal Access Token

## 🎯 **How It Works**

### **1. Bet Placement**
- User places bet through dashboard
- Frontend sends bet data to `/api/betting/place-bet`
- Server uses GitHub API to save bet to `user-bets.json` on GitHub
- Bet status: `pending`

### **2. Log Collection**
- GitHub Actions run every 10 minutes
- Fetches Torn API logs
- Filters for Xanax transfers with "BET:" messages
- Saves to `filtered-logs.json` on GitHub

### **3. Bet Confirmation**
- GitHub Actions run every 5 minutes
- Compares pending bets with filtered logs
- Updates bet status to `confirmed` when match found
- Updates `user-bets.json` on GitHub

## 🧪 **Testing**

### **Test Local System**
```bash
# Test GitHub API integration
node scripts/test-global-system.js

# Test bet confirmation
node scripts/global-confirm-bets.js

# Test local fallback
node scripts/confirm-bets.js
```

### **Test GitHub Actions**
1. Go to your GitHub repository
2. Click "Actions" tab
3. Look for "Bet Confirmation Processor"
4. Click "Run workflow" to test manually

## 🔄 **Automation Schedule**

- **Log Collection**: Every 10 minutes
- **Bet Confirmation**: Every 5 minutes
- **Data Persistence**: Real-time to GitHub

## 🛠️ **Troubleshooting**

### **Common Issues**

1. **GitHub Token Not Set**
   ```
   ❌ GITHUB_TOKEN environment variable is not set
   ```
   **Solution**: Set the token: `export GITHUB_TOKEN=your_token_here`

2. **Permission Denied**
   ```
   ❌ Error updating user-bets.json on GitHub: Not Found
   ```
   **Solution**: Check token permissions and repository access

3. **Workflow Not Running**
   - Check GitHub Actions tab
   - Verify workflow file is committed
   - Check repository permissions

### **Fallback System**

If GitHub API fails, the system falls back to local storage:
- Bets are saved locally
- Confirmation runs locally
- Data persists until GitHub is available

## 📊 **Monitoring**

### **Check System Status**
```bash
# View current user bets
node scripts/test-global-system.js

# Check GitHub Actions
# Go to GitHub → Actions → Bet Confirmation Processor
```

### **Key Metrics**
- Total users with bets
- Active bets count
- Confirmation success rate
- GitHub API response times

## 🎉 **Benefits**

✅ **24/7 Operation**: No local server required
✅ **Global Access**: Works from anywhere
✅ **Automatic Backup**: All data on GitHub
✅ **Real-time Updates**: Instant bet placement and confirmation
✅ **Scalable**: Handles unlimited users
✅ **Reliable**: GitHub's infrastructure

## 🚀 **Next Steps**

1. Set your GitHub token
2. Test the system
3. Commit and push changes
4. Monitor GitHub Actions
5. Start accepting bets!

---

**🌍 Your global betting system is now ready for worldwide use!** 