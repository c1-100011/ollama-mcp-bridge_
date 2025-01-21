"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const chalk_1 = __importDefault(require("chalk"));
const chalkColors = {
    red: chalk_1.default.red,
    yellow: chalk_1.default.yellow,
    green: chalk_1.default.green,
    cyan: chalk_1.default.cyan,
    gray: chalk_1.default.gray
};
const customLevels = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        debug: 3,
    },
    colors: {
        error: 'red',
        warn: 'yellow',
        info: 'green',
        debug: 'cyan',
    },
};
function getFormattedTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}
exports.logger = winston_1.default.createLogger({
    levels: customLevels.levels,
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.printf(({ level, message }) => {
        const color = customLevels.colors[level];
        const colorFn = chalkColors[color];
        const levelStr = colorFn(level.toUpperCase());
        const nameStr = chalkColors.cyan('LLMBridge');
        const timeStr = chalkColors.gray(getFormattedTime());
        return `${timeStr} ${levelStr}:     ${nameStr} - ${message}`;
    })),
    transports: [
        new winston_1.default.transports.Console({
            level: 'debug' // Changed to 'debug' to show more output
        })
    ]
});
