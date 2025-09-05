module.exports = {
    apps: [
        {
            name: "PDSL-EHAT-API",
            script: "./dist/main.js",
            watch: false,
            env: {
                "NODE_ENV": "dev"
            },
            env_staging: {
                "NODE_ENV": "staging",
            },
            env_production: {
                "NODE_ENV": "production",
            }
        }
    ]
}
