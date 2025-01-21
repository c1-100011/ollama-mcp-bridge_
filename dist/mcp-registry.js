"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPRegistry = void 0;
const logger_1 = require("./logger");
class MCPRegistry {
    constructor() {
        this.mcps = new Map();
    }
    registerMCP(name, definition) {
        this.mcps.set(name, definition);
        logger_1.logger.info(`Registered MCP: ${name}`);
    }
    getMCP(name) {
        return this.mcps.get(name);
    }
    convertToolToOpenAI(mcpTool) {
        logger_1.logger.debug(`Converting MCP tool to OpenAI format: ${mcpTool.name}`);
        return {
            type: 'function',
            function: {
                name: this.sanitizeToolName(mcpTool.name),
                description: mcpTool.description,
                parameters: mcpTool.inputSchema
            }
        };
    }
    convertResponseToOpenAI(mcpResponse) {
        // Handle different types of MCP responses
        if (typeof mcpResponse === 'string') {
            return { content: mcpResponse };
        }
        // Handle tool-specific responses
        if (mcpResponse.content && Array.isArray(mcpResponse.content)) {
            const content = mcpResponse.content
                .map((item) => {
                if (item.type === 'text')
                    return item.text;
                if (item.type === 'image')
                    return `[Image: ${item.url}]`;
                return JSON.stringify(item);
            })
                .join('\n');
            return { content };
        }
        // Default to stringifying the response
        return { content: JSON.stringify(mcpResponse) };
    }
    sanitizeToolName(name) {
        return name.replace(/[-\s]/g, '_').toLowerCase();
    }
    // Load MCPs from a configuration object
    loadFromConfig(config) {
        for (const [name, definition] of Object.entries(config.mcpServers)) {
            this.registerMCP(name, definition);
        }
        logger_1.logger.info(`Loaded ${this.mcps.size} MCPs from config`);
    }
    // List all registered MCPs
    listMCPs() {
        return Array.from(this.mcps.keys());
    }
    // Get default parameters for specific tool types
    getDefaultParams(toolName) {
        const defaults = {
            'generate_image': {
                megapixels: "1",
                aspect_ratio: "1:1"
            },
            // Add more tool-specific defaults as needed
        };
        return defaults[toolName] || {};
    }
    // Add tool-specific parameter validation
    validateToolParams(toolName, params) {
        const defaults = this.getDefaultParams(toolName);
        const validated = { ...defaults, ...params };
        // Tool-specific validation rules
        switch (toolName) {
            case 'generate_image':
                if (!['1', '0.25'].includes(validated.megapixels)) {
                    validated.megapixels = '1';
                }
                break;
            // Add more tool-specific validation as needed
        }
        return validated;
    }
}
exports.MCPRegistry = MCPRegistry;
