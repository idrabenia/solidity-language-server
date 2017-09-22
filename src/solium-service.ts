import {
    Diagnostic,
    DiagnosticSeverity
} from "vscode-languageserver";

const Solium = require("solium");

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

export class SoliumService {
    private rules: any;

    constructor(rules = soliumDefaultRules) {
        this.rules = rules;
    }

    solium(text: string): Diagnostic[] {
        try {
            const errorObjects = Solium.lint(text, { rules: this.rules });
            return errorObjects.map(errObjectToDiagnostic);
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
}

function errObjectToDiagnostic(errObject: any): Diagnostic {
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
