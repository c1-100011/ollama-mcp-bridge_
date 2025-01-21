# MCP-LLM Bridge

A TypeScript implementation that connects local LLMs (via Ollama) to Model Context Protocol (MCP) servers. This bridge allows open-source models to use the same tools and capabilities as Claude, enabling powerful local AI assistants.

## Overview

This project bridges local Large Language Models with MCP servers that provide various capabilities like:
- Filesystem operations
- Brave web search
- GitHub interactions
- Google Drive & Gmail integration
- Memory/storage
- Image generation with Flux

The bridge translates between the LLM's outputs and the MCP's JSON-RPC protocol, allowing any Ollama-compatible model to use these tools just like Claude does.

## Demo

Here's a quick demo of the filesystem operations capability:

https://github.com/patruff/ollama-mcp-bridge/assets/demo-filesystem.mp4

## Current Setup

- **LLM**: Using Qwen 2.5 7B (qwen2.5-coder:7b-instruct) through Ollama
- **MCPs**:
  - Filesystem operations (`@modelcontextprotocol/server-filesystem`)
  - Brave Search (`@modelcontextprotocol/server-brave-search`)
  - GitHub (`@modelcontextprotocol/server-github`)
  - Memory (`@modelcontextprotocol/server-memory`)
  - Flux image generation (`@patruff/server-flux`)
  - Gmail & Drive (`@patruff/server-gmail-drive`)

## Architecture

- **Bridge**: Core component that manages tool registration and execution
- **LLM Client**: Handles Ollama interactions and formats tool calls
- **MCP Client**: Manages MCP server connections and JSON-RPC communication
- **Tool Router**: Routes requests to appropriate MCP based on tool type

### Key Features
- Multi-MCP support with dynamic tool routing
- Structured output validation for tool calls
- Automatic tool detection from user prompts
- Robust process management for Ollama
- Detailed logging and error handling

## Setup

1. Install Ollama and required model:
```bash
ollama pull qwen2.5-coder:7b-instruct
```

2. Install MCP servers:
```bash
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-brave-search
npm install -g @modelcontextprotocol/server-github
npm install -g @modelcontextprotocol/server-memory
npm install -g @patruff/server-flux
npm install -g @patruff/server-gmail-drive
```

3. Configure credentials:
   - Set `BRAVE_API_KEY` for Brave Search
   - Set `GITHUB_PERSONAL_ACCESS_TOKEN` for GitHub
   - Set `REPLICATE_API_TOKEN` for Flux
   - Run Gmail/Drive MCP auth: `node path/to/gmail-drive/index.js auth`
   - For example node C:\Users\patru\AppData\Roaming\npm\node_modules\@patruff\server-gmail-drive\dist\index.js auth

## Configuration

The bridge is configured through `bridge_config.json`:
- MCP server definitions
- LLM settings (model, temperature, etc.)
- Tool permissions and paths

Example:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["path/to/server-filesystem/dist/index.js"],
      "allowedDirectory": "workspace/path"
    },
    // ... other MCP configurations
  },
  "llm": {
    "model": "qwen2.5-coder:7b-instruct",
    "baseUrl": "http://localhost:11434"
  }
}
```

## Usage

1. Start the bridge:
```bash
npm run start
```

2. Available commands:
   - `list-tools`: Show available tools
   - Regular text: Send prompts to the LLM
   - `quit`: Exit the program

Example interactions:
```
> Search the web for "latest TypeScript features"
[Uses Brave Search MCP to find results]

> Create a new folder called "project-docs"
[Uses Filesystem MCP to create directory]

> Send an email to user@example.com
[Uses Gmail MCP to compose and send email]
```

## Technical Details

### Tool Detection
The bridge includes smart tool detection based on user input:
- Email operations: Detected by email addresses and keywords
- Drive operations: Detected by file/folder keywords
- Search operations: Contextually routed to appropriate search tool

### Response Processing
Responses are processed through multiple stages:
1. LLM generates structured tool calls
2. Bridge validates and routes to appropriate MCP
3. MCP executes operation and returns result
4. Bridge formats response for user

## Extended Capabilities

This bridge effectively brings Claude's tool capabilities to local models:
- Filesystem manipulation
- Web search and research
- Email and document management
- Code and GitHub interactions
- Image generation
- Persistent memory

All while running completely locally with open-source models.

## Future Improvements

- Add support for more MCPs
- Implement parallel tool execution
- Add streaming responses
- Enhance error recovery
- Add conversation memory
- Support more Ollama models

## Related Projects

This bridge integrates with the broader Claude ecosystem:
- Model Context Protocol (MCP)
- Claude Desktop Configuration
- Ollama Project
- Various MCP server implementations

The result is a powerful local AI assistant that can match many of Claude's capabilities while running entirely on your own hardware.
