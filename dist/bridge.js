"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPLLMBridge = void 0;
const mcp_client_1 = require("./mcp-client");
const llm_client_1 = require("./llm-client");
const logger_1 = require("./logger");
const tool_registry_1 = require("./tool-registry");
const utils_1 = require("./utils");
class MCPLLMBridge {
    constructor(bridgeConfig) {
        this.bridgeConfig = bridgeConfig;
        this.mcpClients = {};
        this.toolToMcp = {};
        this.tools = [];
        this.config = bridgeConfig;
        // Primary MCP client
        this.mcpClients['primary'] = new mcp_client_1.MCPClient(bridgeConfig.mcpServer);
        this.llmClient = new llm_client_1.LLMClient(bridgeConfig.llmConfig);
        this.toolRegistry = new tool_registry_1.DynamicToolRegistry();
        // Initialize other MCP clients if available
        if (bridgeConfig.mcpServers) {
            Object.entries(bridgeConfig.mcpServers).forEach(([name, config]) => {
                if (name !== bridgeConfig.mcpServerName) { // Skip primary as it's already initialized
                    this.mcpClients[name] = new mcp_client_1.MCPClient(config);
                }
            });
        }
    }
    async initialize() {
        try {
            logger_1.logger.info('Starting Ollama server...');
            await this.llmClient.startOllamaServer();
            logger_1.logger.info('Connecting to MCP servers...');
            // Initialize all MCP clients
            for (const [name, client] of Object.entries(this.mcpClients)) {
                logger_1.logger.info(`Connecting to MCP: ${name}`);
                await client.connect();
                const mcpTools = await client.getAvailableTools();
                logger_1.logger.info(`Received ${mcpTools.length} tools from ${name}`);
                // Register tools and map them to this MCP
                mcpTools.forEach(tool => {
                    this.toolRegistry.registerTool(tool);
                    this.toolToMcp[tool.name] = client;
                    logger_1.logger.debug(`Registered tool ${tool.name} from ${name}`);
                });
                // Convert and add to tools list
                const convertedTools = this.convertMCPToolsToOpenAIFormat(mcpTools);
                this.tools.push(...convertedTools);
            }
            // Set tools in LLM client
            this.llmClient.tools = this.tools;
            this.llmClient.setToolRegistry(this.toolRegistry);
            logger_1.logger.info(`Initialized with ${this.tools.length} total tools`);
            logger_1.logger.debug('Available tools:', this.tools.map(t => t.function.name).join(', '));
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Bridge initialization failed: ${error?.message || String(error)}`);
            return false;
        }
    }
    convertMCPToolsToOpenAIFormat(mcpTools) {
        return mcpTools.map(tool => {
            const converted = {
                type: 'function',
                function: {
                    name: tool.name,
                    description: tool.description || `Use the ${tool.name} tool`,
                    parameters: {
                        type: "object",
                        properties: tool.inputSchema?.properties || {},
                        required: tool.inputSchema?.required || []
                    }
                }
            };
            logger_1.logger.debug(`Converted tool ${tool.name}:`, JSON.stringify(converted, null, 2));
            return converted;
        });
    }
    async processMessage(message) {
        try {
            const detectedTool = this.toolRegistry.detectToolFromPrompt(message);
            logger_1.logger.info(`Detected tool: ${detectedTool}`);
            if (detectedTool) {
                const instructions = this.toolRegistry.getToolInstructions(detectedTool);
                if (instructions) {
                    this.llmClient.systemPrompt = instructions;
                    logger_1.logger.debug('Using tool-specific instructions:', instructions);
                }
            }
            logger_1.logger.info('Sending message to LLM...');
            let response = await this.llmClient.invokeWithPrompt(message);
            logger_1.logger.info(`LLM response received, isToolCall: ${response.isToolCall}`);
            logger_1.logger.debug('Raw LLM response:', JSON.stringify(response, null, 2));
            while (response.isToolCall && response.toolCalls?.length) {
                logger_1.logger.info(`Processing ${response.toolCalls.length} tool calls`);
                const toolResponses = await this.handleToolCalls(response.toolCalls);
                logger_1.logger.info('Tool calls completed, sending results back to LLM');
                response = await this.llmClient.invoke(toolResponses);
            }
            // Format the response for user readability
            if (response.isToolCall) {
                const toolData = JSON.parse(response.content);
                return `I'll help you with that using ${toolData.name}. ${toolData.thoughts || ''}`;
            }
            else {
                try {
                    // Try to parse as JSON in case it's still in JSON format
                    const parsed = JSON.parse(response.content);
                    if (parsed.content) {
                        return parsed.content;
                    }
                    else if (parsed.thoughts) {
                        return parsed.thoughts;
                    }
                    else if (typeof parsed === 'string') {
                        return parsed;
                    }
                    else {
                        // If we have a complex object, stringify it nicely
                        return JSON.stringify(parsed, null, 2);
                    }
                }
                catch {
                    // If not JSON or parsing fails, return as is
                    return response.content;
                }
            }
        }
        catch (error) {
            const errorMsg = error?.message || String(error);
            logger_1.logger.error(`Error processing message: ${errorMsg}`);
            return `Error processing message: ${errorMsg}`;
        }
    }
    async handleToolCalls(toolCalls) {
        const toolResponses = [];
        for (const toolCall of toolCalls) {
            try {
                const requestedName = toolCall.function.name;
                logger_1.logger.debug(`[MCP] Looking up tool name: ${requestedName}`);
                // Get appropriate MCP client for this tool
                const mcpClient = this.toolToMcp[requestedName];
                if (!mcpClient) {
                    throw new Error(`No MCP found for tool: ${requestedName}`);
                }
                logger_1.logger.info(`[MCP] About to call MCP tool: ${requestedName}`);
                let toolArgs = JSON.parse(toolCall.function.arguments);
                // Normalize paths for filesystem operations
                if (requestedName === 'write_file' && toolArgs.path) {
                    toolArgs.path = (0, utils_1.normalizePath)(toolArgs.path);
                    logger_1.logger.info(`[MCP] Normalized file path: ${toolArgs.path}`);
                }
                logger_1.logger.info(`[MCP] Tool arguments prepared: ${JSON.stringify(toolArgs)}`);
                const mcpCallPromise = mcpClient.callTool(requestedName, toolArgs);
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('MCP call timed out after 30 seconds')), 30000);
                });
                logger_1.logger.info(`[MCP] Sending call to MCP...`);
                const result = await Promise.race([mcpCallPromise, timeoutPromise]);
                logger_1.logger.info(`[MCP] Received response from MCP`);
                logger_1.logger.debug(`[MCP] Tool result:`, result);
                toolResponses.push({
                    tool_call_id: toolCall.id,
                    output: typeof result === 'string' ? result : JSON.stringify(result)
                });
            }
            catch (error) {
                logger_1.logger.error(`[MCP] Tool execution failed with error:`, error);
                toolResponses.push({
                    tool_call_id: toolCall.id,
                    output: `Error: ${error?.message || String(error)}`
                });
            }
        }
        return toolResponses;
    }
    async setTools(tools) {
        this.tools = tools;
        this.llmClient.tools = tools;
        this.toolRegistry = new tool_registry_1.DynamicToolRegistry();
        tools.forEach(tool => {
            if (tool.function) {
                this.toolRegistry.registerTool({
                    name: tool.function.name,
                    description: tool.function.description,
                    inputSchema: tool.function.parameters
                });
            }
        });
    }
    async close() {
        try {
            // Shutdown Ollama server
            await this.llmClient.shutdown();
            // Close MCP clients
            for (const client of Object.values(this.mcpClients)) {
                await client.close();
            }
        }
        catch (error) {
            logger_1.logger.error('Error during bridge shutdown:', error);
            throw error;
        }
    }
}
exports.MCPLLMBridge = MCPLLMBridge;
