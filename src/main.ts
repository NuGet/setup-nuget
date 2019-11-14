import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as fs from 'fs';
import * as path from 'path';
import pickVersion from './pick-version';

async function run() {
  try {
    let spec =
      core.getInput('nuget-version') || core.getInput('version') || 'latest';
    const tool = await pickVersion(spec);
    core.debug(`Found NuGet version: ${tool}`);
    let cachePath = await tc.find('nuget.exe', tool.version);
    if (!cachePath) {
      const nugetExePath = await tc.downloadTool(tool.url);
      cachePath = await tc.cacheFile(
        nugetExePath,
        'nuget.exe',
        'nuget.exe',
        tool.version
      );
    }
    core.debug(`nuget.exe cache path: ${cachePath}.`);
    if (process.platform !== 'win32') {
      core.debug(`Creating dummy 'nuget' script.`);
      core.exportVariable('NUGET', `${cachePath}/nuget.exe`);
      const scriptPath = path.join(cachePath, 'nuget');
      fs.writeFileSync(scriptPath, `#!/bin/sh\nmono ${cachePath}/nuget.exe $@`);
      fs.chmodSync(scriptPath, '755');
    }
    core.addPath(cachePath);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
