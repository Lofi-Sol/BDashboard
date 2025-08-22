# 🚀 Railway Deployment Guide

## Prerequisites
- GitHub account
- Railway account (free at [railway.app](https://railway.app))

## Step 1: Prepare Your Repository

Your project is now ready for deployment! The following files have been created/updated:

✅ **Updated Files:**
- `server.js` - Now uses environment variables for MongoDB
- `railway.json` - Railway configuration
- `Procfile` - Alternative deployment config
- `.gitignore` - Already configured to exclude `.env`

## Step 2: Deploy to Railway

### 2.1 Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with your GitHub account
3. Complete the verification process

### 2.2 Deploy Your Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository (`BDashboard`)
4. Railway will auto-detect it's a Node.js app

### 2.3 Configure Environment Variables
In Railway dashboard, go to your project → **"Variables"** tab and add:

```
MONGODB_URI=mongodb+srv://oowol003:TornData2341@torndata.vxouoj6.mongodb.net/?retryWrites=true&w=majority&appName=TornData
NODE_ENV=production
PORT=3000
```

### 2.4 Deploy
1. Railway will automatically build and deploy your app
2. You'll get a URL like: `https://your-app-name.railway.app`

## Step 3: Access Your Dashboard

Once deployed, your betting dashboard will be available at:

- **🌐 Main Dashboard:** `https://your-app-name.railway.app`
- **🎲 Betting Dashboard:** `https://your-app-name.railway.app/betting/`
- **👑 Bookie Dashboard:** `https://your-app-name.railway.app/bookie`
- **📈 Stock Graphs:** `https://your-app-name.railway.app/stock-graphs`
- **📋 Logs:** `https://your-app-name.railway.app/logs`
- **🔧 API Tester:** `https://your-app-name.railway.app/api-tester`

## Step 4: Custom Domain (Optional)

1. In Railway dashboard, go to **"Settings"** → **"Domains"**
2. Add your custom domain
3. Update DNS records as instructed

## Troubleshooting

### Common Issues:

**1. Build Fails**
- Check Railway logs for error messages
- Ensure all dependencies are in `package.json`

**2. App Won't Start**
- Verify environment variables are set correctly
- Check MongoDB connection string

**3. 404 Errors**
- Ensure your routes are properly configured
- Check Railway logs for routing issues

### Railway Logs
- Go to your project → **"Deployments"** → Click on deployment → **"View Logs"**

## Security Notes

✅ **Environment Variables:** MongoDB credentials are now secure
✅ **HTTPS:** Railway provides automatic SSL certificates
✅ **CORS:** Configured for web access
✅ **Rate Limiting:** Already implemented in your app

## Monitoring

Railway provides:
- **Real-time logs**
- **Performance metrics**
- **Uptime monitoring**
- **Automatic restarts**

## Cost

- **Free Tier:** $5 credit monthly (more than enough for this app)
- **Paid Plans:** Start at $5/month for additional resources

## Next Steps

1. **Test your deployed app**
2. **Set up monitoring alerts**
3. **Configure custom domain (optional)**
4. **Set up automatic deployments from GitHub**

---

**Need Help?**
- Railway Docs: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
