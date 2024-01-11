module.exports = {
    entry: './src/Main.ts',
    output: {
        path: '/home/jonas/.local/share/kerker/kerkers/Obsidian_Development/home/DevVault/.obsidian/plugins/obsidian-ocr/dist',
        filename: 'main.js',
        libraryTarget: 'commonjs',
        clean: true,
    },
    target: 'node',
    module: {
        rules: [{ test: /\.wasm$/, type: "asset/inline" },
        {
            test: /\.ts$/,
            loader: 'ts-loader',
            options: {
                transpileOnly: true,
            },
        }],
        noParse: /node_modules\/sql\.js\/dist\/sql-wasm\.js$/,
    },
    mode: "development",
    devtool: "inline-source-map",
    target: "node",
    optimization: {
        minimize: false,
    },
    experiments: {
        asyncWebAssembly: true,
        syncWebAssembly: true
    },
    resolve: {
        modules: ['node_modules', "src"],
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    },
    externals: {
        electron: 'commonjs2 electron',
        obsidian: 'commonjs2 obsidian',
    },
    experiments: {
        asyncWebAssembly: true,
        syncWebAssembly: true
    }  
};