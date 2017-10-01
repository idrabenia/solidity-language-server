import { Diagnostic } from "vscode-languageserver";

import * as sol from "./solidity";
import { SolidityLinter } from "./solidity-linter";

const linter = new SolidityLinter();

export function getDiagnostics(path: string, text: string): Diagnostic[] {
    const linterDiagnostics = linter.lint(text);
    const compilerDiagnostics = sol.compile(path, text);

    return compilerDiagnostics.concat(linterDiagnostics);
}
