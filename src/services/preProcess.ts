const solparse = require("solparse");

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
