"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
const readline_1 = __importDefault(require("readline"));
const bridge_1 = require("./bridge");
const config_1 = require("./config");
const logger_1 = require("./logger");
const rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout
});
async function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}
async function forceExit(bridge) {
    logger_1.logger.info('Force exiting...');
    if (bridge) {
        try {
            await bridge.close();
        }
        catch (e) {
            logger_1.logger.error('Error during bridge shutdown:', e);
        }
    }
    process.exit(0);
}
// Store bridge instance for cleanup
let activeBridge;
async function main() {
    try {
        logger_1.logger.info('Starting main.ts...');
        const configFile = await (0, config_1.loadBridgeConfig)();
        // Create bridge config with all MCPs
        const bridgeConfig = {
            mcpServer: configFile.mcpServers.filesystem,
            mcpServerName: 'filesystem',
            mcpServers: configFile.mcpServers,
            llmConfig: configFile.llm,
            systemPrompt: configFile.systemPrompt
        };
        logger_1.logger.info('Initializing bridge with MCPs:', Object.keys(configFile.mcpServers).join(', '));
        activeBridge = new bridge_1.MCPLLMBridge(bridgeConfig);
        const initialized = await activeBridge.initialize();
        if (!initialized) {
            throw new Error('Failed to initialize bridge');
        }
        logger_1.logger.info('Available commands:');
        logger_1.logger.info('  list-tools: Show all available tools and their parameters');
        logger_1.logger.info('  quit: Exit the program');
        logger_1.logger.info('  Any other input will be sent to the LLM');
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
                logger_1.logger.info('Processing user input...');
                const response = await activeBridge.processMessage(userInput);
                logger_1.logger.info('Received response from bridge');
                console.log(`\nResponse: ${response}`);
            }
            catch (error) {
                logger_1.logger.error(`Error occurred: ${error?.message || String(error)}`);
            }
        }
    }
    catch (error) {
        logger_1.logger.error(`Fatal error: ${error?.message || String(error)}`);
        process.exit(1);
    }
}
exports.main = main;
process.on('SIGINT', async () => {
    logger_1.logger.info('Received SIGINT...');
    await forceExit(activeBridge);
});
process.on('exit', () => {
    logger_1.logger.info('Exiting process...');
});
if (require.main === module) {
    main().then(() => {
        logger_1.logger.info('Main completed successfully');
    }, async (error) => {
        logger_1.logger.error(`Unhandled error: ${error?.message || String(error)}`);
        await forceExit(activeBridge);
    });
}
