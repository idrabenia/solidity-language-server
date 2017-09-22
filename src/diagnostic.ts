import { Diagnostic } from "vscode-languageserver";

import { SolidityCompiler } from "./solidity-compiler";
import { SolidityLinter } from "./solidity-linter";

const compiler = new SolidityCompiler();
const linter = new SolidityLinter();

export function getDiagnostics(path: string, text: string): Diagnostic[] {
    const linterDiagnostics = linter.lint(text);
    const compilerDiagnostics = compiler.compile(path, text);

    return compilerDiagnostics.concat(linterDiagnostics);
}
