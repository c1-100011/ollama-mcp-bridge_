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

describe('Brave Search MCP Tests', () => {
  let ollamaProcess: ChildProcess | null = null;

  beforeEach(async () => {
    await killOllama();
    await new Promise(resolve => setTimeout(resolve, 3000));
  }, HOOK_TIMEOUT);

  afterEach(async () => {
    await cleanupProcess(ollamaProcess);
    ollamaProcess = null;
  }, HOOK_TIMEOUT);

  it('should handle web search request with single result', async () => {
    ollamaProcess = await startOllama();
    
    const payload = {
      model: MODEL_NAME,
      messages: [
        {
          role: 'system',
          content: 'Format: {"tool_name":"brave_web_search","tool_args":{"query":"SEARCH_QUERY","count":1}}'
        },
        {
          role: 'user',
          content: 'search for latest developments in AI'
        }
      ],
      stream: false,
      options: { temperature: 0.1, num_predict: 100 }
    };

    const result = await makeOllamaRequest(payload);
    const parsed = parseToolResponse(result);
    expect(parsed.tool_name).toBe('brave_web_search');
    expect(parsed.tool_args).toBeDefined();
    expect(parsed.tool_args.query).toBeDefined();
    expect(parsed.tool_args.count).toBe(1);
  }, TEST_TIMEOUT);
});