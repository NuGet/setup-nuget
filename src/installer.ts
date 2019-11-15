import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as fs from 'fs';
import * as path from 'path';
import pickVersion from './pick-version';

export default async function install(spec = 'latest') {
  const tool = await pickVersion(spec);
  core.debug(`Found NuGet version: ${tool.version}`);
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
  core.exportVariable('NUGET', `${cachePath}/nuget.exe`);
  if (process.platform !== 'win32') {
    core.debug(`Creating dummy 'nuget' script.`);
    const scriptPath = path.join(cachePath, 'nuget');
    fs.writeFileSync(
      scriptPath,
      `#!/bin/sh\nmono $MONO_OPTIONS ${path.join(cachePath, 'nuget.exe')} "$@"`
    );
    fs.chmodSync(scriptPath, '755');
  }
  core.addPath(cachePath);
  core.setOutput('nuget-version', tool.version);
  console.log(`Installed nuget.exe version ${tool.version}`);
}
