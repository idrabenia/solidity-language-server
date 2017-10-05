/**
 * Schema of a ethpm.json
 */
export interface EthPMJson {
    package_name: string;
    version: string;
    description?: string;
    authors?: string[];
    keywords?: string[];
    license?: string;
}
