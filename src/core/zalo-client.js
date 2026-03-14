/**
 * Zalo client wrapper — direct zca-js API calls with proxy support.
 * Manages a single Zalo instance per process. Swap on account switch.
 */

import { Zalo, LoginQRCallbackEventType } from "zca-js";
import { HttpsProxyAgent } from "https-proxy-agent";
import nodefetch from "node-fetch";
import { getActive } from "./accounts.js";
import { loadCredentials } from "./credentials.js";
import { info } from "../utils/output.js";

let _api = null;
let _ownId = null;

/** Get the current API instance or throw. */
export function getApi() {
    if (!_api) throw new Error("Not logged in. Run: zalo-agent login");
    return _api;
}

/** Get current owner ID. */
export function getOwnId() {
    return _ownId;
}

/** Check if logged in. */
export function isLoggedIn() {
    return _api !== null;
}

/** Create a Zalo instance with optional proxy. Suppress logs in JSON mode. */
function createZalo(proxyUrl) {
    const opts = {
        // Suppress zca-js internal INFO logs when --json to keep stdout clean
        logging: !process.env.ZALO_JSON_MODE,
    };
    if (proxyUrl) {
        opts.agent = new HttpsProxyAgent(proxyUrl);
        opts.polyfill = nodefetch;
    }
    return new Zalo(opts);
}

/** Set the active API + ownId (used after login). */
function setSession(api, ownId) {
    _api = api;
    _ownId = ownId;
}

/** Clear current session. */
export function clearSession() {
    _api = null;
    _ownId = null;
}

/**
 * Login with saved credentials + proxy.
 * @param {object} creds - {imei, cookie, userAgent, language?}
 * @param {string|null} proxyUrl
 * @returns {object} - {api, ownId}
 */
export async function loginWithCredentials(creds, proxyUrl = null) {
    const zalo = createZalo(proxyUrl);
    const api = await zalo.login(creds);
    const ownId = api.getOwnId?.() || null;
    setSession(api, ownId);
    return { api, ownId };
}

/**
 * Login via QR code with optional proxy.
 * @param {string|null} proxyUrl
 * @param {function} onQrGenerated - callback(qrData) when QR is ready
 * @returns {object} - {api, ownId}
 */
export async function loginWithQR(proxyUrl = null, onQrGenerated = null) {
    const zalo = createZalo(proxyUrl);

    const api = await zalo.loginQR(null, (event) => {
        if (event.type === LoginQRCallbackEventType.QRCodeGenerated && onQrGenerated) {
            onQrGenerated(event);
        }
    });

    const ownId = api.getOwnId?.() || null;
    setSession(api, ownId);
    return { api, ownId };
}

/**
 * Extract credentials from current session for saving.
 * @returns {object} - {imei, cookie, userAgent, language}
 */
export function extractCredentials() {
    const api = getApi();
    const ctx = api.getContext();
    return {
        imei: ctx.imei,
        cookie: ctx.cookie,
        userAgent: ctx.userAgent,
        language: ctx.language,
    };
}

/**
 * Auto-login using active account from registry.
 * Called before commands that need authentication.
 * @param {boolean} jsonMode - suppress output in JSON mode
 */
export async function autoLogin(jsonMode = false) {
    if (_api) return; // Already logged in

    const active = getActive();
    if (!active) return;

    const creds = loadCredentials(active.ownId);
    if (!creds) return;

    try {
        await loginWithCredentials(creds, active.proxy || null);
        if (!jsonMode) {
            info(`Auto-login: ${active.name || active.ownId}`);
        }
    } catch {
        // Silent failure — user can login manually
    }
}
