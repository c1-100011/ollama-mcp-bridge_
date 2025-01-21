import fetch from 'node-fetch';
import { exec, ChildProcess } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const OLLAMA_BASE_URL = 'http://127.0.0.1:11434';
export const MODEL_NAME = 'qwen2.5-coder:7b-instruct';
export const TEST_TIMEOUT = 300000; // 5 minutes
export const HOOK_TIMEOUT = 30000;  // 30 seconds for hooks
export const REQUEST_TIMEOUT = 300000; // 5 minutes per request

// Define the expected tool formats based on MCP schema patterns
export const TOOL_FORMATS = {
  search_email: {
    type: "object",
    properties: {
      name: { type: "string", enum: ["search_email"] },
      arguments: {
        type: "object",
        properties: {
          query: { 
            type: "string",
            description: "Search query for emails"
          },
          limit: {
            type: "number",
            description: "Maximum number of results to return",
            default: 10
          }
        },
        required: ["query"]
      }
    },
    required: ["name", "arguments"]
  },
  search_drive: {
    type: "object",
    properties: {
      name: { type: "string", enum: ["search_drive"] },
      arguments: {
        type: "object",
        properties: {
          query: { 
            type: "string",
            description: "Search query for Google Drive files"
          }
        },
        required: ["query"]
      }
    },
    required: ["name", "arguments"]
  },
  create_folder: {
    type: "object",
    properties: {
      name: { type: "string", enum: ["create_folder"] },
      arguments: {
        type: "object",
        properties: {
          name: { 
            type: "string",
            description: "Name of the folder to create"
          }
        },
        required: ["name"]
      }
    },
    required: ["name", "arguments"]
  },
  send_email: {
    type: "object",
    properties: {
      name: { type: "string", enum: ["send_email"] },
      arguments: {
        type: "object",
        properties: {
          to: { 
            type: "string",
            description: "Email address of the recipient"
          },
          subject: { 
            type: "string",
            description: "Subject of the email"
          },
          body: { 
            type: "string",
            description: "Content of the email"
          }
        },
        required: ["to", "subject", "body"]
      }
    },
    required: ["name", "arguments"]
  },
  upload_file: {
    type: "object",
    properties: {
      name: { type: "string", enum: ["upload_file"] },
      arguments: {
        type: "object",
        properties: {
          name: { 
            type: "string",
            description: "Name of the file to create"
          },
          content: { 
            type: "string",
            description: "Content of the file"
          },
          mimeType: { 
            type: "string",
            description: "MIME type of the file"
          }
        },
        required: ["name", "content", "mimeType"]
      }
    },
    required: ["name", "arguments"]
  }
};

export async function killOllama() {
  try {
    console.log('Killing Ollama processes...');
    await execAsync('taskkill /F /IM ollama.exe').catch(() => {});
    const { stdout } = await execAsync('netstat -ano | findstr ":11434"').catch(() => ({ stdout: '' }));
    const pids = stdout.split('\n')
      .map(line => line.trim().split(/\s+/).pop())
      .filter(pid => pid && /^\d+$/.test(pid));
    
    for (const pid of pids) {
      await execAsync(`taskkill /F /PID ${pid}`).catch(() => {});
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('Ollama processes killed');
  } catch (e) {
    console.log('No Ollama processes found to kill');
  }
}

export async function startOllama(): Promise<ChildProcess> {
  console.log('Starting Ollama server...');
  const ollamaProcess = exec('ollama serve', { windowsHide: true });
  
  ollamaProcess.on('error', (error) => {
    console.error('Error starting Ollama:', error);
  });

  ollamaProcess.stdout?.on('data', (data) => {
    console.log('Ollama stdout:', data.toString());
  });

  ollamaProcess.stderr?.on('data', (data) => {
    console.error('Ollama stderr:', data.toString());
  });

  await new Promise(resolve => setTimeout(resolve, 10000));
  console.log('Ollama server started');
  return ollamaProcess;
}

export async function makeOllamaRequest(payload: any, toolFormat: any) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    // Add the format parameter to enforce structured output
    const requestPayload = {
      ...payload,
      format: toolFormat,
      options: {
        ...payload.options,
        temperature: 0 // Set to 0 for more deterministic output
      }
    };

    console.log('Making request to Ollama with payload:', JSON.stringify(requestPayload, null, 2));
    const startTime = Date.now();
    
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
      signal: controller.signal
    });

    const endTime = Date.now();
    console.log(`Request took ${endTime - startTime}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
    }

    const result = await response.json();
    console.log('Raw response:', JSON.stringify(result, null, 2));
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

export function parseToolResponse(result: any) {
  try {
    if (!result?.message?.content) {
      console.error('Invalid response structure:', result);
      throw new Error('Invalid response structure');
    }

    const content = result.message.content;
    
    // If content is already an object (from structured output), return it
    if (typeof content === 'object') {
      return content;
    }

    // Otherwise parse it (fallback for older Ollama versions)
    return JSON.parse(content.trim());
  } catch (e) {
    console.error('Failed to parse response:', result?.message?.content);
    throw e;
  }
}

export async function cleanupProcess(process: ChildProcess | null) {
  if (process) {
    console.log('Cleaning up process...');
    try {
      process.kill();
      if (process.pid) {
        await execAsync(`taskkill /F /PID ${process.pid}`).catch(() => {});
      }
      const { stdout } = await execAsync('netstat -ano | findstr ":11434"').catch(() => ({ stdout: '' }));
      const pids = stdout.split('\n')
        .map(line => line.trim().split(/\s+/).pop())
        .filter(pid => pid && /^\d+$/.test(pid));
      
      for (const pid of pids) {
        await execAsync(`taskkill /F /PID ${pid}`).catch(() => {});
      }
    } catch (e) {
      console.error('Error during process cleanup:', e);
    }
  }
}