import {
    Diagnostic,
    DiagnosticSeverity
} from "vscode-languageserver";

export function solcErrToDiagnostic(error: string): Diagnostic {
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

export function soliumErrObjectToDiagnostic(errObject: any): Diagnostic {
    const line = errObject.line - 1;
    const severity = errObject.type === "warning" ? DiagnosticSeverity.Warning : DiagnosticSeverity.Error;

    return {
        message: `${errObject.ruleName}: ${errObject.message}`,
        range: {
            start: { character: errObject.column, line },
            end: { character: errObject.node.end, line }
        },
        severity,
    };
}
