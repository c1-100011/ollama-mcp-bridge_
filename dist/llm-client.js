"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMClient = void 0;
const logger_1 = require("./logger");
const child_process_1 = require("child_process");
const util_1 = require("util");
const tool_schemas_1 = require("./types/tool-schemas");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class LLMClient {
    constructor(config) {
        this.toolRegistry = null;
        this.currentTool = null;
        this.tools = [];
        this.messages = [];
        this.systemPrompt = null;
        this.toolSchemas = tool_schemas_1.toolSchemas;
        this.ollamaProcess = null;
        this.isOllamaRunning = false;
        this.connectionRetries = 0;
        this.config = config;
        this.systemPrompt = config.systemPrompt || null;
        this.config.baseUrl = this.config.baseUrl.replace('localhost', '127.0.0.1');
        logger_1.logger.debug(`Initializing Ollama client with baseURL: ${this.config.baseUrl}`);
    }
    setToolRegistry(registry) {
        this.toolRegistry = registry;
        logger_1.logger.debug('Tool registry set with tools:', registry.getAllTools());
    }
    async listTools() {
        logger_1.logger.info('===== Available Tools =====');
        if (this.tools.length === 0) {
            logger_1.logger.info('No tools available');
            return;
        }
        for (const tool of this.tools) {
            logger_1.logger.info('\nTool Details:');
            logger_1.logger.info(`Name: ${tool.function.name}`);
            logger_1.logger.info(`Description: ${tool.function.description}`);
            if (tool.function.parameters) {
                logger_1.logger.info('Parameters:');
                logger_1.logger.info(JSON.stringify(tool.function.parameters, null, 2));
            }
            logger_1.logger.info('------------------------');
        }
        logger_1.logger.info(`Total tools available: ${this.tools.length}`);
    }
    async testConnection() {
        try {
            logger_1.logger.debug('Testing connection to Ollama...');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(`${this.config.baseUrl}/api/tags`, {
                method: 'GET',
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (response.ok) {
                const data = await response.json();
                logger_1.logger.debug('Ollama connection test successful:', data);
                return true;
            }
            else {
                logger_1.logger.error('Ollama connection test failed with status:', response.status);
                return false;
            }
        }
        catch (error) {
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    logger_1.logger.error('Ollama connection test timed out after 5 seconds');
                }
                else {
                    logger_1.logger.error('Ollama connection test failed with error:', error.message);
                }
            }
            return false;
        }
    }
    async startOllamaServer() {
        if (this.isOllamaRunning) {
            logger_1.logger.debug('Ollama server is already running');
            return;
        }
        try {
            // Clean up any existing instances first
            await this.cleanupOllama();
            logger_1.logger.debug('Starting new Ollama instance...');
            this.ollamaProcess = (0, child_process_1.exec)('ollama serve', { windowsHide: true });
            this.ollamaProcess.stdout?.on('data', (data) => {
                logger_1.logger.debug('Ollama stdout:', data.toString());
            });
            this.ollamaProcess.stderr?.on('data', (data) => {
                logger_1.logger.debug('Ollama stderr:', data.toString());
            });
            this.ollamaProcess.on('error', (error) => {
                logger_1.logger.error('Error in Ollama process:', error);
                this.isOllamaRunning = false;
            });
            this.ollamaProcess.on('exit', (code) => {
                logger_1.logger.info(`Ollama process exited with code ${code}`);
                this.isOllamaRunning = false;
            });
            this.ollamaProcess.unref();
            // Wait for server to be ready
            let connected = false;
            for (let i = 0; i < 10; i++) {
                logger_1.logger.debug(`Waiting for Ollama to start (attempt ${i + 1}/10)...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                if (await this.testConnection()) {
                    logger_1.logger.debug('Ollama is ready and responding');
                    connected = true;
                    this.isOllamaRunning = true;
                    break;
                }
            }
            if (!connected) {
                throw new Error('Failed to start Ollama after 10 attempts');
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to start Ollama server:', error);
            throw error;
        }
    }
    async shutdown() {
        await this.cleanupOllama();
    }
    async cleanupOllama() {
        try {
            logger_1.logger.debug('Starting Ollama cleanup process...');
            try {
                logger_1.logger.debug('Attempting to kill Ollama by process name...');
                const { stdout: killOutput } = await execAsync('taskkill /F /IM ollama.exe');
                logger_1.logger.debug('Taskkill output:', killOutput);
            }
            catch (e) {
                logger_1.logger.debug('No Ollama process found to kill');
            }
            try {
                logger_1.logger.debug('Checking for processes on port 11434...');
                const { stdout } = await execAsync('netstat -ano | findstr ":11434"');
                const pids = stdout.split('\n')
                    .map(line => line.trim().split(/\s+/).pop())
                    .filter(pid => pid && /^\d+$/.test(pid));
                for (const pid of pids) {
                    logger_1.logger.debug(`Killing process with PID ${pid}...`);
                    await execAsync(`taskkill /F /PID ${pid}`);
                }
            }
            catch (e) {
                logger_1.logger.debug('No processes found on port 11434');
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
            logger_1.logger.debug('Ollama cleanup process completed');
            this.isOllamaRunning = false;
        }
        catch (error) {
            logger_1.logger.error('Error during Ollama cleanup:', error);
            throw error;
        }
    }
    async restartOllamaIfNeeded() {
        if (!this.isOllamaRunning || !(await this.testConnection())) {
            logger_1.logger.info('Ollama server needs restart, attempting to restart...');
            this.connectionRetries++;
            if (this.connectionRetries > LLMClient.MAX_RETRIES) {
                throw new Error(`Failed to maintain Ollama connection after ${LLMClient.MAX_RETRIES} retries`);
            }
            await this.startOllamaServer();
        }
    }
    prepareMessages() {
        const formattedMessages = [];
        if (this.systemPrompt) {
            formattedMessages.push({
                role: 'system',
                content: this.systemPrompt
            });
        }
        formattedMessages.push(...this.messages);
        return formattedMessages;
    }
    async invokeWithPrompt(prompt) {
        await this.restartOllamaIfNeeded();
        // Detect tool using registry if available
        if (this.toolRegistry) {
            this.currentTool = this.toolRegistry.detectToolFromPrompt(prompt);
            logger_1.logger.debug(`Detected tool from registry: ${this.currentTool}`);
        }
        logger_1.logger.debug(`Preparing to send prompt: ${prompt}`);
        this.messages = [];
        // Add specific instruction for news-related queries
        if (prompt.toLowerCase().includes('news') || prompt.toLowerCase().includes('headlines')) {
            this.messages.push({
                role: 'system',
                content: `When asked about news or headlines, you must use the brave_web_search tool to get real-time information. Respond with a tool call in this format:
{
  "name": "brave_web_search",
  "arguments": {
    "query": "latest news headlines today"
  }
}`
            });
        }
        this.messages.push({
            role: 'user',
            content: prompt
        });
        return this.invoke([]);
    }
    async invoke(toolResults = []) {
        try {
            if (toolResults.length > 0) {
                for (const result of toolResults) {
                    // Format tool result for Ollama
                    const toolOutput = result.output;
                    let formattedContent = '';
                    try {
                        const parsedOutput = JSON.parse(toolOutput);
                        if (parsedOutput.content && Array.isArray(parsedOutput.content)) {
                            // Extract text content from MCP response
                            formattedContent = parsedOutput.content
                                .filter((item) => item.type === 'text')
                                .map((item) => item.text)
                                .join('\n');
                        }
                        else {
                            formattedContent = JSON.stringify(parsedOutput);
                        }
                    }
                    catch (e) {
                        // If not JSON, use as-is
                        formattedContent = String(toolOutput);
                    }
                    // Clean and format the tool result
                    let cleanContent = formattedContent
                        .replace(/<\/?strong>/g, '') // Remove HTML tags
                        .replace(/&#x27;/g, "'") // Fix HTML entities
                        .replace(/\n/g, ' ') // Convert newlines to spaces
                        .replace(/\s+/g, ' ') // Normalize spaces
                        .trim();
                    // Check for rate limit in the cleaned content
                    if (cleanContent.toLowerCase().includes('rate limit')) {
                        this.messages.push({
                            role: 'system',
                            content: `Return this exact JSON response:
{
  "response": "I apologize, but I've hit the rate limit for news searches. Please try again in a few minutes."
}`
                        });
                    }
                    else {
                        // Add tool result with clear context and formatting instructions
                        this.messages.push({
                            role: 'system',
                            content: `You are analyzing tool results and must respond in this exact JSON format:
{
  "response": "your natural language analysis here"
}

Here are the results to analyze: ${cleanContent}

Remember:
1. The response must be natural language, not raw data
2. Focus on key information and insights
3. Be clear and conversational
4. Do not include any JSON in the response text itself
5. Provide a complete analysis without asking follow-up questions`
                        });
                    }
                }
            }
            const messages = this.prepareMessages();
            const payload = {
                model: this.config.model,
                messages,
                stream: false,
                format: "json",
                options: {
                    temperature: this.config.temperature || 0,
                    num_predict: this.config.maxTokens || 1000
                }
            };
            // Log detected tool if any
            if (this.currentTool) {
                logger_1.logger.debug('Detected tool:', this.currentTool);
            }
            logger_1.logger.debug('Preparing Ollama request with payload:', JSON.stringify(payload, null, 2));
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
                logger_1.logger.error(`Request timed out after ${LLMClient.REQUEST_TIMEOUT / 1000} seconds`);
            }, LLMClient.REQUEST_TIMEOUT);
            logger_1.logger.debug('Sending request to Ollama...');
            const response = await fetch(`${this.config.baseUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                const errorText = await response.text();
                logger_1.logger.error('Ollama request failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorText
                });
                throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
            }
            logger_1.logger.debug('Response received from Ollama, parsing...');
            const completion = await response.json();
            logger_1.logger.debug('Parsed response:', completion);
            let isToolCall = false;
            let toolCalls = [];
            let content = completion.message.content;
            // Handle the response content
            try {
                // Try to parse as JSON to check for tool calls
                const parsedContent = JSON.parse(content);
                if (parsedContent.name && parsedContent.arguments) {
                    // This is a tool call
                    isToolCall = true;
                    toolCalls = [{
                            id: `call-${Date.now()}`,
                            function: {
                                name: parsedContent.name,
                                arguments: JSON.stringify(parsedContent.arguments)
                            }
                        }];
                    content = parsedContent.thoughts || "Using tool...";
                    logger_1.logger.debug('Parsed tool call:', { toolCalls });
                }
                else if (toolResults.length > 0) {
                    // For tool results, extract the response or format it properly
                    if (parsedContent.isError) {
                        content = JSON.stringify({
                            response: "I apologize, but I'm having trouble accessing the latest news. Please try again in a moment."
                        });
                    }
                    else if (parsedContent.response) {
                        content = parsedContent.response;
                    }
                    else if (typeof parsedContent === 'string') {
                        content = parsedContent;
                    }
                    else {
                        // If we have unstructured content, format it as a proper response
                        const responseText = Object.entries(parsedContent)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join('. ');
                        content = `Based on the search results: ${responseText}`;
                    }
                }
                else {
                    // Not a tool call, but still valid JSON
                    content = JSON.stringify(parsedContent);
                    logger_1.logger.debug('Parsed JSON response');
                }
            }
            catch (e) {
                // Not JSON, treat as plain text
                content = completion.message.content;
                logger_1.logger.debug('Using plain text response');
            }
            const result = {
                content: typeof content === 'string' ? content : JSON.stringify(content),
                isToolCall,
                toolCalls
            };
            // Add message with simplified format
            this.messages.push({
                role: 'assistant',
                content: result.content
            });
            return result;
        }
        catch (error) {
            if (error.name === 'AbortError') {
                logger_1.logger.error('Request aborted due to timeout');
                throw new Error(`Request timed out after ${LLMClient.REQUEST_TIMEOUT / 1000} seconds`);
            }
            // Handle connection errors by attempting restart
            if (error.message.includes('ECONNREFUSED') || error.message.includes('Failed to fetch')) {
                logger_1.logger.error('Connection error detected, attempting to restart Ollama...');
                await this.restartOllamaIfNeeded();
                throw error; // Still throw the error to allow retry at a higher level
            }
            logger_1.logger.error('LLM invocation failed:', error);
            throw error;
        }
    }
}
exports.LLMClient = LLMClient;
LLMClient.REQUEST_TIMEOUT = 300000; // 5 minutes
LLMClient.MAX_RETRIES = 3;
