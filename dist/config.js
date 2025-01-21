"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadBridgeConfig = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const logger_1 = require("./logger");
const DEFAULT_CONFIG = {
    mcpServers: {
        filesystem: {
            command: process.platform === 'win32'
                ? 'C:\\Program Files\\nodejs\\node.exe'
                : 'node',
            args: [
                path_1.default.join(os_1.default.homedir(), 'node_modules', '@modelcontextprotocol', 'server-filesystem', 'dist', 'index.js'),
                path_1.default.join(os_1.default.homedir(), 'bridgeworkspace')
            ],
            allowedDirectory: path_1.default.join(os_1.default.homedir(), 'bridgeworkspace')
        }
    },
    llm: {
        model: "qwen2.5-coder:7b-instruct",
        baseUrl: "http://192.168.86.100:11434",
        apiKey: "ollama",
        temperature: 0.7,
        maxTokens: 1000
    },
    systemPrompt: `You are a helpful assistant with access to various tools. You must always respond in JSON format:

1. When you need to use a tool, respond with:
{
  "name": "tool_name",
  "arguments": {
    "param1": "value1"
  }
}

2. When providing information or analysis, respond with:
{
  "response": "your natural language response here"
}

Your responses in the "response" field should be clear, informative, and conversational. Never include raw JSON or technical formatting in the response text itself.`
};
async function loadBridgeConfig() {
    // Change to look for config in the project directory
    const projectDir = path_1.default.resolve(__dirname, '..');
    const configPath = path_1.default.join(projectDir, 'bridge_config.json');
    try {
        const configData = await promises_1.default.readFile(configPath, 'utf-8');
        const config = JSON.parse(configData);
        logger_1.logger.info(`Loaded bridge configuration from ${configPath}`);
        // Create deep merged config, ensuring llm is not undefined
        const mergedConfig = {
            mcpServers: {
                ...DEFAULT_CONFIG.mcpServers,
                ...config.mcpServers
            },
            llm: config.llm ?? DEFAULT_CONFIG.llm,
            systemPrompt: config.systemPrompt ?? DEFAULT_CONFIG.systemPrompt
        };
        // Log the final model being used
        logger_1.logger.debug(`Using LLM model: ${mergedConfig.llm.model}`);
        return mergedConfig;
    }
    catch (error) {
        logger_1.logger.warn(`Could not load bridge_config.json from ${configPath}, using defaults`);
        return DEFAULT_CONFIG;
    }
}
exports.loadBridgeConfig = loadBridgeConfig;
