import { Tool, ToolRegistry, MCPToolMetadata } from './types';
import { logger } from './logger';

export class DynamicToolRegistry {
  private registry: ToolRegistry = {};

  constructor() {}

  registerTool(tool: Tool) {
    const exampleArgs = this.generateExampleArgs(tool.inputSchema);
    const formatInstructions = this.generateFormatInstructions(tool);
    const keywords = this.generateKeywords(tool.name);

    this.registry[tool.name] = {
      keywords,
      exampleArgs,
      formatInstructions
    };

    logger.debug(`Registered tool: ${tool.name} with keywords: ${keywords.join(', ')}`);
  }

  private generateKeywords(toolName: string): string[] {
    const keywords = [
      toolName,                     // exact match (e.g., generate_image)
      toolName.replace(/_/g, ' ')   // with spaces (e.g., generate image)
    ];

    // Add natural language variations
    switch (toolName) {
      case 'brave_web_search':
        keywords.push('search the web', 'web search', 'search online', 'look up', 'find information about');
        break;
      case 'brave_local_search':
        keywords.push('find nearby', 'search near me', 'local', 'around here', 'in the area');
        break;
      case 'generate_image':
        keywords.push('create image', 'make image', 'draw', 'create picture', 'generate picture');
        break;
      case 'send_email':
        keywords.push('send mail', 'email to', 'mail to', 'compose email');
        break;
      case 'search_drive':
        keywords.push('find file', 'look for file', 'search files');
        break;
      case 'search_email':
        keywords.push('find email', 'look for email', 'search mail');
        break;
    }

    return keywords;
  }

  private matchesKeywords(prompt: string, keywords: string[]): boolean {
    prompt = prompt.toLowerCase();
    return keywords.some(keyword => {
      // Handle multi-word keywords more flexibly
      if (keyword.includes(' ')) {
        const parts = keyword.split(' ');
        return parts.every(part => prompt.includes(part.toLowerCase()));
      }
      return prompt.includes(keyword.toLowerCase());
    });
  }

  private generateExampleArgs(schema: any): any {
    if (!schema || !schema.properties) {
      return {};
    }

    const example: any = {};
    for (const [key, value] of Object.entries<any>(schema.properties)) {
      switch (value.type) {
        case 'string':
          if (key === 'prompt') example[key] = "description of what you want";
          else if (key === 'query') example[key] = "search query";
          else if (key.includes('path')) example[key] = "filename.txt";
          else if (key.includes('content')) example[key] = "content to write";
          else example[key] = `example_${key}`;
          break;
        case 'number':
          example[key] = value.example || 1;
          break;
        case 'boolean':
          example[key] = value.example || true;
          break;
        case 'object':
          example[key] = this.generateExampleArgs(value);
          break;
        case 'array':
          example[key] = value.example || [];
          break;
        default:
          example[key] = value.example || null;
      }
    }
    return example;
  }

  private generateFormatInstructions(tool: Tool): string {
    return `When using the ${tool.name} tool, respond with ONLY this JSON format:
{
  "name": "${tool.name}",
  "arguments": ${JSON.stringify(this.generateExampleArgs(tool.inputSchema), null, 2)},
  "thoughts": "Explanation of why you're using this tool"
}`;
  }

  detectToolFromPrompt(prompt: string): string | null {
    prompt = prompt.toLowerCase();
    
    // Check each tool's keywords with improved matching
    for (const [toolName, metadata] of Object.entries(this.registry)) {
      if (this.matchesKeywords(prompt, metadata.keywords)) {
        logger.debug(`Detected tool ${toolName} via keywords`);
        return toolName;
      }
    }

    return null;
  }

  getToolInstructions(toolName: string): string | null {
    const toolData = this.registry[toolName];
    if (!toolData) return null;
    return toolData.formatInstructions;
  }

  getToolFormat(toolName: string): any | null {
    const toolData = this.registry[toolName];
    if (!toolData) return null;

    return {
      type: "object",
      properties: {
        name: { type: "string", enum: [toolName] },
        arguments: {
          type: "object",
          properties: toolData.exampleArgs
        },
        thoughts: { type: "string" }
      },
      required: ["name", "arguments"]
    };
  }

  getAllTools(): string[] {
    return Object.keys(this.registry);
  }
}
