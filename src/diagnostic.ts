import { Diagnostic } from "vscode-languageserver";

import { SolidityCompiler } from "./solidity-compiler";
import { SoliumService } from "./solium-service";

const compiler = new SolidityCompiler();
const solium = new SoliumService();

export function getDiagnostics(path: string, text: string): Diagnostic[] {
    const soliumDiagnostics = solium.lint(text);
    const compilerDiagnostics = compiler.compile(path, text);

    return compilerDiagnostics.concat(soliumDiagnostics);
}
