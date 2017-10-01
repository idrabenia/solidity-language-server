import {
    Diagnostic,
    DiagnosticSeverity
} from "vscode-languageserver";

const solc = require("solc");

export function compile(path: string, text: string): Diagnostic[] {
    const input = { [path]: text };
    const output = compileContracts({ sources: input });
    if (!output.errors) return [];
    return output.errors.map(solcErrToDiagnostic);
}

function compileContracts(sources: any): { errors: string[] } {
    // Setting 1 as second paramater activates the optimiser
    return solc.compile(sources, 1);
}

function solcErrToDiagnostic(error: string): Diagnostic {
    const errorSegments = error.split(":");
    const line = parseInt(errorSegments[1]);
    const column = parseInt(errorSegments[2]);
    const severity = getDiagnosticSeverity(errorSegments[3]);

    return {
        message: error,
        range: {
            start: {
                line: line - 1,
                character: column
            },
            end: {
                line: line - 1,
                character: column
            },
        },
        severity
    };
}

function getDiagnosticSeverity(severity: string): DiagnosticSeverity {
    switch (severity) {
        case " Error":
            return DiagnosticSeverity.Error;
        case " Warning":
            return DiagnosticSeverity.Warning;
        default:
            return DiagnosticSeverity.Error;
    }
}
