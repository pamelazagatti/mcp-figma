/**
 * Security validation utilities for MCP Figma server
 */

export class SecurityValidationError extends Error {
    constructor(message: string, public readonly field: string) {
        super(message);
        this.name = 'SecurityValidationError';
    }
}

/**
 * Validates Figma file keys to ensure they match expected format
 * Figma file keys should be alphanumeric with hyphens
 */
export function validateFileKey(fileKey: string): string {
    if (!fileKey || typeof fileKey !== 'string') {
        throw new SecurityValidationError('File key is required and must be a string', 'fileKey');
    }
    
    // Figma file keys are typically alphanumeric with hyphens, no special characters
    if (!/^[a-zA-Z0-9\-_]{10,}$/.test(fileKey)) {
        throw new SecurityValidationError('Invalid file key format. Must be alphanumeric with hyphens/underscores and at least 10 characters', 'fileKey');
    }
    
    return fileKey;
}

/**
 * Validates Figma node IDs to ensure they match expected format
 * Node IDs should be alphanumeric with colons and hyphens
 */
export function validateNodeIds(nodeIds: string): string {
    if (!nodeIds || typeof nodeIds !== 'string') {
        throw new SecurityValidationError('Node IDs are required and must be a string', 'nodeIds');
    }
    
    // Split by comma and validate each ID
    const ids = nodeIds.split(',').map(id => id.trim());
    for (const id of ids) {
        // Figma node IDs can contain alphanumeric, colons, hyphens, underscores
        if (!/^[a-zA-Z0-9:\-_]{1,100}$/.test(id)) {
            throw new SecurityValidationError(`Invalid node ID format: ${id}. Must be alphanumeric with colons, hyphens, underscores`, 'nodeIds');
        }
    }
    
    return nodeIds;
}

/**
 * Validates team IDs to ensure they match expected format
 */
export function validateTeamId(teamId: string): string {
    if (!teamId || typeof teamId !== 'string') {
        throw new SecurityValidationError('Team ID is required and must be a string', 'teamId');
    }
    
    // Team IDs should be numeric
    if (!/^\d{1,20}$/.test(teamId)) {
        throw new SecurityValidationError('Invalid team ID format. Must be numeric', 'teamId');
    }
    
    return teamId;
}

/**
 * Validates project IDs to ensure they match expected format
 */
export function validateProjectId(projectId: string): string {
    if (!projectId || typeof projectId !== 'string') {
        throw new SecurityValidationError('Project ID is required and must be a string', 'projectId');
    }
    
    // Project IDs should be numeric
    if (!/^\d{1,20}$/.test(projectId)) {
        throw new SecurityValidationError('Invalid project ID format. Must be numeric', 'projectId');
    }
    
    return projectId;
}

/**
 * Validates component/style keys to ensure they match expected format
 */
export function validateComponentKey(key: string): string {
    if (!key || typeof key !== 'string') {
        throw new SecurityValidationError('Component key is required and must be a string', 'key');
    }
    
    // Component keys are typically alphanumeric with hyphens and colons
    if (!/^[a-zA-Z0-9:\-_]{10,}$/.test(key)) {
        throw new SecurityValidationError('Invalid component key format. Must be alphanumeric with colons, hyphens, underscores', 'key');
    }
    
    return key;
}

/**
 * Validates comment IDs to ensure they match expected format
 */
export function validateCommentId(commentId: string): string {
    if (!commentId || typeof commentId !== 'string') {
        throw new SecurityValidationError('Comment ID is required and must be a string', 'commentId');
    }
    
    // Comment IDs should be numeric
    if (!/^\d{1,20}$/.test(commentId)) {
        throw new SecurityValidationError('Invalid comment ID format. Must be numeric', 'commentId');
    }
    
    return commentId;
}

/**
 * Validates webhook URLs to ensure they are secure
 * Only allows HTTPS URLs and blocks localhost/private IPs for production use
 */
