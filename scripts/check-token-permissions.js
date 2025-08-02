const axios = require('axios');

async function checkTokenPermissions() {
    console.log('🔍 Checking GitHub Token Permissions...\n');
    
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        console.error('❌ GITHUB_TOKEN environment variable is not set');
        return;
    }
    
    const headers = {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'BDashboard-Betting-System'
    };
    
    try {
        // Test 1: Check user info
        console.log('📋 Test 1: Checking user info...');
        const userResponse = await axios.get('https://api.github.com/user', { headers });
        console.log(`✅ User: ${userResponse.data.login}`);
        console.log(`✅ Name: ${userResponse.data.name}`);
        console.log(`✅ Email: ${userResponse.data.email}`);
        
        // Test 2: Check repository access
        console.log('\n📋 Test 2: Checking repository access...');
        const repoResponse = await axios.get('https://api.github.com/repos/Lofi-Sol/BDashboard', { headers });
        console.log(`✅ Repository: ${repoResponse.data.full_name}`);
        console.log(`✅ Private: ${repoResponse.data.private}`);
        console.log(`✅ Permissions:`, repoResponse.data.permissions);
        
        // Test 3: Check if we can read files
        console.log('\n📋 Test 3: Testing file read access...');
        const fileResponse = await axios.get(
            'https://api.github.com/repos/Lofi-Sol/BDashboard/contents/data/user-bets.json',
            { headers }
        );
        console.log(`✅ Can read files: Yes`);
        console.log(`✅ File size: ${fileResponse.data.size} bytes`);
        
        // Test 4: Check if we can write files (this might fail)
        console.log('\n📋 Test 4: Testing file write access...');
        try {
            const writeResponse = await axios.put(
                'https://api.github.com/repos/Lofi-Sol/BDashboard/contents/data/test-write.json',
                {
                    message: 'Test write access',
                    content: Buffer.from('{"test": true}').toString('base64')
                },
                { headers }
            );
            console.log(`✅ Can write files: Yes`);
            
            // Clean up test file
            await axios.delete(
                'https://api.github.com/repos/Lofi-Sol/BDashboard/contents/data/test-write.json',
                {
                    data: {
                        message: 'Remove test file',
                        sha: writeResponse.data.content.sha
                    },
                    headers
                }
            );
            console.log(`✅ Cleaned up test file`);
            
        } catch (error) {
            console.log(`❌ Can write files: No (${error.response?.status})`);
            console.log(`   Error: ${error.response?.data?.message || error.message}`);
        }
        
        // Test 5: Check token scopes
        console.log('\n📋 Test 5: Checking token scopes...');
        const scopes = error.response?.headers?.['x-oauth-scopes'] || 'Unknown';
        console.log(`✅ Token scopes: ${scopes}`);
        
        console.log('\n✅ Token permission check completed!');
        
    } catch (error) {
        console.error('❌ Error checking token permissions:', error.message);
        if (error.response?.status === 401) {
            console.log('💡 Token is invalid or expired');
        } else if (error.response?.status === 403) {
            console.log('💡 Token lacks required permissions');
        }
    }
}

// Run the check
if (require.main === module) {
    checkTokenPermissions()
        .then(() => {
            console.log('\n🎉 Permission check completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Permission check failed:', error);
            process.exit(1);
        });
}

module.exports = { checkTokenPermissions }; 