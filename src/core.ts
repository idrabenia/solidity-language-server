import * as url from "url";

import { Observable } from "@reactivex/rxjs";

import { CharacterCodes } from "./types";

const enum Comparison {
    LessThan = -1,
    EqualTo = 0,
    GreaterThan = 1,
}

const singleAsteriskRegexFragmentFiles = "([^./]|(\\.(?!min\\.js$))?)*";
const singleAsteriskRegexFragmentOther = "[^/]*";
const reservedCharacterPattern = /[^\w\s\/]/g;

/**
 * Converts a uri to an absolute path.
 * The OS style is determined by the URI. E.g. `file:///c:/foo` always results in `c:\foo`
 *
 * @param uri a file:// uri
 */
export function uri2path(uri: string): string {
    const parts = url.parse(uri);
    if (parts.protocol !== "file:") {
        throw new Error("Cannot resolve non-file uri to path: " + uri);
    }

    let filePath = parts.pathname || "";

    // If the path starts with a drive letter, return a Windows path
    if (/^\/[a-z]:\//i.test(filePath)) {
        filePath = filePath.substr(1).replace(/\//g, "\\");
    }

    return decodeURIComponent(filePath);
}

/**
 * Converts an abolute path to a file:// uri
 *
 * @param path an absolute path
 */
export function path2uri(path: string): string {
    // Require a leading slash, on windows prefixed with drive letter
    if (!/^(?:[a-z]:)?[\\\/]/i.test(path)) {
        throw new Error(`${path} is not an absolute path`);
    }

    const parts = path.split(/[\\\/]/);

    // If the first segment is a Windows drive letter, prefix with a slash and skip encoding
    let head = parts.shift()!;
    if (head !== "") {
        head = "/" + head;
    } else {
        head = encodeURIComponent(head);
    }

    return `file://${head}/${parts.map(encodeURIComponent).join("/")}`;
}

/**
 * Normalizes URI encoding by encoding _all_ special characters in the pathname
 */
export function normalizeUri(uri: string): string {
    const parts = url.parse(uri);
    if (!parts.pathname) {
        return uri;
    }
    const pathParts = parts.pathname.split("/").map(segment => encodeURIComponent(decodeURIComponent(segment)));
    // Decode Windows drive letter colon
    if (/^[a-z]%3A$/i.test(pathParts[1])) {
        pathParts[1] = decodeURIComponent(pathParts[1]);
    }
    parts.pathname = pathParts.join("/");
    return url.format(parts);
}

export function getDirectoryPath(path: string): string {
    return path.substr(0, Math.max(getRootLength(path), path.lastIndexOf(directorySeparator)));
}

/**
 * Returns length of path root (i.e. length of "/", "x:/", "//server/share/, file:///user/files")
 */
export function getRootLength(path: string): number {
    if (path.charCodeAt(0) === CharacterCodes.slash) {
        if (path.charCodeAt(1) !== CharacterCodes.slash) return 1;
        const p1 = path.indexOf("/", 2);
        if (p1 < 0) return 2;
        const p2 = path.indexOf("/", p1 + 1);
        if (p2 < 0) return p1 + 1;
        return p2 + 1;
    }
    if (path.charCodeAt(1) === CharacterCodes.colon) {
        if (path.charCodeAt(2) === CharacterCodes.slash) return 3;
        return 2;
    }
    // Per RFC 1738 'file' URI schema has the shape file://<host>/<path>
    // if <host> is omitted then it is assumed that host value is 'localhost',
    // however slash after the omitted <host> is not removed.
    // file:///folder1/file1 - this is a correct URI
    // file://folder2/file2 - this is an incorrect URI
    if (path.lastIndexOf("file:///", 0) === 0) {
        return "file:///".length;
    }
    const idx = path.indexOf("://");
    if (idx !== -1) {
        return idx + "://".length;
    }
    return 0;
}

/**
 * Gets the actual offset into an array for a relative offset. Negative offsets indicate a
 * position offset from the end of the array.
 */
function toOffset(array: ReadonlyArray<any>, offset: number) {
    return offset < 0 ? array.length + offset : offset;
}

/**
 * Returns the element at a specific offset in an array if non-empty, `undefined` otherwise.
 * A negative offset indicates the element should be retrieved from the end of the array.
 */
export function elementAt<T>(array: ReadonlyArray<T> | undefined, offset: number): T | undefined {
    if (array) {
        offset = toOffset(array, offset);
        if (offset < array.length) {
            return array[offset];
        }
    }
    return undefined;
}

/**
 * Returns the first element of an array if non-empty, `undefined` otherwise.
 */
export function firstOrUndefined<T>(array: ReadonlyArray<T>): T | undefined {
    return elementAt(array, 0);
}

/**
 * Returns the last element of an array if non-empty, `undefined` otherwise.
 */
export function lastOrUndefined<T>(array: ReadonlyArray<T>): T | undefined {
    return elementAt(array, -1);
}

/**
 * Internally, we represent paths as strings with '/' as the directory separator.
 * When we make system calls (eg: LanguageServiceHost.getDirectory()),
 * we expect the host to correctly handle paths in our specified format.
 */
export const directorySeparator = "/";
const directorySeparatorCharCode = CharacterCodes.slash;

export function normalizeSlashes(path: string): string {
    return path.replace(/\\/g, "/");
}

function getNormalizedParts(normalizedSlashedPath: string, rootLength: number): string[] {
    const parts = normalizedSlashedPath.substr(rootLength).split(directorySeparator);
    const normalized: string[] = [];
    for (const part of parts) {
        if (part !== ".") {
            if (part === ".." && normalized.length > 0 && lastOrUndefined(normalized) !== "..") {
                normalized.pop();
            }
            else {
                // A part may be an empty string (which is 'falsy') if the path had consecutive slashes,
                // e.g. "path//file.ts".  Drop these before re-joining the parts.
                if (part) {
                    normalized.push(part);
                }
            }
        }
    }

    return normalized;
}

/** A path ending with '/' refers to a directory only, never a file. */
export function pathEndsWithDirectorySeparator(path: string): boolean {
    return path.charCodeAt(path.length - 1) === directorySeparatorCharCode;
}

export function normalizePath(path: string): string {
    path = normalizeSlashes(path);
    const rootLength = getRootLength(path);
    const root = path.substr(0, rootLength);
    const normalized = getNormalizedParts(path, rootLength);
    if (normalized.length) {
        const joinedParts = root + normalized.join(directorySeparator);
        return pathEndsWithDirectorySeparator(path) ? joinedParts + directorySeparator : joinedParts;
    }
    else {
        return root;
    }
}

export function combinePaths(path1: string, path2: string) {
    if (!(path1 && path1.length)) return path2;
    if (!(path2 && path2.length)) return path1;
    if (getRootLength(path2) !== 0) return path2;
    if (path1.charAt(path1.length - 1) === directorySeparator) return path1 + path2;
    return path1 + directorySeparator + path2;
}

export function isExternalModuleNameRelative(moduleName: string): boolean {
    // An external module name is "relative" if the first term is "." or "..".
    return /^\.\.?($|[\\/])/.test(moduleName);
}

export function isRootedDiskPath(path: string) {
    return getRootLength(path) !== 0;
}

/**
 * Normalizes path to match POSIX standard (slashes)
 * This conversion should only be necessary to convert windows paths when calling TS APIs.
 */
export function toUnixPath(filePath: string): string {
    return filePath.replace(/\\/g, "/");
}

export interface FileSystemEntries {
    files: string[];
    directories: string[];
}

export function matchFiles(path: string, extensions: string[], excludes: string[], includes: string[], useCaseSensitiveFileNames: boolean, currentDirectory: string, getFileSystemEntries: (path: string) => FileSystemEntries): string[] {
    path = normalizePath(path);
    currentDirectory = normalizePath(currentDirectory);

    const patterns = getFileMatcherPatterns(path, extensions, excludes, includes, useCaseSensitiveFileNames, currentDirectory);

    const regexFlag = useCaseSensitiveFileNames ? "" : "i";

    const includeFileRegex = patterns.includeFilePattern && new RegExp(patterns.includeFilePattern, regexFlag);

    const includeDirectoryRegex = patterns.includeDirectoryPattern && new RegExp(patterns.includeDirectoryPattern, regexFlag);
    const excludeRegex = patterns.excludePattern && new RegExp(patterns.excludePattern, regexFlag);

    const result: string[] = [];
    for (const basePath of patterns.basePaths) {
        visitDirectory(basePath, combinePaths(currentDirectory, basePath));
    }
    return result;

    function visitDirectory(path: string, absolutePath: string) {
        const { files, directories } = getFileSystemEntries(path);

        for (const current of files) {
            const name = combinePaths(path, current);
            const absoluteName = combinePaths(absolutePath, current);
            if ((!extensions || fileExtensionIsAny(name, extensions)) &&
                (!includeFileRegex || includeFileRegex.test(absoluteName)) &&
                (!excludeRegex || !excludeRegex.test(absoluteName))) {
                result.push(name);
            }
        }

        for (const current of directories) {
            const name = combinePaths(path, current);
            const absoluteName = combinePaths(absolutePath, current);
            if ((!includeDirectoryRegex || includeDirectoryRegex.test(absoluteName)) &&
                (!excludeRegex || !excludeRegex.test(absoluteName))) {
                visitDirectory(name, absoluteName);
            }
        }
    }
}

interface FileMatcherPatterns {
    includeFilePattern: string;
    includeDirectoryPattern: string;
    excludePattern: string;
    basePaths: string[];
}

function contains<T>(array: T[], value: T): boolean {
    if (array) {
        for (const v of array) {
            if (v === value) {
                return true;
            }
        }
    }
    return false;
}

function indexOfAnyCharCode(text: string, charCodes: number[], start?: number): number {
    for (let i = start || 0, len = text.length; i < len; i++) {
        if (contains(charCodes, text.charCodeAt(i))) {
            return i;
        }
    }
    return -1;
}

const wildcardCharCodes = [CharacterCodes.asterisk, CharacterCodes.question];

function removeTrailingDirectorySeparator(path: string) {
    if (path.charAt(path.length - 1) === directorySeparator) {
        return path.substr(0, path.length - 1);
    }

    return path;
}

function compareStrings(a: string, b: string, ignoreCase?: boolean): Comparison {
    if (a === b) return Comparison.EqualTo;
    if (a === undefined) return Comparison.LessThan;
    if (b === undefined) return Comparison.GreaterThan;
    if (ignoreCase) {
        if (String.prototype.localeCompare) {
            const result = a.localeCompare(b, /*locales*/ undefined, { usage: "sort", sensitivity: "accent" });
            return result < 0 ? Comparison.LessThan : result > 0 ? Comparison.GreaterThan : Comparison.EqualTo;
        }

        a = a.toUpperCase();
        b = b.toUpperCase();
        if (a === b) return Comparison.EqualTo;
    }

    return a < b ? Comparison.LessThan : Comparison.GreaterThan;
}

function compareStringsCaseInsensitive(a: string, b: string) {
    return compareStrings(a, b, /*ignoreCase*/ true);
}

function getBasePaths(path: string, includes: string[], useCaseSensitiveFileNames: boolean) {
    // Storage for our results in the form of literal paths (e.g. the paths as written by the user).
    const basePaths: string[] = [path];
    if (includes) {
        // Storage for literal base paths amongst the include patterns.
        const includeBasePaths: string[] = [];
        for (const include of includes) {
            // We also need to check the relative paths by converting them to absolute and normalizing
            // in case they escape the base path (e.g "..\somedirectory")
            const absolute: string = isRootedDiskPath(include) ? include : normalizePath(combinePaths(path, include));

            const wildcardOffset = indexOfAnyCharCode(absolute, wildcardCharCodes);
            const includeBasePath = wildcardOffset < 0
                ? removeTrailingDirectorySeparator(getDirectoryPath(absolute))
                : absolute.substring(0, absolute.lastIndexOf(directorySeparator, wildcardOffset));

            // Append the literal and canonical candidate base paths.
            includeBasePaths.push(includeBasePath);
        }

        // Sort the offsets array using either the literal or canonical path representations.
        includeBasePaths.sort(useCaseSensitiveFileNames ? compareStrings : compareStringsCaseInsensitive);

        // Iterate over each include base path and include unique base paths that are not a
        // subpath of an existing base path
        include: for (let i = 0; i < includeBasePaths.length; i++) {
            const includeBasePath = includeBasePaths[i];
            for (let j = 0; j < basePaths.length; j++) {
                if (containsPath(basePaths[j], includeBasePath, path, !useCaseSensitiveFileNames)) {
                    continue include;
                }
            }

            basePaths.push(includeBasePath);
        }
    }

    return basePaths;
}

function containsPath(parent: string, child: string, currentDirectory: string, ignoreCase?: boolean) {
    if (parent === undefined || child === undefined) return false;
    if (parent === child) return true;
    parent = removeTrailingDirectorySeparator(parent);
    child = removeTrailingDirectorySeparator(child);
    if (parent === child) return true;
    const parentComponents = getNormalizedPathComponents(parent, currentDirectory);
    const childComponents = getNormalizedPathComponents(child, currentDirectory);
    if (childComponents.length < parentComponents.length) {
        return false;
    }

    for (let i = 0; i < parentComponents.length; i++) {
        const result = compareStrings(parentComponents[i], childComponents[i], ignoreCase);
        if (result !== Comparison.EqualTo) {
            return false;
        }
    }

    return true;
}

function getFileMatcherPatterns(path: string, _extensions: string[], excludes: string[], includes: string[], useCaseSensitiveFileNames: boolean, currentDirectory: string): FileMatcherPatterns {
    path = normalizePath(path);
    currentDirectory = normalizePath(currentDirectory);
    const absolutePath = combinePaths(currentDirectory, path);

    return {
        includeFilePattern: getRegularExpressionForWildcard(includes, absolutePath, "files") || "",
        includeDirectoryPattern: getRegularExpressionForWildcard(includes, absolutePath, "directories") || "",
        excludePattern: getRegularExpressionForWildcard(excludes, absolutePath, "exclude") || "",
        basePaths: getBasePaths(path, includes, useCaseSensitiveFileNames) || [],
    };
}

function replaceWildCardCharacterFiles(match: string) {
    return replaceWildcardCharacter(match, singleAsteriskRegexFragmentFiles);
}

function replaceWildCardCharacterOther(match: string) {
    return replaceWildcardCharacter(match, singleAsteriskRegexFragmentOther);
}

function replaceWildcardCharacter(match: string, singleAsteriskRegexFragment: string) {
    return match === "*" ? singleAsteriskRegexFragment : match === "?" ? "[^/]" : "\\" + match;
}

function getRegularExpressionForWildcard(specs: string[], basePath: string, usage: "files" | "directories" | "exclude") {
    if (specs === undefined || specs.length === 0) {
        return undefined;
    }

    const replaceWildcardCharacter = usage === "files" ? replaceWildCardCharacterFiles : replaceWildCardCharacterOther;
    const singleAsteriskRegexFragment = usage === "files" ? singleAsteriskRegexFragmentFiles : singleAsteriskRegexFragmentOther;

    /**
     * Regex for the ** wildcard. Matches any number of subdirectories. When used for including
     * files or directories, does not match subdirectories that start with a . character
     */
    const doubleAsteriskRegexFragment = usage === "exclude" ? "(/.+?)?" : "(/[^/.][^/]*)*?";

    let pattern = "";
    let hasWrittenSubpattern = false;
    spec: for (const spec of specs) {
        if (!spec) {
            continue;
        }

        let subpattern = "";
        let hasRecursiveDirectoryWildcard = false;
        let hasWrittenComponent = false;
        const components = getNormalizedPathComponents(spec, basePath);
        if (usage !== "exclude" && components[components.length - 1] === "**") {
            continue spec;
        }

        // getNormalizedPathComponents includes the separator for the root component.
        // We need to remove to create our regex correctly.
        components[0] = removeTrailingDirectorySeparator(components[0]);

        let optionalCount = 0;
        for (let component of components) {
            if (component === "**") {
                if (hasRecursiveDirectoryWildcard) {
                    continue spec;
                }

                subpattern += doubleAsteriskRegexFragment;
                hasRecursiveDirectoryWildcard = true;
                hasWrittenComponent = true;
            }
            else {
                if (usage === "directories") {
                    subpattern += "(";
                    optionalCount++;
                }

                if (hasWrittenComponent) {
                    subpattern += directorySeparator;
                }

                if (usage !== "exclude") {
                    // The * and ? wildcards should not match directories or files that start with . if they
                    // appear first in a component. Dotted directories and files can be included explicitly
                    // like so: **/.*/.*
                    if (component.charCodeAt(0) === CharacterCodes.asterisk) {
                        subpattern += "([^./]" + singleAsteriskRegexFragment + ")?";
                        component = component.substr(1);
                    }
                    else if (component.charCodeAt(0) === CharacterCodes.question) {
                        subpattern += "[^./]";
                        component = component.substr(1);
                    }
                }

                subpattern += component.replace(reservedCharacterPattern, replaceWildcardCharacter);
                hasWrittenComponent = true;
            }
        }

        while (optionalCount > 0) {
            subpattern += ")?";
            optionalCount--;
        }

        if (hasWrittenSubpattern) {
            pattern += "|";
        }

        pattern += "(" + subpattern + ")";
        hasWrittenSubpattern = true;
    }

    if (!pattern) {
        return undefined;
    }

    return "^(" + pattern + (usage === "exclude" ? ")($|/)" : ")$");
}

function getNormalizedPathComponents(path: string, currentDirectory: string) {
    path = normalizeSlashes(path);
    let rootLength = getRootLength(path);
    if (rootLength === 0) {
        // If the path is not rooted it is relative to current directory
        path = combinePaths(normalizeSlashes(currentDirectory), path);
        rootLength = getRootLength(path);
    }

    return normalizedPathComponents(path, rootLength);
}

function normalizedPathComponents(path: string, rootLength: number) {
    const normalizedParts = getNormalizedParts(path, rootLength);
    return [path.substr(0, rootLength)].concat(normalizedParts);
}

function endsWith(str: string, suffix: string): boolean {
    const expectedPos = str.length - suffix.length;
    return expectedPos >= 0 && str.indexOf(suffix, expectedPos) === expectedPos;
}

function fileExtensionIs(path: string, extension: string): boolean {
    return path.length > extension.length && endsWith(path, extension);
}

function fileExtensionIsAny(path: string, extensions: string[]): boolean {
    for (const extension of extensions) {
        if (fileExtensionIs(path, extension)) {
            return true;
        }
    }

    return false;
}

const solidityPattern = /\.sol$/;

export function isSolidityFile(filename: string): boolean {
    return solidityPattern.test(filename);
}

const packageJsonPattern = /(^|\/)package\.json$/;

export function isPackageJsonFile(filename: string): boolean {
    return packageJsonPattern.test(filename);
}

/**
 * Converts an Iterable to an Observable.
 * Workaround for https://github.com/ReactiveX/rxjs/issues/2306
 */
export function observableFromIterable<T>(iterable: Iterable<T>): Observable<T> {
    return Observable.from(iterable as any);
}
