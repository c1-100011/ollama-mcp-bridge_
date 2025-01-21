# Prompt Flow Documentation

This document explains what happens after a user submits a prompt to the system.

## High-Level Flow

1. User submits prompt
2. Bridge processes the prompt
3. LLM Client handles the interaction with Ollama
4. Response is processed and returned to user

## Detailed Process Flow

### 1. Initial Prompt Processing

When a user submits a prompt, the system first goes through these steps:

1. The prompt is received by the `processMessage` function in the bridge

2. The system checks for tool-specific patterns in the prompt using:
   - Exact tool name matches (e.g., "generate_image")
   - Space-separated versions (e.g., "generate image")
   - Natural language variations, for example:
     ```
     brave_web_search: "search the web", "web search", "search online", "look up"
     brave_local_search: "find nearby", "search near me", "local", "around here"
     generate_image: "create image", "make image", "draw", "create picture"
     send_email: "send mail", "email to", "mail to", "compose email"
     search_drive: "find file", "look for file", "search files"
     search_email: "find email", "look for email", "search mail"
     ```
   - Multi-word keywords are matched flexibly (all parts must be present but not necessarily in order)

3. If a specific tool is detected, its custom instructions are loaded in this format:
   ```json
   {
     "name": "tool_name",
     "arguments": {
       "param1": "example_value1",
       "param2": "example_value2"
     },
     "thoughts": "Explanation of why you're using this tool"
   }
   ```

### 2. LLM Interaction

The prompt is then processed through the LLM (Ollama) in these steps:

1. Connection check to Ollama server
   - If server isn't responding, automatic recovery is attempted
   - Up to 3 retry attempts are made if needed
   - Connection test uses GET request to `/api/tags` endpoint
   - 5-second timeout for connection test

2. Message preparation
   - Default system prompt is added (if not overridden):
     ```
     "You are a helpful assistant that can use tools to help answer questions."
     ```
   - Custom system prompt can be configured in bridge_config.json
   - User's prompt is added as a message with role "user"
   - Previous context is included if relevant
   - Messages array maintains conversation history

3. Request to Ollama
   - POST request to `/api/chat` endpoint
   - Request payload format:
     ```json
     {
       "model": "configured_model_name",
       "messages": [
         {"role": "system", "content": "system_prompt"},
         {"role": "user", "content": "user_prompt"},
         // Any previous messages...
       ],
       "stream": false,
       "format": "json",
       "options": {
         "temperature": 0,
         "num_predict": 1000
       }
     }
     ```
   - 5-minute timeout for completion request

### 3. Response Processing

The system processes Ollama's response in one of two ways:

#### Regular Response
If the LLM provides a direct answer:
1. Response is parsed from JSON format:
   ```json
   {
     "model": "model_name",
     "message": {
       "role": "assistant",
       "content": "response_content"
     }
   }
   ```
2. Content is extracted and formatted
3. Response is returned to user

#### Tool Call Response
If the LLM decides to use a tool:
1. Tool call is detected in this format:
   ```json
   {
     "tool_call": {
       "name": "tool_name",
       "arguments": {
         "param1": "value1",
         "param2": "value2"
       },
       "thoughts": "Optional reasoning for tool use"
     }
   }
   ```
2. Required tool is identified from registered tools
3. Tool arguments are validated against tool's schema
4. Tool is executed with provided arguments
5. Tool results are formatted and sent back to LLM:
   ```json
   {
     "role": "tool",
     "content": "tool_result",
     "tool_call_id": "unique_call_id"
   }
   ```
6. Process repeats until a final answer is ready

### 4. Error Handling

Throughout the process, the system handles various scenarios:

- Connection issues: Automatic server restart
- Timeout errors: After 5 minutes of no response
- Tool execution errors: Captured and reported
- Parse errors: Handled with appropriate error messages

## Common Scenarios

### Basic Question/Answer
```
User prompt → LLM processing → Direct response
```

### Tool Usage
```
User prompt → LLM processing → Tool call → Tool execution → 
Result to LLM → Final response
```

### Multiple Tool Usage
```
User prompt → LLM processing → Tool call 1 → Tool execution → 
Result to LLM → Tool call 2 → Tool execution → Result to LLM → 
Final response
```

## Notes

- The system maintains a single Ollama server instance for multiple prompts
- Each prompt interaction is independent but can involve multiple rounds of tool usage
- The system automatically handles server recovery if connection issues occur
- All interactions are logged for debugging purposes

## Logging and Debugging

The system provides detailed logging at each step of the process:

### Prompt Processing Logs
```
INFO:     Processing user input...
INFO:     Detected tool: [tool_name or null]
INFO:     Sending message to LLM...
```

### Ollama Server Logs
```
DEBUG:    Testing connection to Ollama...
DEBUG:    Ollama connection test successful
DEBUG:    Preparing Ollama request with payload: [request details]
DEBUG:    Sending request to Ollama...
DEBUG:    Response received from Ollama, parsing...
```

### Tool Execution Logs
```
INFO:     Processing [N] tool calls
DEBUG:    [MCP] Looking up tool name: [tool_name]
INFO:     [MCP] About to call MCP tool: [tool_name]
INFO:     [MCP] Tool arguments prepared: [arguments]
INFO:     [MCP] Received response from MCP
```

### Error Logs
```
ERROR:    Connection error detected, attempting to restart Ollama...
ERROR:    Tool execution failed with error: [error details]
ERROR:    Failed to parse response: [error details]
```

These logs can be used to:
- Track the flow of prompt processing
- Debug tool execution issues
- Monitor Ollama server status
- Identify connection problems
- Understand response parsing errors
