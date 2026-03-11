const fs = require('fs');
const path = require('path');

console.log('🤖 Integrating AI Chatbot into all HTML pages...\n');

// List of HTML files to integrate chatbot
const htmlFiles = [
    'public/index.html',
    'public/products.html',
    'public/admin.html',
    'public/profile.html',
    'public/wallet.html',
    'public/checkout.html',
    'public/orders.html'
];

// CSS and JS to add
const cssLink = '<link rel="stylesheet" href="ai-chatbot.css">';
const jsScript = '<script src="ai-chatbot.js"></script>';

let processedFiles = 0;
let skippedFiles = 0;

htmlFiles.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Skipped: ${filePath} (file not found)`);
        skippedFiles++;
        return;
    }

    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Add CSS if not already present
        if (!content.includes('ai-chatbot.css')) {
            // Find the last stylesheet link and add after it
            const lastCssRegex = /<link[^>]*rel=["']stylesheet["'][^>]*>/gi;
            const matches = [...content.matchAll(lastCssRegex)];
            
            if (matches.length > 0) {
                const lastMatch = matches[matches.length - 1];
                const insertIndex = lastMatch.index + lastMatch[0].length;
                content = content.slice(0, insertIndex) + '\n    ' + cssLink + content.slice(insertIndex);
                modified = true;
            }
        }

        // Add JS if not already present
        if (!content.includes('ai-chatbot.js')) {
            // Find script.js and add after it
            const scriptRegex = /<script src=["']script\.js["']><\/script>/gi;
            const scriptMatch = content.match(scriptRegex);
            
            if (scriptMatch) {
                content = content.replace(scriptRegex, scriptMatch[0] + '\n    ' + jsScript);
                modified = true;
            } else {
                // If no script.js found, add before closing body tag
                const bodyCloseRegex = /<\/body>/gi;
                if (content.match(bodyCloseRegex)) {
                    content = content.replace(bodyCloseRegex, '    ' + jsScript + '\n</body>');
                    modified = true;
                }
            }
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Integrated: ${filePath}`);
            processedFiles++;
        } else {
            console.log(`ℹ️  Already integrated: ${filePath}`);
            processedFiles++;
        }

    } catch (error) {
        console.log(`❌ Error processing ${filePath}:`, error.message);
        skippedFiles++;
    }
});

console.log(`
╔═══════════════════════════════════════╗
║   🤖 CHATBOT INTEGRATION COMPLETE    ║
╠═══════════════════════════════════════╣
║   Processed: ${processedFiles} files                ║
║   Skipped: ${skippedFiles} files                  ║
╚═══════════════════════════════════════╝

📝 Next Steps:
1. Set OPENAI_API_KEY in .env file
2. Run: npm start
3. Visit: http://localhost:3001/chatbot-demo.html
4. Test chatbot on any page

🔧 Admin Panel:
- http://localhost:3001/admin-chatbot.html
`);

// Create a summary file
const summaryContent = `# 🤖 AI Chatbot Integration Summary

## Files Modified
${htmlFiles.map(file => `- ${file}`).join('\n')}

## Added Components
- CSS: ai-chatbot.css
- JS: ai-chatbot.js

## Features
✅ Smart product consultation
✅ 24/7 customer support
✅ Fallback responses when OpenAI unavailable
✅ Conversation history
✅ Mobile responsive
✅ Admin analytics panel

## Usage
The chatbot appears as a floating button (🤖) in the bottom-right corner of all pages.

## Configuration
Set OPENAI_API_KEY in .env file for full AI functionality.
Without API key, chatbot uses fallback responses.

Generated: ${new Date().toISOString()}
`;

fs.writeFileSync('CHATBOT_INTEGRATION_SUMMARY.md', summaryContent);
console.log('📄 Created: CHATBOT_INTEGRATION_SUMMARY.md');