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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = install;
const core = __importStar(require("@actions/core"));
const tc = __importStar(require("@actions/tool-cache"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const exec_1 = require("@actions/exec");
const pick_version_1 = __importDefault(require("./pick-version"));
async function install(spec = 'latest', apiKey, apiKeySource) {
    const tool = await (0, pick_version_1.default)(spec);
    core.debug(`Found NuGet version: ${tool.version}`);
    let cachePath = await tc.find('nuget.exe', tool.version);
    if (!cachePath) {
        const nugetExePath = await tc.downloadTool(tool.url);
        cachePath = await tc.cacheFile(nugetExePath, 'nuget.exe', 'nuget.exe', tool.version);
    }
    core.debug(`nuget.exe cache path: ${cachePath}.`);
    core.exportVariable('NUGET', `${cachePath}/nuget.exe`);
    if (process.platform !== 'win32') {
        core.debug(`Creating dummy 'nuget' script.`);
        const scriptPath = path.join(cachePath, 'nuget');
        fs.writeFileSync(scriptPath, `#!/bin/sh\nmono $MONO_OPTIONS ${path.join(cachePath, 'nuget.exe')} "$@"`);
        fs.chmodSync(scriptPath, '755');
    }
    core.addPath(cachePath);
    core.setOutput('nuget-version', tool.version);
    console.log(`Installed nuget.exe version ${tool.version}`);
    if (apiKey) {
        const args = ['SetApiKey', apiKey];
        if (apiKeySource) {
            args.push('-source', apiKeySource);
        }
        await (0, exec_1.exec)(path.join(cachePath, process.platform === 'win32' ? 'nuget.exe' : 'nuget'), args, { silent: true });
        console.log('Set up configured NuGet API key.');
    }
}
