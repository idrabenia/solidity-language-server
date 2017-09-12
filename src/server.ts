export interface ServeOptions {
    /** Port to listen on for TCP LSP connections */
    lspPort: number;
}

export function serve(options: ServeOptions) {
    console.log(`Listening for incoming LSP connections on ${options.lspPort}`);
}
