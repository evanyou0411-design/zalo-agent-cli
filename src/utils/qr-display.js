/**
 * Cross-platform QR display utility.
 * Outputs QR in multiple formats for maximum compatibility:
 * 1. ASCII QR in terminal (if TTY)
 * 2. Save PNG to config dir
 * 3. Base64 data URL (for IDE/agent preview)
 * 4. File path with platform-specific open hint
 *
 * IMPORTANT: This function must be synchronous-safe because zca-js
 * calls the QR callback synchronously. File save is fire-and-forget.
 */

import { resolve } from "path";
import { writeFileSync, mkdirSync } from "fs";
import { platform } from "os";
import qrcode from "qrcode-terminal";
import { CONFIG_DIR } from "../core/credentials.js";
import { info } from "./output.js";

const QR_PATH = resolve(CONFIG_DIR, "qr.png");

/** Get platform-specific command to open a file. */
function getOpenCommand() {
    switch (platform()) {
        case "darwin":
            return "open";
        case "win32":
            return "start";
        default:
            return "xdg-open";
    }
}

/** Check if running in headless/CI environment. */
function isHeadless() {
    return !process.stdout.isTTY || process.env.CI === "true" || process.env.CI === "1";
}

/**
 * Display QR code from a zca-js login QR event.
 * Synchronous — safe to call from zca-js callback.
 * @param {object} event - zca-js QR callback event
 */
export function displayQR(event) {
    const code = event.data?.code || "";
    const imageB64 = event.data?.image || "";

    // 1. ASCII QR in terminal (skip in headless — unreadable in CI logs)
    if (code && !isHeadless()) {
        qrcode.generate(code, { small: true });
    }

    // 2. Save PNG to config dir from base64 image data
    if (imageB64) {
        try {
            mkdirSync(CONFIG_DIR, { recursive: true });
            writeFileSync(QR_PATH, Buffer.from(imageB64, "base64"));
            const openCmd = getOpenCommand();
            info(`QR image saved: ${QR_PATH}`);
            info(`To open: ${openCmd} "${QR_PATH}"`);
        } catch {}
    }

    // 3. Also fire-and-forget the zca-js built-in save (different format)
    if (event.actions?.saveToFile) {
        event.actions.saveToFile(QR_PATH).catch(() => {});
    }

    // 4. Base64 data URL (for coding agents / IDE preview)
    if (imageB64) {
        info("QR data URL (for IDE preview):");
        console.log(`  data:image/png;base64,${imageB64.substring(0, 100)}...`);
        // Full URL available in file — truncated here to avoid flooding terminal
    }
}

/** Get the QR image path. */
export function getQRPath() {
    return QR_PATH;
}
