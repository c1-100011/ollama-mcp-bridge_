# Ollama MCP Bridge

## Project Overview
This project serves as a bridge between Ollama (a local LLM server) and the Model Context Protocol (MCP). It enables AI assistants to interact with various MCP servers while using Ollama's local LLM capabilities.

## Architecture
The bridge operates as a middleware layer that:
1. Connects to Ollama for LLM capabilities
2. Manages connections to multiple MCP servers
3. Routes requests and responses between the LLM and MCP servers

## Core Components
- **Bridge**: Main orchestrator that handles communication between Ollama and MCP servers
- **LLM Client**: Manages interactions with Ollama
- **MCP Registry**: Manages available MCP servers and their configurations
- **Tool Registry**: Handles available tools and their implementations

## Configuration
The system is configured through `bridge_config.json` which defines:
- MCP server configurations
- LLM settings (model, temperature, etc.)
- System prompt and behavior

## MCP Servers
Currently integrated servers:
- Filesystem: File operations with secure directory access
- Memory: Knowledge graph and memory management
- Brave Search: Web search capabilities
- GitHub: Repository and code management
- DotContext: Codebase context management

## Development Guidelines
- All new features should maintain the bridge's role as a lightweight connector
- MCP server configurations should be easily modifiable
- Security considerations are important, especially for filesystem access

## Project Status
Active development with focus on:
- Stability of MCP server connections
- Proper error handling
- Configuration management
- Security and access control


