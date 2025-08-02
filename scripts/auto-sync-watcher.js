const fs = require('fs');
const path = require('path');
const GoogleSheetsSync = require('./setup-google-sheets-sync');

class AutoSyncWatcher {
    constructor() {
        this.sync = new GoogleSheetsSync();
        this.watchPath = path.join(__dirname, '../data/user-bets.json');
        this.isInitialized = false;
        this.lastSyncTime = 0;
        this.syncInterval = 5000; // Minimum 5 seconds between syncs
    }

    async initialize() {
        if (await this.sync.initialize()) {
            this.isInitialized = true;
            console.log('✅ Auto-sync watcher initialized!');
            return true;
        }
        return false;
    }

    async syncIfNeeded() {
        if (!this.isInitialized) {
            console.log('⚠️  Watcher not initialized, skipping sync');
            return;
        }

        const now = Date.now();
        if (now - this.lastSyncTime < this.syncInterval) {
            console.log('⏱️  Skipping sync (too soon since last sync)');
            return;
        }

        try {
            console.log('🔄 Syncing to Google Sheets...');
            await this.sync.syncToGoogleSheets();
            this.lastSyncTime = now;
            console.log('✅ Sync completed successfully!');
        } catch (error) {
            console.error('❌ Error during sync:', error.message);
        }
    }

    startWatching() {
        if (!this.isInitialized) {
            console.error('❌ Watcher not initialized. Run setup first.');
            return;
        }

        console.log('👀 Starting file watcher...');
        console.log(`📁 Watching: ${this.watchPath}`);
        console.log('🔄 Auto-sync will trigger when user-bets.json changes');
        console.log('⏹️  Press Ctrl+C to stop watching');

        // Watch for file changes
        fs.watch(this.watchPath, async (eventType, filename) => {
            if (eventType === 'change') {
                console.log(`📝 File changed: ${filename}`);
                await this.syncIfNeeded();
            }
        });

        // Also watch for file creation (in case file doesn't exist yet)
        const dirPath = path.dirname(this.watchPath);
        fs.watch(dirPath, async (eventType, filename) => {
            if (eventType === 'rename' && filename === 'user-bets.json') {
                console.log(`📝 File created: ${filename}`);
                await this.syncIfNeeded();
            }
        });
    }
}

// Main execution
async function main() {
    const watcher = new AutoSyncWatcher();
    
    if (await watcher.initialize()) {
        watcher.startWatching();
    } else {
        console.log('❌ Failed to initialize watcher');
        console.log('📋 Please run setup-google-sheets-sync.js first to configure credentials');
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = AutoSyncWatcher; 