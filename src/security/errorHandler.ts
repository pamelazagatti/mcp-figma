/**
 * Error handling utilities for secure error reporting
 */

export class SecureError extends Error {
    constructor(
        message: string,
        public readonly userMessage: string,
        public readonly statusCode: number = 500
    ) {
        super(message);
        this.name = 'SecureError';
    }
}

/**
 * Sanitizes error messages to prevent information leakage
 * Returns generic messages to users while logging detailed errors internally
 */
export function sanitizeError(error: any, operationName: string): { userMessage: string; logMessage: string } {
    // Generic message for users
    let userMessage = `Error occurred while ${operationName}. Please try again later.`;
    
    // Detailed message for logging
    let logMessage = `${operationName} failed: ${error.message || 'Unknown error'}`;
    
    if (error.response) {
        // HTTP error responses
        const status = error.response.status;
        
        switch (status) {
            case 400:
                userMessage = 'Invalid request parameters provided.';
                break;
            case 401:
                userMessage = 'Authentication failed. Please check your Figma API token.';
                break;
            case 403:
                userMessage = 'Access denied. Insufficient permissions for this operation.';
                break;
            case 404:
                userMessage = 'Requested resource not found.';
                break;
            case 429:
                userMessage = 'Rate limit exceeded. Please wait before making more requests.';
                break;
            case 500:
            case 502:
            case 503:
            case 504:
                userMessage = 'Server error occurred. Please try again later.';
                break;
        }
        
        logMessage += ` (HTTP ${status})`;
        if (error.response.data) {
            logMessage += ` Response: ${JSON.stringify(error.response.data)}`;
        }
    }
    
    // Add stack trace to log message if available
    if (error.stack) {
        logMessage += `\nStack: ${error.stack}`;
    }
    
    return { userMessage, logMessage };
}

/**
 * Logs detailed error information securely
 */
export function logSecureError(error: any, context: string, additionalInfo?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        context,
        error: {
            message: error.message,
            name: error.name,
            stack: error.stack,
            ...(error.response && {
                response: {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data
                }
            })
        },
        ...(additionalInfo && { additionalInfo })
    };
    
    console.error('SECURITY_ERROR:', JSON.stringify(logEntry, null, 2));
}
