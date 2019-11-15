"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const tc = __importStar(require("@actions/tool-cache"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const pick_version_1 = __importDefault(require("./pick-version"));
async function install(spec = 'latest') {
    const tool = await pick_version_1.default(spec);
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
}
exports.default = install;
