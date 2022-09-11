import svelte from "rollup-plugin-svelte";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
//import livereload from "rollup-plugin-livereload";
import { terser } from "rollup-plugin-terser";
import css from "rollup-plugin-css-only";
import babel from "@rollup/plugin-babel";
import copy from "rollup-plugin-copy";
import json from "@rollup/plugin-json";

const quick = process.env.quick === "true";
const kaios3 = process.env.kaios === "3";

export default {
	input: "src/main.js",
	output: {
		sourcemap: false,
		format: "iife",
		file: `dist/build/bundle.js`,
		intro: "const PRODUCTION = true;", // no more need for replacing
	},
	plugins: [
		copy({
			targets: [{ src: "public/*", dest: "dist/" }],
		}),
		commonjs(),
		json(),
		svelte({
			compilerOptions: {
				// compiler checks makes the thing very slow
				dev: false,
			},
		}),
		// we'll extract any component CSS out into
		// a separate file - better for performance
		css({ output: "bundle.css" }),

		babel({
			extensions: [".js", ".mjs", ".html", ".svelte"],
			babelHelpers: "runtime",
			exclude: ["node_modules/@babel/**", /\/core-js\//],
			presets: [
				[
					"@babel/preset-env",
					{
						targets: { firefox: kaios3 ? "84" : "48" },
						useBuiltIns: "usage",
						corejs: 3,
						exclude: ["@babel/plugin-transform-regenerator"],
					},
				],
			],
			plugins: [
				"@babel/plugin-syntax-dynamic-import",
				"babel-plugin-transform-async-to-promises",
				[
					"@babel/plugin-transform-runtime",
					{
						regenerator: false,
						useESModules: true,
					},
				],
			],
		}),

		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration -
		// consult the documentation for details:
		// https://github.com/rollup/plugins/tree/master/packages/commonjs
		resolve({
			browser: true,
			dedupe: ["svelte"],
		}),
		!quick && terser(),
	],
};
