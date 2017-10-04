import { combinePaths, getDirectoryPath, isExternalModuleNameRelative, normalizePath } from "./core";
import { CompilerOptions, ModuleResolutionHost, ResolvedModule, ResolvedModuleWithFailedLookupLocations } from "./types";

/** Array that is only intended to be pushed to, never read. */
export interface Push<T> {
    push(value: T): void;
}

/**
 * Result of trying to resolve a module.
 */
interface Resolved {
    path: string;
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

function resolvedModuleFromResolved({ path }: Resolved): ResolvedModule {
    return { resolvedFileName: path };
}

function createResolvedModuleWithFailedLookupLocations(resolved: Resolved | undefined, failedLookupLocations: string[]): ResolvedModuleWithFailedLookupLocations {
    return { resolvedModule: resolved && resolvedModuleFromResolved(resolved), failedLookupLocations };
}

export function resolveModuleName(moduleName: string, containingFile: string, _compilerOptions: CompilerOptions, host: ModuleResolutionHost): ResolvedModuleWithFailedLookupLocations {
    const failedLookupLocations: string[] = [];
    const containingDirectory = getDirectoryPath(containingFile);

    const resolved = tryResolve();
    return createResolvedModuleWithFailedLookupLocations(resolved && resolved.value, failedLookupLocations);

    function tryResolve(): SearchResult<Resolved> {
        if (!isExternalModuleNameRelative(moduleName)) {
            // FIXME: Implement.
        } else {
            const candidate = normalizePath(combinePaths(containingDirectory, moduleName));
            return toSearchResult(loadModuleFromFile(candidate, failedLookupLocations, host));
        }
    }
}

function loadModuleFromFile(candidate: string, failedLookupLocations: Push<string>, host: ModuleResolutionHost): Resolved | undefined {
    const path = tryFile(candidate, failedLookupLocations, host);
    if (path) {
        return { path };
    }
}

/** Return the file if it exists. */
function tryFile(fileName: string, failedLookupLocations: Push<string>, host: ModuleResolutionHost): string | undefined {
    if (host.fileExists(fileName)) {
        return fileName;
    }
    failedLookupLocations.push(fileName);
    return undefined;
}
