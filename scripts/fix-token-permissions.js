console.log('🔧 GitHub Token Permissions Fix\n');

console.log('❌ Current Issue: Token lacks write permissions');
console.log('✅ Solution: Create new token with proper scopes\n');

console.log('📋 Steps to Fix:');
console.log('1. Go to GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)');
console.log('2. Click "Generate new token (classic)"');
console.log('3. Name: "BDashboard Global Betting"');
console.log('4. Select these scopes:');
console.log('   ✅ repo (Full control of private repositories)');
console.log('   ✅ workflow (Update GitHub Action workflows)');
console.log('5. Click "Generate token"');
console.log('6. Copy the new token');
console.log('7. Set it as environment variable:');
console.log('   export GITHUB_TOKEN=your_new_token_here\n');

console.log('🔍 Current Token Status:');
console.log('✅ Can read repository: Yes');
console.log('❌ Can write to repository: No (403 error)');
console.log('💡 This is why bet placement fails\n');

console.log('🚀 After creating new token:');
console.log('1. Set the new token: export GITHUB_TOKEN=new_token');
console.log('2. Test again: node scripts/test-global-system.js');
console.log('3. Should see: "✅ Test bet added successfully"\n');

console.log('📝 Alternative: Use GitHub Actions Token');
console.log('If you prefer, you can also use the GITHUB_TOKEN that GitHub Actions provides:');
console.log('- This token has full repository access');
console.log('- Works automatically in GitHub Actions');
console.log('- No need to create personal access token\n');

console.log('🎯 Recommended Approach:');
console.log('1. Create new personal access token with repo scope');
console.log('2. Test locally with the new token');
console.log('3. GitHub Actions will use its own token automatically');
console.log('4. Both local and automated systems will work!'); 