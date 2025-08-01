# Security Checklist for MCP Figma Server

## Pre-deployment Security Checks

### ✅ Authentication & Authorization
- [ ] Figma API token is set via environment variable only (`FIGMA_API_KEY`)
- [ ] No command-line token passing enabled
- [ ] Token format is validated before use
- [ ] Access is restricted to necessary Figma resources only

### ✅ Input Validation
- [ ] All file keys are validated with regex patterns
- [ ] Node IDs are validated and sanitized
- [ ] Team IDs and project IDs are validated as numeric
- [ ] Comment text is sanitized to prevent injection
- [ ] Webhook URLs are validated and restricted to HTTPS
- [ ] Emoji inputs are validated

### ✅ Network Security
- [ ] All API communications use HTTPS
- [ ] Request timeouts are configured (30 seconds)
- [ ] Retry logic with exponential backoff implemented
- [ ] Webhook endpoints are validated (localhost allowed for VM use)

### ✅ Error Handling
- [ ] Generic error messages returned to users
- [ ] Detailed errors logged securely for debugging
- [ ] No sensitive information leaked in error responses
- [ ] HTTP status codes handled appropriately

### ✅ Rate Limiting
- [ ] Rate limiting enabled (100 requests/minute default)
- [ ] Rate limits are configurable
- [ ] Rate limit exceeded responses are handled gracefully

### ✅ Container Security (if using Docker)
- [ ] Non-root user configured in container
- [ ] Minimal Alpine Linux base image used
- [ ] No unnecessary ports exposed
- [ ] Dependencies scanned for vulnerabilities
- [ ] Container runs with least privileges

### ✅ Environment Security (VM Deployment)
- [ ] MCP server binds to localhost only (127.0.0.1)
- [ ] Environment variables are properly secured
- [ ] File permissions restrict access to configuration files
- [ ] System packages are up to date
- [ ] SSH access is properly configured and restricted

## Post-deployment Monitoring

### Regular Security Tasks
- [ ] Monitor API usage and rate limiting effectiveness
- [ ] Review error logs for suspicious activity
- [ ] Update dependencies regularly (`npm audit`)
- [ ] Rotate Figma API tokens periodically
- [ ] Monitor for failed authentication attempts
- [ ] Validate webhook endpoint security

### Incident Response
- [ ] Document process for handling security incidents
- [ ] Plan for token revocation and rotation
- [ ] Establish monitoring and alerting for anomalous activity
- [ ] Regular security reviews and updates

## Development Security

### Code Security
- [ ] All user inputs validated and sanitized
- [ ] No secrets in source code or logs
- [ ] Security utilities used consistently
- [ ] TypeScript strict mode enabled
- [ ] Comprehensive error handling implemented

### Testing
- [ ] Security validation functions tested
- [ ] Rate limiting functionality tested
- [ ] Error handling scenarios tested
- [ ] Input validation edge cases tested
