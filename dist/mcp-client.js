"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPClient = void 0;
const child_process_1 = require("child_process");
const logger_1 = require("./logger");
class MCPClient {
    constructor(serverParams) {
        this.serverParams = serverParams;
        this.process = null;
        this.stdin = null;
        this.stdout = null;
        this.initialized = false;
        this.messageQueue = [];
        this.nextMessageId = 1;
        this.availableTools = new Set();
    }
    async connect() {
        logger_1.logger.debug("[MCP Client] Starting connection...");
        try {
            const spawnOptions = {
                stdio: ['pipe', 'pipe', 'pipe']
            };
            if (this.serverParams.allowedDirectory) {
                spawnOptions.cwd = this.serverParams.allowedDirectory;
                logger_1.logger.debug(`[MCP Client] Using working directory: ${spawnOptions.cwd}`);
            }
            if (this.serverParams.env) {
                spawnOptions.env = {
                    ...process.env,
                    ...this.serverParams.env
                };
                logger_1.logger.debug(`[MCP Client] Environment variables set: ${Object.keys(this.serverParams.env).join(', ')}`);
            }
            logger_1.logger.debug(`[MCP Client] Spawning process: ${this.serverParams.command} ${this.serverParams.args?.join(' ')}`);
            this.process = (0, child_process_1.spawn)(this.serverParams.command, this.serverParams.args || [], spawnOptions);
            this.stdin = this.process.stdin;
            this.stdout = this.process.stdout;
            if (this.process.stderr) {
                this.process.stderr.on('data', (data) => {
                    logger_1.logger.error(`[MCP Client] Process stderr: ${data.toString()}`);
                });
            }
            this.process.on('error', (error) => {
                logger_1.logger.error(`[MCP Client] Process error: ${error.message}`);
            });
            this.process.on('exit', (code) => {
                logger_1.logger.info(`[MCP Client] Process exited with code ${code}`);
            });
            if (this.stdout) {
                this.stdout.on('data', (data) => {
                    logger_1.logger.debug(`[MCP Client] Received raw data: ${data.toString().trim()}`);
                    this.handleResponse(data);
                });
            }
            await this.initialize();
            await this.updateAvailableTools();
            logger_1.logger.debug("[MCP Client] Connected successfully");
        }
        catch (error) {
            logger_1.logger.error(`[MCP Client] Connection failed: ${error?.message || String(error)}`);
            throw error;
        }
    }
    async initialize() {
        if (!this.stdin || !this.stdout) {
            throw new Error("[MCP Client] Connection not established");
        }
        logger_1.logger.debug("[MCP Client] Initializing session...");
        const clientCapabilities = {
            tools: {
                call: true,
                list: true
            }
        };
        const clientInfo = {
            name: "MCPLLMBridge",
            version: "1.0.0"
        };
        const initMessage = {
            jsonrpc: "2.0",
            method: "initialize",
            params: {
                protocolVersion: "0.1.0",
                capabilities: clientCapabilities,
                clientInfo: clientInfo
            },
            id: this.nextMessageId++
        };
        try {
            const response = await this.sendMessage(initMessage);
            if (!response || typeof response.protocolVersion !== 'string') {
                throw new Error('[MCP Client] Invalid initialization response from server');
            }
            this.serverCapabilities = response.capabilities;
            this.serverVersion = response.serverInfo;
            this.initialized = true;
            await this.sendMessage({
                jsonrpc: "2.0",
                method: "notifications/initialized"
            });
            logger_1.logger.debug("[MCP Client] Session initialized");
            logger_1.logger.debug(`[MCP Client] Server version: ${JSON.stringify(this.serverVersion)}`);
            logger_1.logger.debug(`[MCP Client] Server capabilities: ${JSON.stringify(this.serverCapabilities)}`);
        }
        catch (error) {
            logger_1.logger.error(`[MCP Client] Session initialization failed: ${error?.message || String(error)}`);
            throw error;
        }
    }
    async updateAvailableTools() {
        try {
            const tools = await this.getAvailableTools();
            this.availableTools = new Set(tools.map(tool => tool.name));
            logger_1.logger.debug(`[MCP Client] Updated available tools: ${Array.from(this.availableTools).join(', ')}`);
        }
        catch (error) {
            logger_1.logger.error('[MCP Client] Failed to update available tools:', error);
        }
    }
    handleResponse(data) {
        const messages = data.toString().split('\n').filter(line => line.trim());
        for (const message of messages) {
            try {
                const response = JSON.parse(message);
                logger_1.logger.debug(`[MCP Client] Parsed message: ${JSON.stringify(response)}`);
                const pendingMessage = this.messageQueue.find(m => m.message.id === response.id);
                if (pendingMessage) {
                    if (response.error) {
                        logger_1.logger.error(`[MCP Client] Message error: ${response.error.message}`);
                        pendingMessage.reject(new Error(response.error.message));
                    }
                    else {
                        logger_1.logger.debug(`[MCP Client] Message success: ${JSON.stringify(response.result)}`);
                        pendingMessage.resolve(response.result);
                    }
                    this.messageQueue = this.messageQueue.filter(m => m.message.id !== response.id);
                }
            }
            catch (error) {
                logger_1.logger.error(`[MCP Client] Failed to parse response: ${error?.message || String(error)}`);
            }
        }
    }
    async sendMessage(message) {
        return new Promise((resolve, reject) => {
            if (!this.stdin || !this.stdout) {
                reject(new Error("[MCP Client] Connection not established"));
                return;
            }
            // Only add to message queue if it's a request (has an id)
            if (message.id !== undefined) {
                this.messageQueue.push({ resolve, reject, message });
            }
            const messageStr = JSON.stringify(message) + '\n';
            logger_1.logger.debug(`[MCP Client] Sending message: ${messageStr.trim()}`);
            this.stdin.write(messageStr, (error) => {
                if (error) {
                    logger_1.logger.error(`[MCP Client] Failed to send message: ${error.message}`);
                    reject(error);
                    return;
                }
                // If it's a notification (no id), resolve immediately
                if (message.id === undefined) {
                    resolve(undefined);
                }
            });
        });
    }
    async getAvailableTools() {
        if (!this.initialized) {
            throw new Error("[MCP Client] Client not initialized");
        }
        logger_1.logger.debug("[MCP Client] Requesting available tools");
        try {
            const message = {
                jsonrpc: "2.0",
                method: "tools/list",
                params: {},
                id: this.nextMessageId++
            };
            const response = await this.sendMessage(message);
            logger_1.logger.debug(`[MCP Client] Received tools: ${JSON.stringify(response)}`);
            return response.tools || [];
        }
        catch (error) {
            logger_1.logger.error(`[MCP Client] Failed to get tools: ${error?.message || String(error)}`);
            throw error;
        }
    }
    async callTool(toolName, toolArgs) {
        if (!this.initialized) {
            throw new Error("[MCP Client] Client not initialized");
        }
        logger_1.logger.debug(`[MCP Client] Calling tool '${toolName}' with args: ${JSON.stringify(toolArgs)}`);
        // Check if the tool exists
        if (!this.availableTools.has(toolName)) {
            logger_1.logger.error(`[MCP Client] Unknown tool '${toolName}'. Available tools: ${Array.from(this.availableTools).join(', ')}`);
        }
        try {
            const message = {
                jsonrpc: "2.0",
                method: "tools/call",
                params: {
                    name: toolName,
                    arguments: toolArgs
                },
                id: this.nextMessageId++
            };
            logger_1.logger.debug(`[MCP Client] Sending tool call request...`);
            const response = await this.sendMessage(message);
            logger_1.logger.debug(`[MCP Client] Tool call response: ${JSON.stringify(response)}`);
            return response;
        }
        catch (error) {
            logger_1.logger.error(`[MCP Client] Tool call failed: ${error?.message || String(error)}`);
            throw error;
        }
    }
    async close() {
        logger_1.logger.debug("[MCP Client] Closing connection...");
        if (this.process) {
            this.process.kill();
            this.process = null;
        }
        this.stdin = null;
        this.stdout = null;
        this.initialized = false;
        this.availableTools.clear();
        logger_1.logger.debug("[MCP Client] Connection closed");
    }
}
exports.MCPClient = MCPClient;
