/**
 * Unified listener — combines message, friend, and group events in one WebSocket connection.
 * Production-ready with auto-reconnect and re-login.
 */

import { getApi, autoLogin, clearSession } from "../core/zalo-client.js";
import { success, error, info, warning } from "../utils/output.js";

/** Friend event type enum → readable label */
const FRIEND_EVENT_LABELS = {
    0: "friend_added",
    1: "friend_removed",
    2: "friend_request",
    3: "undo_request",
    4: "reject_request",
    5: "seen_request",
    6: "blocked",
    7: "unblocked",
};

export function registerListenCommand(program) {
    program
        .command("listen")
        .description(
            "Listen for all Zalo events (messages, friend requests, group events) via one WebSocket. Auto-reconnect enabled.",
        )
        .option(
            "-e, --events <types>",
            "Comma-separated event types: message,friend,group,reaction (default: message,friend)",
            "message,friend",
        )
        .option("-f, --filter <type>", "Message filter: user (DM only), group (groups only), all", "all")
        .option("-w, --webhook <url>", "POST each event as JSON to this URL (for n8n, Make, etc.)")
        .option("--no-self", "Exclude self-sent messages")
        .option("--auto-accept", "Auto-accept incoming friend requests")
        .action(async (opts) => {
            const jsonMode = program.opts().json;
            const startTime = Date.now();
            let reconnectCount = 0;
            let eventCount = 0;
            const enabledEvents = new Set(opts.events.split(",").map((e) => e.trim()));

            function uptime() {
                const s = Math.floor((Date.now() - startTime) / 1000);
                const h = Math.floor(s / 3600);
                const m = Math.floor((s % 3600) / 60);
                return h > 0 ? `${h}h${m}m` : `${m}m${s % 60}s`;
            }

            /** Send event data to webhook */
            async function postWebhook(data) {
                if (!opts.webhook) return;
                try {
                    await fetch(opts.webhook, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(data),
                    });
                } catch {
                    // Silent — don't block listener
                }
            }

            /** Attach all event handlers to current API */
            function attachHandlers(api) {
                // --- Message events ---
                if (enabledEvents.has("message")) {
                    api.listener.on("message", async (msg) => {
                        if (opts.filter === "user" && msg.type !== 0) return;
                        if (opts.filter === "group" && msg.type !== 1) return;
                        if (!opts.self && msg.isSelf) return;

                        eventCount++;
                        const content = typeof msg.data.content === "string" ? msg.data.content : "[non-text]";
                        const data = {
                            event: "message",
                            msgId: msg.data.msgId,
                            cliMsgId: msg.data.cliMsgId,
                            threadId: msg.threadId,
                            type: msg.type,
                            isSelf: msg.isSelf,
                            content,
                        };

                        if (jsonMode) {
                            console.log(JSON.stringify(data));
                        } else {
                            const dir = msg.isSelf ? "→" : "←";
                            const typeLabel = msg.type === 0 ? "DM" : "GR";
                            console.log(
                                `  ${dir} [${typeLabel}] [${msg.threadId}] ${content}  (msgId: ${msg.data.msgId})`,
                            );
                        }
                        await postWebhook(data);
                    });
                }

                // --- Friend events ---
                if (enabledEvents.has("friend")) {
                    api.listener.on("friend_event", async (event) => {
                        eventCount++;
                        const label = FRIEND_EVENT_LABELS[event.type] || "friend_unknown";
                        const data = {
                            event: label,
                            threadId: event.threadId,
                            isSelf: event.isSelf,
                            data: event.data,
                        };

                        if (jsonMode) {
                            console.log(JSON.stringify(data));
                        } else {
                            const msg =
                                event.type === 2
                                    ? `Friend request from ${event.data.fromUid}: "${event.data.message || ""}"`
                                    : `${label} — ${event.threadId}`;
                            info(msg);
                        }
                        await postWebhook(data);

                        // Auto-accept
                        if (opts.autoAccept && event.type === 2 && !event.isSelf) {
                            try {
                                await api.acceptFriendRequest(event.data.fromUid);
                                success(`Auto-accepted friend request from ${event.data.fromUid}`);
                            } catch (e) {
                                error(`Auto-accept failed: ${e.message}`);
                            }
                        }
                    });
                }

                // --- Group events ---
                if (enabledEvents.has("group")) {
                    api.listener.on("group_event", async (event) => {
                        eventCount++;
                        const data = {
                            event: `group_${event.type}`,
                            threadId: event.threadId,
                            isSelf: event.isSelf,
                            data: event.data,
                        };

                        if (jsonMode) {
                            console.log(JSON.stringify(data));
                        } else {
                            info(`Group: ${event.type} — ${event.threadId}`);
                        }
                        await postWebhook(data);
                    });
                }

                // --- Reaction events ---
                if (enabledEvents.has("reaction")) {
                    api.listener.on("reaction", async (reaction) => {
                        if (!opts.self && reaction.isSelf) return;
                        eventCount++;
                        const data = {
                            event: "reaction",
                            threadId: reaction.threadId,
                            isSelf: reaction.isSelf,
                            isGroup: reaction.isGroup,
                            data: reaction.data,
                        };

                        if (jsonMode) {
                            console.log(JSON.stringify(data));
                        } else {
                            info(`Reaction in ${reaction.threadId}`);
                        }
                        await postWebhook(data);
                    });
                }
            }

            /** Start listener with auto-reconnect */
            async function startListener() {
                try {
                    const api = getApi();

                    api.listener.on("connected", () => {
                        if (reconnectCount > 0) {
                            info(`Reconnected (#${reconnectCount}, uptime: ${uptime()}, events: ${eventCount})`);
                        }
                    });

                    api.listener.on("disconnected", (code, _reason) => {
                        warning(`Disconnected (code: ${code}). Auto-retrying...`);
                    });

                    api.listener.on("closed", async (code, _reason) => {
                        if (code === 3000) {
                            error("Another Zalo Web session opened. Listener stopped.");
                            process.exit(1);
                        }
                        reconnectCount++;
                        warning(`Connection closed (code: ${code}). Re-login in 5s... (uptime: ${uptime()})`);
                        await new Promise((r) => setTimeout(r, 5000));
                        try {
                            clearSession();
                            await autoLogin(jsonMode);
                            info("Re-login successful. Restarting listener...");
                            attachHandlers(getApi());
                            getApi().listener.start({ retryOnClose: true });
                        } catch (e) {
                            error(`Re-login failed: ${e.message}. Retrying in 30s...`);
                            await new Promise((r) => setTimeout(r, 30000));
                            startListener();
                        }
                    });

                    api.listener.on("error", (_err) => {
                        // Log but don't crash
                    });

                    attachHandlers(api);
                    api.listener.start({ retryOnClose: true });

                    info("Listening for Zalo events... Press Ctrl+C to stop.");
                    info(`Events: ${opts.events}`);
                    info("Auto-reconnect enabled.");
                    if (opts.filter !== "all") info(`Message filter: ${opts.filter}`);
                    if (opts.webhook) info(`Webhook: ${opts.webhook}`);
                    if (opts.autoAccept) info("Auto-accept friend requests: ON");
                } catch (e) {
                    error(`Listen failed: ${e.message}`);
                    process.exit(1);
                }
            }

            await startListener();

            await new Promise((resolve) => {
                process.on("SIGINT", () => {
                    try {
                        getApi().listener.stop();
                    } catch {}
                    info(`Stopped. Uptime: ${uptime()}, events: ${eventCount}, reconnects: ${reconnectCount}`);
                    resolve();
                });
            });
        });
}
