"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = pickVersion;
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
