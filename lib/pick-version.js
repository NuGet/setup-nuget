"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fetch = require("make-fetch-happen");
const semver = __importStar(require("semver"));
var Stage;
(function (Stage) {
    Stage["latest"] = "ReleasedAndBlessed";
    Stage["preview"] = "EarlyAccessPreview";
    Stage["_released"] = "Released";
})(Stage || (Stage = {}));
function pickVersion(spec) {
    return __awaiter(this, void 0, void 0, function* () {
        spec = spec.trim();
        let versions = yield fetchVersions();
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
                throw new Error(`Invalid release label: ${spec}. Valid labels are 'latest' and 'preview'.`);
            }
            selected = versions.find(v => v.stage === stage);
        }
        if (!selected) {
            throw new Error(`No valid versions could be found for '${spec}'.`);
        }
        return selected;
    });
}
exports.default = pickVersion;
function fetchVersions() {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield fetch('https://dist.nuget.org/tools.json')
            .then(j => j.json())
            .then(n => n['nuget.exe'])).map(v => {
            return Object.assign({}, v, { uploaded: new Date(v.uploaded) });
        });
    });
}
