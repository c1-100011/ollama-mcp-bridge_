import { ChildProcess } from 'child_process';
import { 
  killOllama, 
  startOllama, 
  makeOllamaRequest, 
  parseToolResponse, 
  cleanupProcess,
  MODEL_NAME,
  TEST_TIMEOUT,
  HOOK_TIMEOUT,
  TOOL_FORMATS
} from './test-utils';

describe('Gmail & Drive MCP Tests', () => {
  let ollamaProcess: ChildProcess | null = null;

  beforeEach(async () => {
    await killOllama();
    await new Promise(resolve => setTimeout(resolve, 3000));
  }, HOOK_TIMEOUT);

  afterEach(async () => {
    if (ollamaProcess) {
      await cleanupProcess(ollamaProcess);
    }
  }, HOOK_TIMEOUT);

  it('should search Gmail messages', async () => {
    ollamaProcess = await startOllama();

    const payload = {
      model: MODEL_NAME,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant. When searching emails, respond with a tool call in the exact format specified.'
        },
        {
          role: 'user',
          content: 'Find the last 10 emails about "testing"'
        }
      ],
      stream: false
    };

    const result = await makeOllamaRequest(payload, TOOL_FORMATS.search_email);
    const parsed = parseToolResponse(result);
    
    expect(parsed.name).toBe('search_email');
    expect(parsed.arguments).toHaveProperty('query');
    expect(typeof parsed.arguments.query).toBe('string');
  }, TEST_TIMEOUT);

  it('should search Drive files', async () => {
    ollamaProcess = await startOllama();

    const payload = {
      model: MODEL_NAME,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant. When searching Drive files, respond with a tool call in the exact format specified.'
        },
        {
          role: 'user',
          content: 'Find the most recent document about "project specs"'
        }
      ],
      stream: false
    };

    const result = await makeOllamaRequest(payload, TOOL_FORMATS.search_drive);
    const parsed = parseToolResponse(result);
    
    expect(parsed.name).toBe('search_drive');
    expect(parsed.arguments).toHaveProperty('query');
    expect(typeof parsed.arguments.query).toBe('string');
  }, TEST_TIMEOUT);

  it('should create new Drive folders', async () => {
    ollamaProcess = await startOllama();

    const payload = {
      model: MODEL_NAME,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant. When creating folders in Drive, respond with a tool call in the exact format specified.'
        },
        {
          role: 'user',
          content: 'Create a new folder called "Test Project"'
        }
      ],
      stream: false
    };

    const result = await makeOllamaRequest(payload, TOOL_FORMATS.create_folder);
    const parsed = parseToolResponse(result);
    
    expect(parsed.name).toBe('create_folder');
    expect(parsed.arguments).toHaveProperty('name');
    expect(typeof parsed.arguments.name).toBe('string');
  }, TEST_TIMEOUT);

  it('should send emails', async () => {
    ollamaProcess = await startOllama();

    const payload = {
      model: MODEL_NAME,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant. When sending emails, respond with a tool call in the exact format specified.'
        },
        {
          role: 'user',
          content: 'Send a test email to test@example.com with a short message'
        }
      ],
      stream: false
    };

    const result = await makeOllamaRequest(payload, TOOL_FORMATS.send_email);
    const parsed = parseToolResponse(result);
    
    expect(parsed.name).toBe('send_email');
    expect(parsed.arguments).toHaveProperty('to');
    expect(parsed.arguments).toHaveProperty('subject');
    expect(parsed.arguments).toHaveProperty('body');
    expect(typeof parsed.arguments.to).toBe('string');
    expect(typeof parsed.arguments.subject).toBe('string');
    expect(typeof parsed.arguments.body).toBe('string');
  }, TEST_TIMEOUT);

  it('should upload files to Drive', async () => {
    ollamaProcess = await startOllama();

    const payload = {
      model: MODEL_NAME,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant. When uploading files to Drive, respond with a tool call in the exact format specified.'
        },
        {
          role: 'user',
          content: 'Upload a small text file named "test.txt" containing "Hello World"'
        }
      ],
      stream: false
    };

    const result = await makeOllamaRequest(payload, TOOL_FORMATS.upload_file);
    const parsed = parseToolResponse(result);
    
    expect(parsed.name).toBe('upload_file');
    expect(parsed.arguments).toHaveProperty('name');
    expect(parsed.arguments).toHaveProperty('content');
    expect(parsed.arguments).toHaveProperty('mimeType');
    expect(typeof parsed.arguments.name).toBe('string');
    expect(typeof parsed.arguments.content).toBe('string');
    expect(typeof parsed.arguments.mimeType).toBe('string');
  }, TEST_TIMEOUT);
});