import { Diagnostic } from "vscode-languageserver";

import * as sol from "./solidity";

export function getDiagnostics(path: string, text: string): Diagnostic[] {
    const linterDiagnostics = sol.lint(text);
    const compilerDiagnostics = sol.compile(path, text);

    return compilerDiagnostics.concat(linterDiagnostics);
}
