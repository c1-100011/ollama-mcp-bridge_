import { describe, it, expect, beforeEach, afterEach, afterAll } from '@jest/globals';
import { ChildProcess } from 'child_process';
import { 
  killOllama, 
  startOllama, 
  makeOllamaRequest,
  parseToolResponse,
  TEST_TIMEOUT,
  HOOK_TIMEOUT,
  MODEL_NAME
} from './test-utils';

describe('Filesystem MCP Tests', () => {
  let ollamaProcess: ChildProcess | null = null;

  beforeEach(async () => {
    await killOllama();
    await new Promise(resolve => setTimeout(resolve, 3000));
  }, HOOK_TIMEOUT);

  afterEach(async () => {
    if (ollamaProcess) {
      console.log('Cleaning up Ollama process...');
      ollamaProcess.kill();
      ollamaProcess = null;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }, HOOK_TIMEOUT);

  it('should handle write_file request', async () => {
    ollamaProcess = await startOllama();
    
    const payload = {
      model: MODEL_NAME,
      messages: [
        {
          role: 'system',
          content: 'Format: {"tool_name":"write_file","tool_args":{"path":"NAME","content":"CONTENT"}}'
        },
        {
          role: 'user',
          content: 'create test.txt containing hello world'
        }
      ],
      stream: false,
      options: { temperature: 0.1, num_predict: 100 }
    };

    const result = await makeOllamaRequest(payload);
    const parsed = parseToolResponse(result);
    expect(parsed.tool_name).toBe('write_file');
    expect(parsed.tool_args).toBeDefined();
    expect(parsed.tool_args.path).toBeDefined();
    expect(parsed.tool_args.content).toBeDefined();
  }, TEST_TIMEOUT);

  // Add more filesystem-specific tests here

  afterAll(async () => {
    await killOllama();
  }, HOOK_TIMEOUT);
});