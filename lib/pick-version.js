"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const rest = __importStar(require("typed-rest-client/RestClient"));
const semver = __importStar(require("semver"));
var Stage;
(function (Stage) {
    Stage["latest"] = "ReleasedAndBlessed";
    Stage["preview"] = "EarlyAccessPreview";
    Stage["_released"] = "Released";
})(Stage || (Stage = {}));
async function pickVersion(spec) {
    spec = spec.trim();
    let versions = await fetchVersions();
    let range = semver.validRange(spec, true);
    let selected;
    if (range) {
        selected = versions.find(v => semver.satisfies(v.version, range, true));
    }
    else {
        let stage = spec == 'latest'
            ? Stage.latest
            : spec == 'preview'
                ? Stage.preview
                : null;
        if (!stage) {
            throw new Error(`Invalid release label: '${spec}'. Valid labels are 'latest' and 'preview'.`);
        }
        selected = versions.find(v => v.stage === stage);
    }
    if (!selected) {
        throw new Error(`No valid versions could be found for '${spec}'.`);
    }
    return selected;
}
exports.default = pickVersion;
async function fetchVersions() {
    const http = new rest.RestClient('nuget/setup-nuget-exe', undefined, undefined, {
        allowRetries: true,
        maxRetries: 3
    });
    return (await http
        .get('https://dist.nuget.org/tools.json')
        .then(j => j.result || { 'nuget.exe': [] })
        .then(n => n['nuget.exe'])).map(v => {
        return {
            ...v,
            uploaded: new Date(v.uploaded)
        };
    });
}
