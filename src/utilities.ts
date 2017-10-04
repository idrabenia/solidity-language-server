import { PackageId } from "./types";

export function packageIdIsEqual(a: PackageId | undefined, b: PackageId | undefined): boolean {
    return a === b || a && b && a.name === b.name && a.subModuleName === b.subModuleName && a.version === b.version;
}
