import {
    combinePaths,
    contains,
    createMap,
    directorySeparator,
    getDirectoryPath,
    isExternalModuleNameRelative,
    toPath
} from "./core";
import { normalizePathAndParts, pathEndsWithDirectorySeparator } from "./core";
import { PackageId } from "./types";
import {
    CompilerOptions,
    Extension,
    Map,
    ModuleResolutionHost,
    Path,
    ResolvedModuleWithFailedLookupLocations
} from "./types";

/** Result of trying to resolve a module at a file. Needs to have 'packageId' added later. */
interface PathAndExtension {
    path: string;
    // (Use a different name than `extension` to make sure Resolved isn't assignable to PathAndExtension.)
    ext: Extension;
}

/** Array that is only intended to be pushed to, never read. */
export interface Push<T> {
    push(value: T): void;
}

interface ModuleResolutionState {
    host: ModuleResolutionHost;
    compilerOptions: CompilerOptions;
}

export interface PerModuleNameCache {
    get(directory: string): ResolvedModuleWithFailedLookupLocations;
    set(directory: string, result: ResolvedModuleWithFailedLookupLocations): void;
}

/**
 * Stored map from non-relative module name to a table: directory -> result of module lookup in this directory
 * We support only non-relative module names because resolution of relative module names is usually more deterministic and thus less expensive.
 */
export interface NonRelativeModuleNameResolutionCache {
    getOrCreateCacheForModuleName(nonRelativeModuleName: string): PerModuleNameCache;
}

/**
 * Cached module resolutions per containing directory.
 * This assumes that any module id will have the same resolution for sibling files located in the same folder.
 */
export interface ModuleResolutionCache extends NonRelativeModuleNameResolutionCache {
    getOrCreateCacheForDirectory(directoryName: string): Map<ResolvedModuleWithFailedLookupLocations>;
}

export function createModuleResolutionCache(currentDirectory: string, getCanonicalFileName: (s: string) => string): ModuleResolutionCache {
    const directoryToModuleNameMap = createMap<Map<ResolvedModuleWithFailedLookupLocations>>();
    const moduleNameToDirectoryMap = createMap<PerModuleNameCache>();

    return { getOrCreateCacheForDirectory, getOrCreateCacheForModuleName };

    function getOrCreateCacheForDirectory(directoryName: string) {
        const path = toPath(directoryName, currentDirectory, getCanonicalFileName);
        let perFolderCache = directoryToModuleNameMap.get(path);
        if (!perFolderCache) {
            perFolderCache = createMap<ResolvedModuleWithFailedLookupLocations>();
            directoryToModuleNameMap.set(path, perFolderCache);
        }
        return perFolderCache;
    }

    function getOrCreateCacheForModuleName(nonRelativeModuleName: string) {
        if (isExternalModuleNameRelative(nonRelativeModuleName)) {
            return undefined;
        }
        let perModuleNameCache = moduleNameToDirectoryMap.get(nonRelativeModuleName);
        if (!perModuleNameCache) {
            perModuleNameCache = createPerModuleNameCache();
            moduleNameToDirectoryMap.set(nonRelativeModuleName, perModuleNameCache);
        }
        return perModuleNameCache;
    }

    function createPerModuleNameCache(): PerModuleNameCache {
        const directoryPathMap = createMap<ResolvedModuleWithFailedLookupLocations>();

        return { get, set };

        function get(directory: string): ResolvedModuleWithFailedLookupLocations {
            return directoryPathMap.get(toPath(directory, currentDirectory, getCanonicalFileName));
        }

        /**
         * At first this function add entry directory -> module resolution result to the table.
         * Then it computes the set of parent folders for 'directory' that should have the same module resolution result
         * and for every parent folder in set it adds entry: parent -> module resolution. .
         * Lets say we first directory name: /a/b/c/d/e and resolution result is: /a/b/bar.ts.
         * Set of parent folders that should have the same result will be:
         * [
         *     /a/b/c/d, /a/b/c, /a/b
         * ]
         * this means that request for module resolution from file in any of these folder will be immediately found in cache.
         */
        function set(directory: string, result: ResolvedModuleWithFailedLookupLocations): void {
            const path = toPath(directory, currentDirectory, getCanonicalFileName);
            // if entry is already in cache do nothing
            if (directoryPathMap.has(path)) {
                return;
            }
            directoryPathMap.set(path, result);

            const resolvedFileName = result.resolvedModule && result.resolvedModule.resolvedFileName;
            // find common prefix between directory and resolved file name
            // this common prefix should be the shorted path that has the same resolution
            // directory: /a/b/c/d/e
            // resolvedFileName: /a/b/foo.d.ts
            const commonPrefix = getCommonPrefix(path, resolvedFileName);
            let current = path;
            while (true) {
                const parent = getDirectoryPath(current);
                if (parent === current || directoryPathMap.has(parent)) {
                    break;
                }
                directoryPathMap.set(parent, result);
                current = parent;

                if (current === commonPrefix) {
                    break;
                }
            }
        }

        function getCommonPrefix(directory: Path, resolution: string) {
            if (resolution === undefined) {
                return undefined;
            }
            const resolutionDirectory = toPath(getDirectoryPath(resolution), currentDirectory, getCanonicalFileName);

            // find first position where directory and resolution differs
            let i = 0;
            while (i < Math.min(directory.length, resolutionDirectory.length) && directory.charCodeAt(i) === resolutionDirectory.charCodeAt(i)) {
                i++;
            }

            // find last directory separator before position i
            const sep = directory.lastIndexOf(directorySeparator, i);
            if (sep < 0) {
                return undefined;
            }

            return directory.substr(0, sep);
        }
    }
}

