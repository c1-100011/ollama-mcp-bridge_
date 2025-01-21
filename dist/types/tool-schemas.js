"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolSchemas = void 0;
exports.toolSchemas = {
    // Image generation
    generate_image: {
        type: "object",
        properties: {
            prompt: {
                type: "string",
                description: "Text description of the image to generate"
            },
            guidance: {
                type: "number",
                enum: [1, 1.5, 2, 2.5, 3, 3.5],
                default: 1
            },
            aspect_ratio: {
                type: "string",
                enum: ["1:1", "4:5", "16:9"],
                default: "1:1"
            },
            megapixels: {
                type: "string",
                enum: ["1"],
                default: "1"
            },
            go_fast: {
                type: "boolean",
                default: true
            }
        },
        required: ["prompt"]
    },
    // Email tools
    send_email: {
        type: "object",
        properties: {
            to: {
                type: "string",
                description: "Email address of the recipient"
            },
            subject: {
                type: "string",
                description: "Subject line of the email"
            },
            body: {
                type: "string",
                description: "Content of the email"
            }
        },
        required: ["to", "subject", "body"]
    },
    search_email: {
        type: "object",
        properties: {
            query: {
                type: "string",
                description: "Search query for finding emails"
            }
        },
        required: ["query"]
    },
    // Search tools
    brave_web_search: {
        type: "object",
        properties: {
            query: {
                type: "string",
                description: "Search query (max 400 chars, 50 words)"
            },
            count: {
                type: "number",
                minimum: 1,
                maximum: 20,
                default: 10
            }
        },
        required: ["query"]
    },
    brave_local_search: {
        type: "object",
        properties: {
            query: {
                type: "string",
                description: "Local search query (e.g., 'pizza near Central Park')"
            },
            count: {
                type: "number",
                minimum: 1,
                maximum: 20,
                default: 5
            }
        },
        required: ["query"]
    },
    // Drive tools
    search_drive: {
        type: "object",
        properties: {
            query: {
                type: "string",
                description: "Search query for finding files"
            }
        },
        required: ["query"]
    },
    create_folder: {
        type: "object",
        properties: {
            name: {
                type: "string",
                description: "Name of the folder to create"
            }
        },
        required: ["name"]
    },
    upload_file: {
        type: "object",
        properties: {
            name: {
                type: "string",
                description: "Name of the file"
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
};
