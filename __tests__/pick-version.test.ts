import nock from 'nock';
import pickVersion from '../src/pick-version.js';

const HOST = 'https://dist.nuget.org';
const PATH = '/tools.json';
const TOOLS_JSON = {
  'nuget.exe': [
    {
      version: '5.3.1',
      url: 'https://dist.nuget.org/win-x86-commandline/v5.3.1/nuget.exe',
      stage: 'ReleasedAndBlessed',
      uploaded: '2019-10-24T21:00:00.0000000Z'
    },
    {
      version: '5.3.0',
      url: 'https://dist.nuget.org/win-x86-commandline/v5.3.0/nuget.exe',
      stage: 'ReleasedAndBlessed',
      uploaded: '2019-09-23T21:00:00.0000000Z'
    },
    {
      version: '5.3.0-preview3',
      url:
        'https://dist.nuget.org/win-x86-commandline/v5.3.0-preview3/nuget.exe',
      stage: 'EarlyAccessPreview',
      uploaded: '2019-09-04T17:00:00.0000000Z'
    },
    {
      version: '3.2.0',
      url: 'https://dist.nuget.org/win-x86-commandline/v3.2.0/nuget.exe',
      stage: 'Released',
      uploaded: '2015-09-16T14:00:00.0000000-07:00'
    },
    {
      version: '2.8.6',
      url: 'https://dist.nuget.org/win-x86-commandline/v2.8.6/nuget.exe',
      stage: 'ReleasedAndBlessed',
      uploaded: '2015-09-01T12:30:00.0000000-07:00'
    }
  ]
};
const TOOLS_JSON_RESPONSE = JSON.stringify(TOOLS_JSON);

beforeEach(() => {
  if (!nock.isActive()) {
    nock.activate();
  }
  nock.cleanAll();
});

afterEach(() => {
  nock.abortPendingRequests();
  nock.cleanAll();
  if (nock.isActive()) {
    nock.restore();
  }
});

test('picks a version based on concrete version', async () => {
  const srv = nock(HOST);
  srv.get(PATH).reply(200, TOOLS_JSON_RESPONSE);
  const tool = await pickVersion('5.3.0');
  srv.done();
  expect(tool).toStrictEqual({
    version: '5.3.0',
    url: 'https://dist.nuget.org/win-x86-commandline/v5.3.0/nuget.exe',
    stage: 'ReleasedAndBlessed',
    uploaded: new Date('2019-09-23T21:00:00.0000000Z')
  });
});

test('picks a version based on semver range', async () => {
  const srv = nock(HOST);
  srv.get(PATH).reply(200, TOOLS_JSON_RESPONSE);
  let tool = await pickVersion('5.3');
  srv.done();
  expect(tool).toStrictEqual({
    version: '5.3.1',
    url: 'https://dist.nuget.org/win-x86-commandline/v5.3.1/nuget.exe',
    stage: 'ReleasedAndBlessed',
    uploaded: new Date('2019-10-24T21:00:00.0000000Z')
  });
});

test('picks a version based on stage', async () => {
  const srv = nock(HOST);
  srv
    .get(PATH)
    .times(2)
    .reply(200, TOOLS_JSON_RESPONSE);
  let tool = await pickVersion('latest');
  expect(tool).toStrictEqual({
    version: '5.3.1',
    url: 'https://dist.nuget.org/win-x86-commandline/v5.3.1/nuget.exe',
    stage: 'ReleasedAndBlessed',
    uploaded: new Date('2019-10-24T21:00:00.0000000Z')
  });
  tool = await pickVersion('preview');
  srv.done();
  expect(tool).toStrictEqual({
    version: '5.3.0-preview3',
    url: 'https://dist.nuget.org/win-x86-commandline/v5.3.0-preview3/nuget.exe',
    stage: 'EarlyAccessPreview',
    uploaded: new Date('2019-09-04T17:00:00.0000000Z')
  });
});

test('errors when no version could be found', async () => {
  const srv = nock(HOST);
  srv.get(PATH).reply(200, TOOLS_JSON_RESPONSE);
  await expect(pickVersion('4')).rejects.toThrow(
    "No valid versions could be found for '4'."
  );
  srv.done();
});

test('errors if an invalid label is passed in', async () => {
  const srv = nock(HOST);
  srv.get(PATH).reply(200, TOOLS_JSON_RESPONSE);
  await expect(pickVersion('yesterday')).rejects.toThrow(
    "Invalid release label: 'yesterday'. Valid labels are 'latest' and 'preview'."
  );
  srv.done();
});
