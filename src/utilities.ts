import { getDirectoryPath } from "./core";
import { PackageId } from "./types";

export function packageIdIsEqual(a: PackageId | undefined, b: PackageId | undefined): boolean {
    return a === b || a && b && a.name === b.name && a.subModuleName === b.subModuleName && a.version === b.version;
}

/** Calls `callback` on `directory` and every ancestor directory it has, returning the first defined result. */
export function forEachAncestorDirectory<T>(directory: string, callback: (directory: string) => T): T {
    while (true) {
        const result = callback(directory);
        if (result !== undefined) {
            return result;
        }

        const parentPath = getDirectoryPath(directory);
        if (parentPath === directory) {
            return undefined;
        }

        directory = parentPath;
    }
}
