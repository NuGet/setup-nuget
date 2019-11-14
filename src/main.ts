import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
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
    if (process.platform === 'win32') {
      core.addPath(cachePath);
    } else {
      // TODO - maybe write a wrapper script that achieves this.
      core.exportVariable('NUGET', `${cachePath}/nuget.exe`);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
