import * as core from '@actions/core';
import installer from './installer';

async function run() {
  try {
    await installer(
      core.getInput('nuget-version'),
      core.getInput('nuget-api-key'),
      core.getInput('nuget-api-key-source')
    );
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
