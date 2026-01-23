import { defineConfig } from "cypress";

export default defineConfig({
    e2e: {
        baseUrl: "https://avtoinstruktor-zor-777.vercel.app",
        viewportWidth: 1280,
        viewportHeight: 720,
        video: true,
        screenshotOnRunFailure: true,
        defaultCommandTimeout: 10000,
        pageLoadTimeout: 30000,
        setupNodeEvents(on, config) {
            // implement node event listeners here
        },
    },
});
