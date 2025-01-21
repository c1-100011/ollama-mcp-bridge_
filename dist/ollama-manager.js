"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetOllama = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const logger_1 = require("./logger");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function resetOllama() {
    try {
        // Find all Ollama processes
        const { stdout: processStdout } = await execAsync('wmic process where "name like \'%ollama%\'" get processid');
        const ollamaPids = processStdout.split('\n')
            .map(line => line.trim())
            .filter(line => /^\d+$/.test(line));
        // Find processes using port 11434
        const { stdout: portStdout } = await execAsync('netstat -ano | findstr ":11434"');
        const portPids = portStdout.split('\n')
            .map(line => line.trim().split(/\s+/).pop())
            .filter(pid => pid && /^\d+$/.test(pid));
        // Kill all found processes
        const allPids = [...new Set([...ollamaPids, ...portPids])];
        for (const pid of allPids) {
            try {
                await execAsync(`taskkill /F /PID ${pid}`);
                logger_1.logger.debug(`Killed process ${pid}`);
            }
            catch (error) {
                logger_1.logger.debug(`Failed to kill process ${pid}`);
            }
        }
        // Wait for processes to terminate
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Start Ollama server
        const ollamaProcess = (0, child_process_1.exec)('ollama serve', {
            windowsHide: true
        });
        ollamaProcess.stderr?.on('data', (data) => {
            logger_1.logger.debug('Ollama stderr:', data.toString());
        });
        ollamaProcess.unref();
        // Wait for server to be ready
        for (let i = 0; i < 10; i++) {
            try {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const response = await fetch('http://127.0.0.1:11434/api/tags');
                if (response.ok) {
                    logger_1.logger.info('Ollama server is ready');
                    return true;
                }
            }
            catch (error) {
                logger_1.logger.debug(`Waiting for Ollama server... attempt ${i + 1}`);
            }
        }
        throw new Error('Failed to start Ollama server');
    }
    catch (error) {
        logger_1.logger.error('Failed to reset Ollama:', error);
        return false;
    }
}
exports.resetOllama = resetOllama;
// Can be run directly to reset Ollama
if (require.main === module) {
    resetOllama().then(success => {
        if (success) {
            logger_1.logger.info('Successfully reset Ollama');
            process.exit(0);
        }
        else {
            logger_1.logger.error('Failed to reset Ollama');
            process.exit(1);
        }
    });
}