export function validateWebhookUrl(url: string, allowLocalhost: boolean = false): string {
    if (!url || typeof url !== 'string') {
        throw new SecurityValidationError('Webhook URL is required and must be a string', 'endpoint');
    }
    
    let parsedUrl: URL;
    try {
        parsedUrl = new URL(url);
    } catch (error) {
        throw new SecurityValidationError('Invalid webhook URL format', 'endpoint');
    }
    
    // Block dangerous protocols
    if (!['https:', 'http:'].includes(parsedUrl.protocol)) {
        throw new SecurityValidationError('Webhook URLs must use HTTP or HTTPS protocol', 'endpoint');
    }
    
    // For localhost, allow HTTP (VM use case), otherwise require HTTPS
    const hostname = parsedUrl.hostname.toLowerCase();
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    
    if (!allowLocalhost && isLocalhost) {
        throw new SecurityValidationError('Webhook URLs cannot target localhost or private IP ranges', 'endpoint');
    }
    
    // For non-localhost, require HTTPS unless allowLocalhost is true (VM mode)
    if (!isLocalhost && parsedUrl.protocol !== 'https:' && !allowLocalhost) {
        throw new SecurityValidationError('Webhook URLs must use HTTPS protocol for external hosts', 'endpoint');
    }
    
    // Block private IP ranges unless explicitly allowed
    if (!allowLocalhost) {
        if (hostname.startsWith('192.168.') ||
            hostname.startsWith('10.') ||
            hostname.startsWith('172.')) {
            throw new SecurityValidationError('Webhook URLs cannot target private IP ranges', 'endpoint');
        }
    }
    
    return url;
}

/**
 * Validates webhook IDs to ensure they match expected format
 */
export function validateWebhookId(webhookId: string): string {
    if (!webhookId || typeof webhookId !== 'string') {
        throw new SecurityValidationError('Webhook ID is required and must be a string', 'webhook_id');
    }
    
    // Webhook IDs should be numeric
    if (!/^\d{1,20}$/.test(webhookId)) {
        throw new SecurityValidationError('Invalid webhook ID format. Must be numeric', 'webhook_id');
    }
    
    return webhookId;
}

/**
 * Sanitizes comment text to prevent injection attacks
 */
export function sanitizeCommentText(text: string): string {
    if (!text || typeof text !== 'string') {
        throw new SecurityValidationError('Comment text is required and must be a string', 'message');
    }
    
    // Limit comment length
    if (text.length > 10000) {
        throw new SecurityValidationError('Comment text too long. Maximum 10,000 characters allowed', 'message');
    }
    
    // Basic sanitization - remove HTML tags and dangerous content but preserve text content
    let sanitized = text
        // Remove script tags and their content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove iframe tags and their content
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        // Remove javascript: protocol
        .replace(/javascript:/gi, '')
        // Remove event handlers
        .replace(/on\w+\s*=/gi, '')
        // Remove all HTML tags but keep the content
        .replace(/<[^>]*>/g, '');
    
    return sanitized.trim();
}

/**
 * Validates emoji strings to ensure they're safe
 */
export function validateEmoji(emoji: string): string {
    if (!emoji || typeof emoji !== 'string') {
        throw new SecurityValidationError('Emoji is required and must be a string', 'emoji');
    }
    
    // Limit emoji length and allow only basic emoji characters
    if (emoji.length > 10) {
        throw new SecurityValidationError('Emoji string too long', 'emoji');
    }
    
    // Allow emoji unicode ranges and basic ASCII emoji
    if (!/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}:\-\)\(\[\]]+$/u.test(emoji)) {
        throw new SecurityValidationError('Invalid emoji format', 'emoji');
    }
    
    return emoji;
}

/**
 * Validates Figma API token format
 */
export function validateFigmaToken(token: string): string {
    if (!token || typeof token !== 'string') {
        throw new SecurityValidationError('Figma API token is required and must be a string', 'token');
    }
    
    // Figma tokens are typically long alphanumeric strings
    if (!/^[a-zA-Z0-9\-_]{20,}$/.test(token)) {
        throw new SecurityValidationError('Invalid Figma API token format', 'token');
    }
    
    return token;
}
