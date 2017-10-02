import * as url from "url";

import { CharacterCodes } from "./types";

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
 * Returns the first element of an array if non-empty, `undefined` otherwise.
 */
export function firstOrUndefined<T>(array: T[]): T {
    return (array && array.length > 0
        ? array[0]
        : undefined) as T;
}

/**
 * Returns the last element of an array if non-empty, `undefined` otherwise.
 */
export function lastOrUndefined<T>(array: T[]): T {
    return (array && array.length > 0
        ? array[array.length - 1]
        : undefined) as T;
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
