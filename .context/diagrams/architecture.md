# System Architecture

```mermaid
graph TB
    subgraph Client["AI Assistant"]
        LLMReq["LLM Request"]
        ToolReq["Tool Request"]
    end

    subgraph Bridge["Ollama MCP Bridge"]
        LLMClient["LLM Client"]
        MCPReg["MCP Registry"]
        ToolReg["Tool Registry"]
        Bridge["Bridge Controller"]
    end

    subgraph Ollama["Ollama"]
        LLMServ["LLM Server"]
        Models["Models"]
    end

    subgraph MCPServers["MCP Servers"]
        FS["Filesystem Server"]
        Mem["Memory Server"]
        BS["Brave Search Server"]
        GH["GitHub Server"]
        DC["DotContext Server"]
    end

    %% Client to Bridge connections
    LLMReq -->|"1. Send prompt"| Bridge
    ToolReq -->|"4. Execute tool"| Bridge

    %% Bridge internal connections
    Bridge <-->|"2. Process"| LLMClient
    Bridge <-->|"5. Route"| MCPReg
    Bridge <-->|"3. Register"| ToolReg

    %% Bridge to external connections
    LLMClient <-->|"LLM API"| LLMServ
    LLMServ --- Models

    %% MCP connections
    MCPReg -->|"MCP Protocol"| FS
    MCPReg -->|"MCP Protocol"| Mem
    MCPReg -->|"MCP Protocol"| BS
    MCPReg -->|"MCP Protocol"| GH
    MCPReg -->|"MCP Protocol"| DC

    %% Styling
    classDef primary fill:#2374ab,stroke:#2374ab,color:#fff
    classDef secondary fill:#ff7e67,stroke:#ff7e67,color:#fff
    classDef tertiary fill:#78c091,stroke:#78c091,color:#fff

    class Bridge,LLMClient,MCPReg,ToolReg primary
    class LLMServ,Models secondary
    class FS,Mem,BS,GH,DC tertiary
```

## Component Descriptions

### Bridge Layer
- **Bridge Controller**: Central orchestrator managing all communications
- **LLM Client**: Handles interactions with Ollama LLM server
- **MCP Registry**: Manages MCP server connections and routing
- **Tool Registry**: Maintains available tools and their implementations

### External Systems
- **Ollama**: Local LLM server providing language model capabilities
- **MCP Servers**: Various servers providing specific functionalities
  - Filesystem: File operations
  - Memory: Knowledge storage
  - Brave Search: Web search
  - GitHub: Repository management
  - DotContext: Codebase context

### Data Flow
1. AI Assistant sends prompts to Bridge
2. Bridge processes requests through LLM Client
3. Tools are registered and managed by Tool Registry
4. Tool execution requests are routed to appropriate servers
5. MCP Registry handles communication with MCP servers