/**
 * Result of trying to resolve a module.
 */
interface Resolved {
    path: string;
    extension: Extension;
    packageId: PackageId | undefined;
}

/**
 * Represents result of search. Normally when searching among several alternatives we treat value `undefined` as indicator
 * that search fails and we should try another option.
 * However this does not allow us to represent final result that should be used instead of further searching (i.e. a final result that was found in cache).
 * SearchResult is used to deal with this issue, its values represents following outcomes:
 * - undefined - not found, continue searching
 * - { value: undefined } - not found - stop searching
 * - { value: <some-value> } - found - stop searching
 */
type SearchResult<T> = { value: T | undefined } | undefined;

/**
 * Wraps value to SearchResult.
 * @returns undefined if value is undefined or { value } otherwise
 */
function toSearchResult<T>(value: T | undefined): SearchResult<T> {
    return value !== undefined ? { value } : undefined;
}

function createResolvedModuleWithFailedLookupLocations(resolved: Resolved | undefined, isExternalLibraryImport: boolean, failedLookupLocations: string[]): ResolvedModuleWithFailedLookupLocations {
    return {
        resolvedModule: resolved && { resolvedFileName: resolved.path, extension: resolved.extension, isExternalLibraryImport, packageId: resolved.packageId },
        failedLookupLocations
    };
}

export function resolveModuleName(moduleName: string, containingFile: string, compilerOptions: CompilerOptions, host: ModuleResolutionHost, cache?: ModuleResolutionCache): ResolvedModuleWithFailedLookupLocations {
    const containingDirectory = getDirectoryPath(containingFile);

    const perFolderCache = cache && cache.getOrCreateCacheForDirectory(containingDirectory);
    let result = perFolderCache && perFolderCache.get(moduleName);
    if (!result) {
        result = solidityNameResolver(moduleName, containingFile, compilerOptions, host, cache);

        if (perFolderCache) {
            perFolderCache.set(moduleName, result);
            // put result in per-module name cache
            const perModuleNameCache = cache.getOrCreateCacheForModuleName(moduleName);
            if (perModuleNameCache) {
                perModuleNameCache.set(containingDirectory, result);
            }
        }
    }

    return result;
}

