#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Nishon AI Project Structure...\n');

const requiredFiles = [
  // Root files
  'package.json',
  'turbo.json',
  '.env.example',
  '.gitignore',
  'README.md',
  'docker-compose.yml',
  'docker-compose.prod.yml',
  
  // API structure
  'apps/api/package.json',
  'apps/api/tsconfig.json',
  'apps/api/Dockerfile',
  'apps/api/src/app.module.ts',
  'apps/api/src/main.ts',
  
  // Web structure
  'apps/web/package.json',
  'apps/web/tsconfig.json',
  'apps/web/tailwind.config.ts',
  'apps/web/Dockerfile',
  'apps/web/src/app/page.tsx',
  'apps/web/src/app/layout.tsx',
  'apps/web/src/app/globals.css',
  
  // Shared packages
  'packages/shared/package.json',
  'packages/shared/tsconfig.json',
  'packages/shared/src/index.ts',
  'packages/shared/src/enums/platform.enum.ts',
  'packages/shared/src/enums/campaign-status.enum.ts',
  'packages/shared/src/enums/autopilot-mode.enum.ts',
  'packages/shared/src/types/user.types.ts',
  'packages/shared/src/types/workspace.types.ts',
  'packages/shared/src/types/campaign.types.ts',
  'packages/shared/src/types/platform.types.ts',
  'packages/shared/src/dtos/auth.dto.ts',
  'packages/shared/src/dtos/campaign.dto.ts',
  'packages/shared/src/dtos/workspace.dto.ts',
  
  // AI SDK
  'packages/ai-sdk/package.json',
  'packages/ai-sdk/tsconfig.json',
  'packages/ai-sdk/src/index.ts',
  'packages/ai-sdk/src/openai-client.ts',
  'packages/ai-sdk/src/prompts/strategy.prompt.ts',
  'packages/ai-sdk/src/prompts/competitor.prompt.ts',
  'packages/ai-sdk/src/prompts/script.prompt.ts',
  'packages/ai-sdk/src/prompts/optimization.prompt.ts',
];

const missingFiles = [];
const existingFiles = [];

requiredFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    existingFiles.push(file);
  } else {
    missingFiles.push(file);
  }
});

console.log(`✅ Found ${existingFiles.length} required files`);
console.log(`❌ Missing ${missingFiles.length} files`);

if (missingFiles.length > 0) {
  console.log('\nMissing files:');
  missingFiles.forEach(file => console.log(`  - ${file}`));
}

// Check package.json structure
try {
  const rootPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const apiPackage = JSON.parse(fs.readFileSync('apps/api/package.json', 'utf8'));
  const webPackage = JSON.parse(fs.readFileSync('apps/web/package.json', 'utf8'));
  const sharedPackage = JSON.parse(fs.readFileSync('packages/shared/package.json', 'utf8'));
  const aiSdkPackage = JSON.parse(fs.readFileSync('packages/ai-sdk/package.json', 'utf8'));

  console.log('\n📦 Package Structure:');
  console.log(`  Root workspace: ${rootPackage.name}`);
  console.log(`  API package: ${apiPackage.name}`);
  console.log(`  Web package: ${webPackage.name}`);
  console.log(`  Shared package: ${sharedPackage.name}`);
  console.log(`  AI SDK package: ${aiSdkPackage.name}`);

  // Check workspaces
  if (rootPackage.workspaces && rootPackage.workspaces.includes('apps/*') && rootPackage.workspaces.includes('packages/*')) {
    console.log('✅ Workspaces configured correctly');
  } else {
    console.log('❌ Workspaces not configured correctly');
  }

} catch (error) {
  console.log('❌ Error reading package.json files:', error.message);
}

// Check Docker Compose
try {
  const dockerCompose = fs.readFileSync('docker-compose.yml', 'utf8');
  if (dockerCompose.includes('postgres') && dockerCompose.includes('redis') && dockerCompose.includes('api') && dockerCompose.includes('web')) {
    console.log('✅ Docker Compose configured correctly');
  } else {
    console.log('❌ Docker Compose missing required services');
  }
} catch (error) {
  console.log('❌ Error reading docker-compose.yml:', error.message);
}

console.log('\n🎉 Nishon AI project structure test completed!');
console.log('\nNext steps:');
console.log('1. Run `npm install` to install dependencies');
console.log('2. Run `docker-compose up -d postgres redis` to start database services');
console.log('3. Run `npm run dev` to start development servers');
console.log(`4. Visit ${process.env.FRONTEND_URL || 'your FRONTEND_URL'} to see the frontend`);
console.log(`5. Visit ${process.env.API_BASE_URL || 'your API_BASE_URL'} to see the API`);
