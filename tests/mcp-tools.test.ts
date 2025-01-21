import { describe, it, expect } from '@jest/globals';
import fetch from 'node-fetch';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const OLLAMA_BASE_URL = 'http://127.0.0.1:11434';
const MODEL_NAME = 'qwen2.5-coder:7b-instruct';
const TEST_TIMEOUT = 300000; // 5 minutes
const HOOK_TIMEOUT = 30000;  // 30 seconds for hooks
const REQUEST_TIMEOUT = 180000; // 3 minutes per request

async function killOllama() {
  try {
    console.log('Killing Ollama processes...');
    await execAsync('taskkill /F /IM ollama.exe').catch(() => {});
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Ollama processes killed');
  } catch (e) {
    console.log('No Ollama processes found to kill');
  }
}

async function makeOllamaRequest(payload: any) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    console.log('Making request to Ollama with payload:', JSON.stringify(payload, null, 2));
    const startTime = Date.now();
    
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const endTime = Date.now();
    console.log(`Request took ${endTime - startTime}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
    }

    const result = await response.json();
    console.log('Received response:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timed out after ${REQUEST_TIMEOUT/1000} seconds`);
      }
      throw error;
    }
    throw new Error('Unknown error occurred');
  } finally {
    clearTimeout(timeoutId);
  }
}

async function startOllama() {
  console.log('Starting Ollama server...');
  const ollamaProcess = exec('ollama serve');
  await new Promise(resolve => setTimeout(resolve, 5000));
  return ollamaProcess;
}

describe('MCP Tool Tests', () => {
  beforeEach(async () => {
    await killOllama();
    await new Promise(resolve => setTimeout(resolve, 3000));
  }, HOOK_TIMEOUT);

  describe('Filesystem MCP Tests', () => {
    it('should handle write_file request', async () => {
      await startOllama();
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
      expect(result.message).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('Brave Search MCP Tests', () => {
    it('should handle search request', async () => {
      await startOllama();
      const payload = {
        model: MODEL_NAME,
        messages: [
          {
            role: 'system',
            content: 'Format: {"tool_name":"brave_search","tool_args":{"query":"SEARCH_QUERY"}}'
          },
          {
            role: 'user',
            content: 'search for latest news about AI'
          }
        ],
        stream: false,
        options: { temperature: 0.1, num_predict: 100 }
      };

      const result = await makeOllamaRequest(payload);
      expect(result.message).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('GitHub MCP Tests', () => {
    it('should handle repository search', async () => {
      await startOllama();
      const payload = {
        model: MODEL_NAME,
        messages: [
          {
            role: 'system',
            content: 'Format: {"tool_name":"search_repositories","tool_args":{"query":"REPO_QUERY"}}'
          },
          {
            role: 'user',
            content: 'find github repositories about LLM agents'
          }
        ],
        stream: false,
        options: { temperature: 0.1, num_predict: 100 }
      };

      const result = await makeOllamaRequest(payload);
      expect(result.message).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('Flux MCP Tests', () => {
    it('should handle image generation request', async () => {
      await startOllama();
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
      expect(result.message).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('Memory MCP Tests', () => {
    it('should handle memory operations', async () => {
      await startOllama();
      const payload = {
        model: MODEL_NAME,
        messages: [
          {
            role: 'system',
            content: 'Format: {"tool_name":"store_memory","tool_args":{"key":"MEMORY_KEY","value":"MEMORY_VALUE"}}'
          },
          {
            role: 'user',
            content: 'remember that my favorite color is blue'
          }
        ],
        stream: false,
        options: { temperature: 0.1, num_predict: 100 }
      };

      const result = await makeOllamaRequest(payload);
      expect(result.message).toBeDefined();
    }, TEST_TIMEOUT);
  });

  afterAll(async () => {
    await killOllama();
  }, HOOK_TIMEOUT);
});