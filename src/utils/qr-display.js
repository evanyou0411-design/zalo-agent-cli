/**
 * Cross-platform QR display utility.
 * Displays Zalo's official QR PNG inline in terminal and saves to file.
 *
 * IMPORTANT: Uses Zalo-server-generated PNG (via event.data.image base64),
 * NOT qrcode-terminal which re-encodes the token text into a different QR
 * that Zalo app cannot recognize as a login request.
 *
 * Display methods:
 * 1. iTerm2/Kitty/WezTerm inline image (renders PNG directly in terminal)
 * 2. Save PNG to config dir
 * 3. Base64 data URL (for IDE/agent preview)
 * 4. File path with platform-specific open hint
 */

import { resolve } from "path";
import { writeFileSync, mkdirSync } from "fs";
import { platform } from "os";
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

/**
 * Display QR code from a zca-js login QR event.
 * Synchronous — safe to call from zca-js callback.
 * @param {object} event - zca-js QR callback event
 */
export function displayQR(event) {
    const imageB64 = event.data?.image || "";

    // 1. Display Zalo's official QR PNG inline in terminal
    // Uses iTerm2 inline image protocol (also WezTerm, Hyper, Kitty)
    // Terminals that don't support it simply ignore the escape sequence
    if (imageB64) {
        const b64ForTerm = Buffer.from(imageB64, "base64").toString("base64");
        process.stdout.write(`\x1b]1337;File=inline=1;width=30;preserveAspectRatio=1:${b64ForTerm}\x07\n`);
    }

    // 2. Save PNG to config dir
    if (imageB64) {
        try {
            mkdirSync(CONFIG_DIR, { recursive: true });
            writeFileSync(QR_PATH, Buffer.from(imageB64, "base64"));
            const openCmd = getOpenCommand();
            info(`QR image saved: ${QR_PATH}`);
            info(`To open: ${openCmd} "${QR_PATH}"`);
        } catch {}
    }

    // 3. Also fire-and-forget the zca-js built-in save
    if (event.actions?.saveToFile) {
        event.actions.saveToFile(QR_PATH).catch(() => {});
    }

    // 4. Base64 data URL (for coding agents / IDE preview)
    if (imageB64) {
        info("QR data URL (for IDE preview):");
        console.log(`  data:image/png;base64,${imageB64.substring(0, 100)}...`);
    }
}

/** Get the QR image path. */
export function getQRPath() {
    return QR_PATH;
}
