# Example Prompts for Ollama-MCP-Bridge

This document provides example prompts that demonstrate the capabilities of various MCP tools and features available in the ollama-mcp-bridge.

## Filesystem Operations

```
"Create a new file called test.txt with 'Hello World' as content"
"Write some notes to notes.md"
"Save this code snippet to script.js"
"Create a new configuration file with these settings"
```

## Brave Web Search Integration

```
"Search the web for latest developments in AI"
"Find recent articles about machine learning"
"Look up documentation for React hooks"
"Search for news about climate change"
```

## Gmail & Google Drive Integration

```
"Search my emails for messages about testing"
"Find recent documents about project specs in my Drive"
"Create a new folder called 'Project Documentation' in Drive"
"Send an email to team@company.com about the project status"
"Upload the meeting notes to my Google Drive"
"Search my last 10 emails containing 'meeting minutes'"
"Create a new project folder and upload the requirements document"
"Send a follow-up email with the attached presentation"
```

## Memory Management

```
"Remember that my favorite color is blue"
"Store this information for later: my project deadline is next Friday"
"Save this configuration for future reference"
"Remember these API credentials for later use"
```

## Image Generation

```
"Generate an image of a sunset over mountains with 1 megapixel resolution in 16:9 aspect ratio"
"Create a futuristic city at 0.25 megapixels with 21:9 cinematic ratio"
"Generate an artistic portrait in 4:3 aspect ratio with 1MP quality"
"Create a square landscape at 0.25MP using 1:1 ratio"
```

Note: Image generation requirements and behavior:
1. Megapixels parameter must be either "1" or "0.25"
2. Aspect ratio must be one of: 1:1, 16:9, 21:9, 3:2, 2:3, 4:5, 5:4, 3:4, 4:3, 9:16, or 9:21
3. The tool returns URLs to the generated images rather than saving files locally
4. To save the image locally, you'll need to download it from the returned URL

Example combined usage:
```
"Generate an image of a mountain landscape at 1MP in 16:9 ratio and save it to my Drive"
"Create a portrait image at 0.25MP in 3:4 ratio and save it locally as portrait.png"
```

## Combined Capabilities

```
"Search for documentation about React and save it to a local file"
"Find emails about the project and create a summary document in Drive"
"Search my emails for attachments and upload them to a new Drive folder"
"Generate an image based on the project requirements and save it to Drive"
```

Note: The actual availability of these capabilities depends on:
1. Proper configuration of the bridge
2. Required API keys and credentials being set up
3. Necessary permissions being granted
4. The specific MCP servers being active and connected

Each prompt should be directed to an AI assistant that has access to these MCP tools through the ollama-mcp-bridge.
