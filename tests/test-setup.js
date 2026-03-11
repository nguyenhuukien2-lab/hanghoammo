// Test script to verify setup
const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('  HANGHOAMMO - SETUP VERIFICATION');
console.log('========================================\n');

let hasErrors = false;

// Check Node.js version
console.log('✓ Checking Node.js version...');
const nodeVersion = process.version;
console.log(`  Node.js: ${nodeVersion}\n`);

// Check required files
console.log('✓ Checking required files...');
const requiredFiles = [
    '.env',
    'server.js',
    'package.json',
    'models/User.js',
    'models/Product.js',
    'models/Order.js',
    'routes/auth.js',
    'routes/products.js',
    'routes/orders.js',
    'routes/admin.js',
    'middleware/auth.js',
    'public/index.html',
    'public/products.html',
    'public/admin.html',
    'public/style.css',
    'public/script.js',
    'public/admin.js'
];

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`  ✓ ${file}`);
    } else {
        console.log(`  ✗ ${file} - MISSING!`);
        hasErrors = true;
    }
});

console.log('');

// Check .env configuration
console.log('✓ Checking .env configuration...');
if (fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf8');
    const requiredVars = ['PORT', 'MONGODB_URI', 'JWT_SECRET', 'JWT_EXPIRE', 'NODE_ENV'];
    
    requiredVars.forEach(varName => {
        if (envContent.includes(varName)) {
            console.log(`  ✓ ${varName}`);
        } else {
            console.log(`  ✗ ${varName} - MISSING!`);
            hasErrors = true;
        }
    });
} else {
    console.log('  ✗ .env file not found!');
    hasErrors = true;
}

console.log('');

// Check node_modules
console.log('✓ Checking dependencies...');
if (fs.existsSync('node_modules')) {
    console.log('  ✓ node_modules exists');
    
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = Object.keys(packageJson.dependencies || {});
    console.log(`  ✓ ${dependencies.length} dependencies listed`);
} else {
    console.log('  ✗ node_modules not found! Run: npm install');
    hasErrors = true;
}

console.log('');
console.log('========================================');

if (hasErrors) {
    console.log('❌ SETUP INCOMPLETE - Please fix the errors above');
    console.log('========================================\n');
    process.exit(1);
} else {
    console.log('✅ SETUP COMPLETE - Ready to start!');
    console.log('========================================\n');
    console.log('Run the following command to start:');
    console.log('  npm run dev\n');
    console.log('Then visit:');
    console.log('  http://localhost:3000\n');
}
