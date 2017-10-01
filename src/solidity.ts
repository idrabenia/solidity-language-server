import {
    Diagnostic,
    DiagnosticSeverity
} from "vscode-languageserver";

const solc = require("solc");
const Solium = require("solium");
const solparse = require("solparse");

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

export const soliumDefaultRules = {
    "array-declarations": true,
    "blank-lines": false,
    "camelcase": true,
    "deprecated-suicide": true,
    "double-quotes": true,
    "imports-on-top": true,
    "indentation": false,
    "lbrace": true,
    "mixedcase": true,
    "no-empty-blocks": true,
    "no-unused-vars": true,
    "no-with": true,
    "operator-whitespace": true,
    "pragma-on-top": true,
    "uppercase": true,
    "variable-declarations": true,
    "whitespace": true
};

export function lint(text: string, rules = soliumDefaultRules): Diagnostic[] {
    try {
        const errorObjects = Solium.lint(text, { rules });
        return errorObjects.map(soliumErrObjectToDiagnostic);
    } catch (err) {
        const match = /An error .*?\nSyntaxError: (.*?) Line: (\d+), Column: (\d+)/.exec(err.message);
        if (!match) {
            // FIXME: Send an error message.
            return [];
        }

        const line = parseInt(match[2], 10) - 1;
        const character = parseInt(match[3], 10) - 1;

        return [
            {
                message: `Syntax error: ${match[1]}`,
                range: {
                    start: { character, line },
                    end: { character, line }
                },
                severity: DiagnosticSeverity.Error,
            },
        ];
    }
}

function soliumErrObjectToDiagnostic(errObject: any): Diagnostic {
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

interface FileReference {
    fileName: string;
}

interface PreProcessedFileInfo {
    importedFiles: FileReference[];
}

export function preProcessFile(sourceText: string): PreProcessedFileInfo {
    let result;
    try {
        result = solparse.parse(sourceText);
    } catch (err) {
        return { importedFiles: [] };
    }

    const importedFiles: FileReference[] = [];
    for (const element of result.body) {
        if (element.type !== "ImportStatement") {
            continue;
        }
        importedFiles.push({
            fileName: element.from
        });
    }
    return { importedFiles };
}
