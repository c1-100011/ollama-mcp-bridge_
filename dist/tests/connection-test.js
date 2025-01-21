"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testOllamaConnection = void 0;
const llm_client_1 = require("../llm-client");
const logger_1 = require("../logger");
async function testOllamaConnection(config) {
    logger_1.logger.info('Starting Ollama connection test...');
    const testClient = new llm_client_1.LLMClient(config);
    const testPrompt = 'Respond with exactly the word "connected" if you can read this message.';
    try {
        logger_1.logger.info('Testing basic connectivity to Ollama...');
        logger_1.logger.info(`Attempting to connect to ${config.baseUrl} with model ${config.model}`);
        const format = {
            type: "object",
            properties: {
                response: {
                    type: "string",
                    enum: ["connected"]
                }
            },
            required: ["response"]
        };
        // Format setting removed as it's handled internally by LLMClient
        const response = await testClient.invokeWithPrompt(testPrompt);
        if (!response || !response.content) {
            logger_1.logger.error('No response received from Ollama');
            return false;
        }
        logger_1.logger.info('Response content:', response.content);
        logger_1.logger.info('Connection test completed successfully');
        logger_1.logger.info(`Using model: ${config.model}`);
        logger_1.logger.info(`Base URL: ${config.baseUrl}`);
        return true;
    }
    catch (error) {
        logger_1.logger.error('Connection test failed with error');
        if (error?.message) {
            logger_1.logger.error(`Error details: ${error.message}`);
            if (error.cause) {
                logger_1.logger.error(`Error cause: ${error.cause}`);
            }
        }
        else {
            logger_1.logger.error(`Error details: ${String(error)}`);
        }
        return false;
    }
}
exports.testOllamaConnection = testOllamaConnection;
// Standalone test script
if (require.main === module) {
    const testConfig = {
        model: "qwen2.5-coder:7b-instruct",
        baseUrl: "http://127.0.0.1:11434",
        apiKey: "ollama",
        temperature: 0.7,
        maxTokens: 1000
    };
    testOllamaConnection(testConfig).then((success) => {
        if (success) {
            logger_1.logger.info('✅ Successfully connected to Ollama');
            process.exit(0);
        }
        else {
            logger_1.logger.error('❌ Failed to establish proper connection with Ollama');
            process.exit(1);
        }
    }).catch((error) => {
        logger_1.logger.error('❌ Test runner encountered an error');
        if (error?.message) {
            logger_1.logger.error(`Error details: ${error.message}`);
        }
        process.exit(1);
    });
}
