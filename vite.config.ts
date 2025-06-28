import react from "@vitejs/plugin-react-swc";
import { build } from "esbuild";
import { copy } from "esbuild-plugin-copy";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  plugins: [react(), buildTasks()],
  build: {
    target: "esnext",
  },
});

function buildTasks() {
  return {
    name: "build-tasks",
    async closeBundle() {
      await build({
        entryPoints: ["tasks/**/index.ts"],
        bundle: true,
        platform: "node",
        outdir: "dist",
        outbase: ".",
        format: "cjs",
        minify: false,
        logLevel: "info",
        plugins: [
          copy({
            assets: [
              {
                from: "tasks/**/*.{json,yml}",
                to: "tasks",
              },
            ],
          }),
        ],
      });
    },
  };
}