export function solidityNameResolver(moduleName: string, containingFile: string, compilerOptions: CompilerOptions, host: ModuleResolutionHost, cache?: ModuleResolutionCache): ResolvedModuleWithFailedLookupLocations {
    return solidityModuleNameResolverWorker(moduleName, getDirectoryPath(containingFile), compilerOptions, host, cache);
}

function solidityModuleNameResolverWorker(moduleName: string, containingDirectory: string, compilerOptions: CompilerOptions, host: ModuleResolutionHost, _cache: ModuleResolutionCache | undefined): ResolvedModuleWithFailedLookupLocations {
    const failedLookupLocations: string[] = [];
    const state: ModuleResolutionState = { compilerOptions, host };

    const result = tryResolve();
    if (result && result.value) {
        const { resolved, isExternalLibraryImport } = result.value;
        return createResolvedModuleWithFailedLookupLocations(resolved, isExternalLibraryImport, failedLookupLocations);
    }
    return { resolvedModule: undefined, failedLookupLocations };

    function tryResolve(): SearchResult<{ resolved: Resolved, isExternalLibraryImport: boolean }> {
        if (!isExternalModuleNameRelative(moduleName)) {
            // FIXME: Implement.
        } else {
            const { path: candidate, parts } = normalizePathAndParts(combinePaths(containingDirectory, moduleName));
            const resolved = solidityLoadModuleByRelativeName(candidate, failedLookupLocations, /*onlyRecordFailures*/ false, state);
            // Treat explicit "node_modules" import as an external library import.
            return resolved && toSearchResult({ resolved, isExternalLibraryImport: contains(parts, "node_modules") });
        }
    }
}

function solidityLoadModuleByRelativeName(candidate: string, failedLookupLocations: Push<string>, onlyRecordFailures: boolean, state: ModuleResolutionState): Resolved | undefined {
    if (!pathEndsWithDirectorySeparator(candidate)) {
        if (!onlyRecordFailures) {
            const parentOfCandidate = getDirectoryPath(candidate);
            if (!directoryProbablyExists(parentOfCandidate, state.host)) {
                onlyRecordFailures = true;
            }
        }
        const resolvedFromFile = loadModuleFromFile(candidate, failedLookupLocations, onlyRecordFailures, state);
        if (resolvedFromFile) {
            return noPackageId(resolvedFromFile);
        }
    }
}

/**
 * @param {boolean} onlyRecordFailures - if true then function won't try to actually load files but instead record all attempts as failures. This flag is necessary
 * in cases when we know upfront that all load attempts will fail (because containing folder does not exists) however we still need to record all failed lookup locations.
 */
function loadModuleFromFile(candidate: string, failedLookupLocations: Push<string>, onlyRecordFailures: boolean, state: ModuleResolutionState): PathAndExtension | undefined {
    const path = tryFile(candidate, failedLookupLocations, onlyRecordFailures, state);
    return path && { path, ext: Extension.Sol };
}

/** Return the file if it exists. */
function tryFile(fileName: string, failedLookupLocations: Push<string>, onlyRecordFailures: boolean, state: ModuleResolutionState): string | undefined {
    if (!onlyRecordFailures) {
        if (state.host.fileExists(fileName)) {
            return fileName;
        }
    }
    failedLookupLocations.push(fileName);
    return undefined;
}

export function directoryProbablyExists(directoryName: string, host: { directoryExists?: (directoryName: string) => boolean }): boolean {
    // if host does not support 'directoryExists' assume that directory will exist
    return !host.directoryExists || host.directoryExists(directoryName);
}

function withPackageId(packageId: PackageId | undefined, r: PathAndExtension | undefined): Resolved {
    return r && { path: r.path, extension: r.ext, packageId };
}

function noPackageId(r: PathAndExtension | undefined): Resolved {
    return withPackageId(/*packageId*/ undefined, r);
}
