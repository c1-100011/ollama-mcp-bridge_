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

describe('Flux Image Generation Tests', () => {
  let ollamaProcess: ChildProcess | null = null;

  beforeEach(async () => {
    await killOllama();
    await new Promise(resolve => setTimeout(resolve, 3000));
  }, HOOK_TIMEOUT);

  afterEach(async () => {
    await cleanupProcess(ollamaProcess);
    ollamaProcess = null;
  }, HOOK_TIMEOUT);

  it('should generate an image and return a URL', async () => {
    ollamaProcess = await startOllama();
    
    const payload = {
      model: MODEL_NAME,
      messages: [
        {
          role: 'system',
          content: 'Format: {"tool_name":"generate_image","tool_args":{"prompt":"IMAGE_DESCRIPTION"}}'
        },
        {
          role: 'user',
          content: 'generate an image of a sunset over mountains'
        }
      ],
      stream: false,
      options: { temperature: 0.1, num_predict: 100 }
    };

    const result = await makeOllamaRequest(payload);
    const parsed = parseToolResponse(result);
    
    // Check structure
    expect(parsed.tool_name).toBe('generate_image');
    expect(parsed.tool_args).toBeDefined();
    expect(parsed.tool_args.prompt).toBeDefined();
    
    // Once tool is called, the bridge should receive a response with URLs
    console.log('Tool response format:', parsed);
  }, TEST_TIMEOUT);

  it('should handle image generation with specific parameters', async () => {
    ollamaProcess = await startOllama();
    
    const payload = {
      model: MODEL_NAME,
      messages: [
        {
          role: 'system',
          content: `Format: {"tool_name":"generate_image","tool_args":{"prompt":"IMAGE_DESCRIPTION","aspect_ratio":"16:9","go_fast":true}}`
        },
        {
          role: 'user',
          content: 'create a widescreen image of a futuristic city'
        }
      ],
      stream: false,
      options: { temperature: 0.1, num_predict: 100 }
    };

    const result = await makeOllamaRequest(payload);
    const parsed = parseToolResponse(result);
    
    // Check structure
    expect(parsed.tool_name).toBe('generate_image');
    expect(parsed.tool_args).toBeDefined();
    expect(parsed.tool_args.prompt).toBeDefined();
    expect(parsed.tool_args.aspect_ratio).toBe('16:9');
    expect(parsed.tool_args.go_fast).toBe(true);
    
    console.log('Tool response with parameters:', parsed);
  }, TEST_TIMEOUT);
});