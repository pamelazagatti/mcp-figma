#!/usr/bin/env node

/**
 * Example: Get specific node information from Figma URL
 * Usage: node get-node-info.js "https://www.figma.com/design/ABC123DEF456/My-Design?node-id=123-456&t=xyz789"
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse Figma URL to extract file key and node ID
function parseFigmaUrl(url) {
    try {
        const urlObj = new URL(url);
        
        // Extract file key from path: /design/FILE_KEY/...
        const pathParts = urlObj.pathname.split('/');
        const fileKey = pathParts[2]; // /design/FILE_KEY/...
        
        // Extract node ID from query params
        const nodeId = urlObj.searchParams.get('node-id');
        
        if (!fileKey || !nodeId) {
            throw new Error('Invalid Figma URL format');
        }
        
        // Convert node ID format (123-456 -> 123:456)
        const formattedNodeId = nodeId.replace('-', ':');
        
        return { fileKey, nodeId: formattedNodeId };
    } catch (error) {
        console.error('❌ Error parsing URL:', error.message);
        console.log('Expected format: https://www.figma.com/design/FILE_KEY/Name?node-id=123-456');
        process.exit(1);
    }
}

// Get command line argument
const figmaUrl = process.argv[2];
if (!figmaUrl) {
    console.log('Usage: node get-node-info.js "FIGMA_URL"');
    console.log('Example: node get-node-info.js "https://www.figma.com/design/ABC123DEF456/My-Design?node-id=123-456"');
    process.exit(1);
}

console.log('🔍 Extracting node information from Figma URL...\n');

const { fileKey, nodeId } = parseFigmaUrl(figmaUrl);
console.log(`📄 File Key: ${fileKey}`);
console.log(`🎯 Node ID: ${nodeId}\n`);

// Start MCP server
const serverProcess = spawn('node', [join(__dirname, 'dist/index.js')], {
    env: {
        ...process.env,
        FIGMA_API_KEY: process.env.FIGMA_API_KEY || 'your_token_here'
    },
    stdio: ['pipe', 'pipe', 'pipe']
});

serverProcess.stderr.on('data', (data) => {
    console.log('📋 Server:', data.toString().trim());
});

// Wait for server to start, then request node info
setTimeout(() => {
    console.log('🚀 Requesting node information...\n');
    
    const request = {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
            name: "figma_get_file_nodes",
            arguments: {
                fileKey: fileKey,
                ids: nodeId,
                depth: 1  // Get basic info, increase for more detail
            }
        }
    };
    
    serverProcess.stdin.write(JSON.stringify(request) + '\n');
}, 2000);

serverProcess.stdout.on('data', (data) => {
    try {
        const response = JSON.parse(data.toString());
        if (response.result) {
            console.log('✅ Node Information Retrieved:');
            console.log(JSON.stringify(response.result, null, 2));
        } else if (response.error) {
            console.error('❌ Error:', response.error.message);
        }
    } catch (e) {
        console.log('📥 Raw response:', data.toString());
    }
    
    // Cleanup
    setTimeout(() => {
        serverProcess.kill('SIGTERM');
        process.exit(0);
    }, 1000);
});

serverProcess.on('error', (error) => {
    console.error('❌ Server error:', error.message);
    process.exit(1);
});
