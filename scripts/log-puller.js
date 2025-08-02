const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function pullLogs() {
  try {
    console.log('🔍 Pulling logs from Torn API...');
    console.log('📅 Current timestamp:', new Date().toISOString());
    
    // Check if API key is set
    if (!process.env.TORN_API_KEY) {
      console.error('❌ TORN_API_KEY environment variable is not set');
      console.log('Please set your Torn API key: export TORN_API_KEY="your_api_key_here"');
      process.exit(1);
    }
    
    console.log('✅ API key is set');
    console.log('🔑 API key (first 10 chars):', process.env.TORN_API_KEY.substring(0, 10) + '...');
    
    // Fetch logs from Torn API
    console.log('🌐 Making API request...');
    const response = await axios.get(`https://api.torn.com/user/?selections=log&key=${process.env.TORN_API_KEY}`);
    
    console.log('📡 API Response Status:', response.status);
    
    if (response.data.error) {
      throw new Error(`Torn API Error: ${response.data.error}`);
    }
    
    const logs = response.data.log || {};
    console.log(`📊 Found ${Object.keys(logs).length} total logs`);
    
    // Filter for "Item receive" logs
    const filteredLogs = {};
    let itemReceiveCount = 0;
    
    Object.entries(logs).forEach(([logId, logEntry]) => {
      if (logEntry.title === 'Item receive') {
        filteredLogs[logId] = logEntry;
        itemReceiveCount++;
        console.log(`🎯 Found Item receive log: ${logId} - ${logEntry.data?.message}`);
      }
    });
    
    console.log(`✅ Filtered ${itemReceiveCount} "Item receive" logs`);
    
    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    console.log('📁 Data directory:', dataDir);
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('📁 Created data directory');
    }
    
    // Load existing filtered logs
    let existingData = { logs: {}, metadata: {} };
    const logsFile = path.join(dataDir, 'filtered-logs.json');
    console.log('📄 Logs file path:', logsFile);
    
    try {
      if (fs.existsSync(logsFile)) {
        const existingContent = fs.readFileSync(logsFile, 'utf8');
        existingData = JSON.parse(existingContent);
        console.log(`📄 Loaded existing file with ${Object.keys(existingData.logs).length} logs`);
      } else {
        console.log('📄 No existing filtered-logs.json found, creating new file');
      }
    } catch (error) {
      console.log('📄 Error reading existing file, creating new file');
    }
    
    // Merge new logs with existing logs (avoid duplicates)
    const existingLogIds = new Set(Object.keys(existingData.logs));
    let newLogsCount = 0;
    
    Object.entries(filteredLogs).forEach(([logId, logEntry]) => {
      if (!existingLogIds.has(logId)) {
        existingData.logs[logId] = logEntry;
        newLogsCount++;
        console.log(`🆕 Added new log: ${logId}`);
      } else {
        console.log(`⏭️ Skipped existing log: ${logId}`);
      }
    });
    
    // Update metadata
    existingData.metadata = {
      last_updated: new Date().toISOString(),
      total_logs: Object.keys(existingData.logs).length,
      new_logs_found: newLogsCount,
      run_timestamp: new Date().toISOString(),
      api_response_count: Object.keys(logs).length,
      filtered_count: itemReceiveCount
    };
    
    // Write updated data
    console.log('💾 Writing updated data to file...');
    fs.writeFileSync(logsFile, JSON.stringify(existingData, null, 2));
    
    console.log(`✅ Successfully processed logs`);
    console.log(`📊 Total logs in file: ${existingData.metadata.total_logs}`);
    console.log(`🆕 New logs added: ${newLogsCount}`);
    console.log(`📋 API response logs: ${existingData.metadata.api_response_count}`);
    console.log(`🎯 Filtered "Item receive" logs: ${existingData.metadata.filtered_count}`);
    
    // Verify file was written
    if (fs.existsSync(logsFile)) {
      const fileStats = fs.statSync(logsFile);
      console.log(`📄 File size: ${fileStats.size} bytes`);
      console.log(`📄 File modified: ${fileStats.mtime}`);
    }
    
  } catch (error) {
    console.error('❌ Error pulling logs:', error.message);
    if (error.response) {
      console.error('📡 Response status:', error.response.status);
      console.error('📡 Response data:', error.response.data);
    }
    process.exit(1);
  }
}

pullLogs(); 