import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "path";
import { patchCssModules } from "vite-css-modules";

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    build: {
      outDir: "build",
    },
    resolve: {
      alias: {
        src: path.resolve(__dirname, "./src"),
      },
    },
    plugins: [
      react({
        babel: {
          plugins: [
            [
              "react-css-modules", // important for importing css modules as styleName
              {
                filetypes: {
                  ".scss": {
                    syntax: "postcss-scss",
                    plugins: ["postcss-nested"],
                  },
                },
                exclude: "node_modules",
                handleMissingStyleName: "ignore",
                generateScopedName: "[path]___[name]__[local]", // used to be [path]___[name]__[local]___[hash:base64:5]
              },
            ],
          ],
        },
      }),
      svgr(),
      patchCssModules(), // fixes the issue where css modules are not included in the build
    ],
    css: {
      modules: {
        generateScopedName: "[path]___[name]__[local]",
      },
    },
  };
});
