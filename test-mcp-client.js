#!/usr/bin/env node

/**
 * Simple MCP client to test the Figma server locally
 * This demonstrates how to connect to the MCP server from VS Code or other applications
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔌 Testing MCP Figma Server Connection...\n');

// Start the MCP server process
const serverProcess = spawn('node', [join(__dirname, 'dist/index.js')], {
    env: {
        ...process.env,
        FIGMA_API_KEY: process.env.FIGMA_API_KEY || 'your_token_here'
    },
    stdio: ['pipe', 'pipe', 'pipe']
});

let responseData = '';

serverProcess.stdout.on('data', (data) => {
    responseData += data.toString();
    console.log('📥 Server Response:', data.toString());
});

serverProcess.stderr.on('data', (data) => {
    console.log('📋 Server Log:', data.toString());
});

// Send MCP protocol messages
function sendMCPMessage(message) {
    console.log('📤 Sending:', JSON.stringify(message, null, 2));
    serverProcess.stdin.write(JSON.stringify(message) + '\n');
}

// Wait for server to start
setTimeout(() => {
    console.log('\n🚀 Server started, testing MCP protocol...\n');
    
    // Test 1: List available tools
    sendMCPMessage({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list"
    });
    
    // Test 2: Get server info (if available)
    setTimeout(() => {
        sendMCPMessage({
            jsonrpc: "2.0",
            id: 2,
            method: "initialize",
            params: {
                protocolVersion: "2024-11-05",
                capabilities: {},
                clientInfo: {
                    name: "test-client",
                    version: "1.0.0"
                }
            }
        });
    }, 1000);
    
}, 2000);

// Cleanup after 10 seconds
setTimeout(() => {
    console.log('\n✅ Test completed. Shutting down server...');
    serverProcess.kill('SIGTERM');
    process.exit(0);
}, 10000);

serverProcess.on('close', (code) => {
    console.log(`\n🔚 Server process exited with code ${code}`);
});
