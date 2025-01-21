import readline from 'readline';
import { MCPLLMBridge } from './bridge';
import { loadBridgeConfig } from './config';
import { logger } from './logger';
import { exec } from 'child_process';
import { BridgeConfig } from './types';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function forceExit(bridge?: MCPLLMBridge) {
  logger.info('Force exiting...');
  
  if (bridge) {
    try {
      await bridge.close();
    } catch (e) {
      logger.error('Error during bridge shutdown:', e);
    }
  }

  process.exit(0);
}

// Store bridge instance for cleanup
let activeBridge: MCPLLMBridge | undefined;

async function main() {
  try {
    logger.info('Starting main.ts...');
    const configFile = await loadBridgeConfig();

    // Create bridge config with all MCPs
    const bridgeConfig: BridgeConfig = {
      mcpServer: configFile.mcpServers.filesystem,  // Primary MCP
      mcpServerName: 'filesystem',
      mcpServers: configFile.mcpServers,           // All MCPs including Flux
      llmConfig: configFile.llm!,
      systemPrompt: configFile.systemPrompt
    };

    logger.info('Initializing bridge with MCPs:', Object.keys(configFile.mcpServers).join(', '));
    activeBridge = new MCPLLMBridge(bridgeConfig);
    const initialized = await activeBridge.initialize();

    if (!initialized) {
      throw new Error('Failed to initialize bridge');
    }

    logger.info('Available commands:');
    logger.info('  list-tools: Show all available tools and their parameters');
    logger.info('  quit: Exit the program');
    logger.info('  Any other input will be sent to the LLM');

    let isClosing = false;

    while (!isClosing) {
      try {
        const userInput = await question("\nEnter your prompt (or 'list-tools' or 'quit'): ");
        
        if (userInput.toLowerCase() === 'quit') {
          isClosing = true;
          await activeBridge.close();
          rl.close();
          forceExit(activeBridge);
          break;
        }

        if (userInput.toLowerCase() === 'list-tools') {
          await activeBridge.llmClient.listTools();
          continue;
        }

        logger.info('Processing user input...');
        const response = await activeBridge.processMessage(userInput);
        logger.info('Received response from bridge');
        console.log(`\nResponse: ${response}`);
      } catch (error: any) {
        logger.error(`Error occurred: ${error?.message || String(error)}`);
      }
    }
  } catch (error: any) {
    logger.error(`Fatal error: ${error?.message || String(error)}`);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  logger.info('Received SIGINT...');
  await forceExit(activeBridge);
});

process.on('exit', () => {
  logger.info('Exiting process...');
});

if (require.main === module) {
  main().then(
    () => {
      logger.info('Main completed successfully');
    },
    async (error) => {
      logger.error(`Unhandled error: ${error?.message || String(error)}`);
      await forceExit(activeBridge);
    }
  );
}

export { main };
