"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePath = void 0;
const logger_1 = require("./logger");
const path = __importStar(require("path"));
function normalizePath(filePath) {
    try {
        // Convert to Windows path format and normalize
        const normalized = path.win32.normalize(filePath)
            // Ensure proper capitalization for root parts (C:\Users)
            .replace(/^([a-zA-Z]):\\(users|Users)\\/, 'C:\\Users\\')
            // Replace forward slashes with backslashes
            .replace(/\//g, '\\');
        logger_1.logger.debug(`Normalized path from ${filePath} to ${normalized}`);
        return normalized;
    }
    catch (error) {
        logger_1.logger.error(`Path normalization failed for ${filePath}:`, error);
        return filePath;
    }
}
exports.normalizePath = normalizePath;
