import fetch = require('make-fetch-happen');
import * as semver from 'semver';

enum Stage {
  latest = 'ReleasedAndBlessed',
  preview = 'EarlyAccessPreview',
  _released = 'Released'
}

interface Tool {
  version: string;
  url: string;
  stage: Stage;
  uploaded: Date;
}

export default async function pickVersion(spec: string): Promise<Tool> {
  spec = spec.trim();
  let versions = await fetchVersions();
  let range = semver.validRange(spec, true);
  let selected;
  if (range) {
    selected = versions.find(v => semver.satisfies(v.version, range, true));
  } else {
    let stage =
      spec == 'latest'
        ? Stage.latest
        : spec == 'preview'
        ? Stage.preview
        : null;
    if (!stage) {
      throw new Error(
        `Invalid release label: ${spec}. Valid labels are 'latest' and 'preview'.`
      );
    }
    selected = versions.find(v => v.stage === stage);
  }
  if (!selected) {
    throw new Error(`No valid versions could be found for '${spec}'.`);
  }
  return selected;
}

async function fetchVersions(): Promise<Tool[]> {
  return (
    await fetch('https://dist.nuget.org/tools.json')
      .then(j => j.json())
      .then(n => n['nuget.exe'])
  ).map(v => {
    return {
      ...v,
      uploaded: new Date(v.uploaded)
    };
  });
}
