import { Api } from "./Api.js";
import { AxiosRequestConfig } from "axios";
import axiosRetry from "axios-retry";
import { validateFigmaToken } from "../security/validators.js";

let figmaToken = process.env.FIGMA_TOKEN ?? "";
const requestConfig: AxiosRequestConfig = {
    baseURL: process.env.API_URL ?? "https://api.figma.com",
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 second timeout
};

const apiClientInstance = new Api(requestConfig);

// Configure axios-retry with better retry logic
axiosRetry(apiClientInstance.instance, {
    retries: 3,
    retryDelay: (retryCount) => {
        return Math.pow(2, retryCount) * 1000; // Exponential back-off delay between retries
    },
    retryCondition: (error) => {
        // Retry on network errors or 5xx responses, but not on auth errors
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
               (error.response?.status !== undefined && error.response.status >= 500 && error.response.status !== 501);
    },
});

apiClientInstance.instance.interceptors.request.use((request) => {
    if (!figmaToken) {
        throw new Error('Figma API token is required but not set');
    }
    request.headers['X-Figma-Token'] = figmaToken;
    return request;
});

// Add response interceptor for better error handling
apiClientInstance.instance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Don't log the full error which might contain sensitive data
        if (error.response?.status === 401) {
            throw new Error('Authentication failed - invalid or expired Figma API token');
        }
        if (error.response?.status === 403) {
            throw new Error('Access forbidden - insufficient permissions');
        }
        if (error.response?.status === 429) {
            throw new Error('Rate limit exceeded - please wait before making more requests');
        }
        throw error;
    }
);

export function setFigmaToken(token: string) {
    // Validate token format before setting
    figmaToken = validateFigmaToken(token);
}

export default apiClientInstance;
