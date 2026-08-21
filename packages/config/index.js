/**
 * @aakasa/config — shared ESLint config, base tsconfig, and Tailwind preset
 * consumed by every app and package in the toolbox.
 *
 * This file exists only so the package resolves as a normal npm workspace
 * dependency; consumers should require the specific config they need:
 *
 *   eslint:   require('@aakasa/config/eslint/next')
 *   tsconfig: "extends": "@aakasa/config/tsconfig/nextjs.json"
 *   tailwind: presets: [require('@aakasa/config/tailwind/preset')]
 */
module.exports = {};
