import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ChildProcess } from 'child_process';
import { 
  killOllama, 
  startOllama, 
  makeOllamaRequest,
  parseToolResponse,
  cleanupProcess,
  TEST_TIMEOUT,
  HOOK_TIMEOUT,
  MODEL_NAME
} from './test-utils';

describe('Memory MCP Tests', () => {
  let ollamaProcess: ChildProcess | null = null;

  beforeEach(async () => {
    await killOllama();
    // Wait longer to ensure memory is freed
    await new Promise(resolve => setTimeout(resolve, 10000));
  }, HOOK_TIMEOUT);

  afterEach(async () => {
    await cleanupProcess(ollamaProcess);
    ollamaProcess = null;
    // Extra wait after cleanup
    await new Promise(resolve => setTimeout(resolve, 5000));
  }, HOOK_TIMEOUT);

  it('should handle memory operations', async () => {
    ollamaProcess = await startOllama();
    
    // Test storing a value
    const storePayload = {
      model: MODEL_NAME,
      messages: [
        {
          role: 'system',
          content: 'Format: {"tool_name":"store_memory","tool_args":{"key":"KEY_NAME","value":"VALUE_TO_STORE"}}'
        },
        {
          role: 'user',
          content: 'remember that my favorite color is blue'
        }
      ],
      stream: false,
      options: { temperature: 0.1, num_predict: 100 }
    };

    console.log('Testing store memory...');
    const storeResult = await makeOllamaRequest(storePayload);
    const storeParsed = parseToolResponse(storeResult);
    
    expect(storeParsed.tool_name).toBe('store_memory');
    expect(storeParsed.tool_args).toBeDefined();
    expect(storeParsed.tool_args.key).toBeDefined();
    expect(storeParsed.tool_args.value).toBeDefined();
    
    console.log('Store memory response:', storeParsed);

    // Wait before next operation
    await new Promise(resolve => setTimeout(resolve, 5000));
  }, TEST_TIMEOUT);
});