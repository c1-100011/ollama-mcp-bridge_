import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { logger } from './logger';
import { ServerParameters } from './types';

export interface BridgeConfigFile {
  mcpServers: {
    [key: string]: ServerParameters;
  };
  llm?: {
    model: string;
    baseUrl: string;
    apiKey?: string;
    temperature?: number;
    maxTokens?: number;
  };
  systemPrompt?: string;
}

const DEFAULT_CONFIG: BridgeConfigFile = {
  mcpServers: {
    filesystem: {
      command: process.platform === 'win32' 
        ? 'C:\\Program Files\\nodejs\\node.exe'
        : 'node',
      args: [
        path.join(os.homedir(), 'node_modules', '@modelcontextprotocol', 'server-filesystem', 'dist', 'index.js'),
        path.join(os.homedir(), 'bridgeworkspace')
      ],
      allowedDirectory: path.join(os.homedir(), 'bridgeworkspace')
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

export async function loadBridgeConfig(): Promise<BridgeConfigFile> {
  // Change to look for config in the project directory
  const projectDir = path.resolve(__dirname, '..');
  const configPath = path.join(projectDir, 'bridge_config.json');
  
  try {
    const configData = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configData);
    logger.info(`Loaded bridge configuration from ${configPath}`);

    // Create deep merged config, ensuring llm is not undefined
    const mergedConfig: Required<BridgeConfigFile> = {
      mcpServers: {
        ...DEFAULT_CONFIG.mcpServers,
        ...config.mcpServers
      },
      llm: config.llm ?? DEFAULT_CONFIG.llm!, // Use entire llm config from user if provided
      systemPrompt: config.systemPrompt ?? DEFAULT_CONFIG.systemPrompt!
    };

    // Log the final model being used
    logger.debug(`Using LLM model: ${mergedConfig.llm.model}`);
    
    return mergedConfig;
  } catch (error: any) {
    logger.warn(`Could not load bridge_config.json from ${configPath}, using defaults`);
    return DEFAULT_CONFIG;
  }
}
