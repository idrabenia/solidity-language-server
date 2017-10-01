import { isExternalModuleNameRelative, isRootedDiskPath } from "./core";

export function moduleHasNonRelativeName(moduleName: string): boolean {
    return !(isRootedDiskPath(moduleName) || isExternalModuleNameRelative(moduleName));
}
