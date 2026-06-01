const { execSync } = require('child_process');
const path = require('path');

const projectDir = 'C:\\Users\\vicea\\Downloads\\SmartLogix-main\\SmartLogix-main\\SmartLogix';

try {
  console.log('Starting tests with coverage...\n');
  
  execSync('npm run test -- --no-watch --code-coverage', {
    cwd: projectDir,
    stdio: 'inherit',
    shell: true
  });
  
  console.log('\n✅ Tests completed successfully');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Test execution failed');
  process.exit(1);
}
