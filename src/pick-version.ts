import * as https from 'https';
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

interface NuGetTools {
  'nuget.exe': Tool[];
}

export default async function pickVersion(spec: string): Promise<Tool> {
  spec = spec.trim();
  let versions = await fetchVersions();
  let range = semver.validRange(spec, true);
  let selected;
  if (range) {
    selected = versions.find(v => semver.satisfies(v.version, (range as string), true));
  } else {
    let stage =
      spec == 'latest'
        ? Stage.latest
        : spec == 'preview'
        ? Stage.preview
        : null;
    if (!stage) {
      throw new Error(
        `Invalid release label: '${spec}'. Valid labels are 'latest' and 'preview'.`
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
  const tools = (await getNuGetToolsJsonWithRetries('https://dist.nuget.org/tools.json'))[
    'nuget.exe'
  ];

  return tools.map(v => {
    return {
      ...v,
      uploaded: new Date(v.uploaded)
    };
  });
}

async function getNuGetToolsJsonWithRetries(urlString: string): Promise<NuGetTools> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await getNuGetToolsJson(urlString);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

function getNuGetToolsJson(urlString: string): Promise<NuGetTools> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const request = https.get(url, response => {
      if (response.statusCode === undefined || response.statusCode < 200 || response.statusCode >= 300) {
        response.resume();
        reject(new Error(`Failed to fetch NuGet tools metadata from ${urlString}.`));
        return;
      }

      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => {
        body += chunk;
      });
      response.on('end', () => {
        try {
          const parsed = JSON.parse(body) as NuGetTools;
          resolve(parsed || {'nuget.exe': []});
        } catch {
          reject(new Error(`Failed to parse NuGet tools metadata from ${urlString}.`));
        }
      });
    });

    request.on('error', reject);
  });
}
