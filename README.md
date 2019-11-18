# Setup NuGet.exe

This action downloads and installs a given version of `NuGet.exe`. Using this
action will add `nuget` to your `$PATH` on all operating systems, including
macOS and linux, without having to prefix it with `mono`.

As `nuget.exe` is eventually getting phased out, please consider using the
official [`setup-dotnet`](https://github.com/actions/setup-dotnet) or
[one of the `msbuild` actions](https://github.com/marketplace?utf8=%E2%9C%93&query=msbuild)
instead.

# Usage

See [action.yml](action.yml)

Supported values for `nuget-version`:

* `latest` -- the latest blessed NuGet release.
* `preview` -- the latest EarlyAccessPreview release.
* `X.Y.Z` -- concrete semver version for a release (e.g. `5.3.1`).
* semver range -- any [valid semver range specifier](https://github.com/npm/node-semver#ranges) (e.g. `5`, `>=5`, `5.3.x`, etc)

This action also supports configuring your NuGet API key using
[GitHub secrets](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/creating-and-using-encrypted-secrets).
The API key should be passed in as an `nuget-api-key` input. See
[the GitHub documentation on secrets](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/creating-and-using-encrypted-secrets#creating-encrypted-secrets)
for how to configure secrets on your repository.

### Basic:

```yaml
steps:
- uses: actions/checkout@master
- uses: nuget/setup-nuget@v1
  with:
    nuget-api-key: ${{ secrets.NuGetAPIKey }}
    nuget-version: '5.x'
- run: nuget restore MyProject.sln
```

### Matrix Testing:

```yaml
name: NuGet Restore
on: [push, pull_request]
jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [windows-latest, ubuntu-latest, macOS-latest]
        nuget: [latest, preview, 4.x, 5.3.1]
    name: NuGet@${{ matrix.nuget }} sample
    steps:
      - uses: actions/checkout@master
      - name: Setup NuGet.exe
        uses: nuget/setup-nuget@v1
        with:
          nuget-version: ${{ matrix.nuget }}
      - run: nuget restore MyProject.sln
```

# Caching

The downloaded `nuget.exe` files are automatically cached between runs. To cache
your global nuget directory, consider using the [official cache action](https://github.com/actions/cache/blob/master/examples.md#c---nuget).

### Caching Example

Note: For this example, you'll need to enable [repeatable builds](https://devblogs.microsoft.com/nuget/enable-repeatable-package-restores-using-a-lock-file/) for your project.

```yaml
steps:
- uses: actions/checkout@master
- uses: nuget/setup-nuget@v1
  with:
    nuget-version: '5.x'
- uses: actions/cache@v1
  id: cache
  with:
    path: ~/.nuget/packages
    key: ${{ runner.os }}-nuget-${{ hashFiles('**/packages.lock.json') }}
- name: NuGet Restore
  if: steps.cache.outputs.cache-hit != 'true'
  run: nuget restore MyProject.sln
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE).
