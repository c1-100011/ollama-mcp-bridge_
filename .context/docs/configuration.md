# Configuration System

## Overview
The Ollama MCP Bridge uses a JSON-based configuration system that allows flexible setup of LLM parameters and MCP server connections. The primary configuration file is `bridge_config.json`.

## Configuration Structure

### LLM Configuration
```json
"llm": {
  "model": "qwen2.5-coder:7b-instruct",  // Ollama model to use
  "baseUrl": "http://192.168.86.100:11434",  // Ollama server URL
  "apiKey": "ollama",  // API key if required
  "temperature": 0.1,  // Response randomness (0-1)
  "maxTokens": 1000  // Maximum response length
}
```

### MCP Server Configuration
Each MCP server entry follows this structure:
```json
"serverName": {
  "command": "node",  // Command to start the server
  "args": [...],  // Array of command arguments
  "env": {},  // Optional environment variables
  "disabled": false,  // Optional server disable flag
  "alwaysAllow": []  // Optional array of always-allowed operations
}
```

### Special Configurations

#### Filesystem Server
Requires additional security parameters:
```json
"filesystem": {
  "command": "node",
  "args": [
    "path/to/server",
    "allowed/directory1",
    "allowed/directory2"
  ],
  "allowedDirectory": "base/allowed/path"
}
```

#### Authentication-Required Servers
Servers like GitHub require authentication tokens:
```json
"github": {
  "command": "node",
  "args": ["path/to/server"],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token-here"
  }
}
```

## Environment Variables
- Server-specific tokens and keys should be provided via environment variables
- Sensitive information should not be committed to version control
- Use .env files for local development

## Configuration Best Practices

### Security
1. Always use allowedDirectory for filesystem access
2. Keep authentication tokens secure
3. Disable unused servers
4. Validate server paths

### Performance
1. Set appropriate maxTokens for your use case
2. Adjust temperature based on needed creativity
3. Use local LLM server when possible

### Maintenance
1. Keep server paths updated
2. Monitor server logs
3. Regular security audits
4. Version control configuration templates

## Troubleshooting

### Common Issues
1. Server Path Issues
   - Verify file paths exist
   - Check file permissions
   - Ensure correct path separators for OS

2. Authentication Errors
   - Verify environment variables
   - Check token validity
   - Confirm API key permissions

3. Connection Issues
   - Verify LLM server is running
   - Check network connectivity
   - Confirm port availability

### Configuration Validation
Before deploying changes:
1. Validate JSON syntax
2. Test server connections
3. Verify environment variables
4. Check file paths
5. Test with minimal configuration
