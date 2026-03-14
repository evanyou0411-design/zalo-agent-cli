/**
 * Conversation commands — pinned, archived, mute, unmute, read, unread, delete.
 */

import { getApi } from "../core/zalo-client.js";
import { success, error, output } from "../utils/output.js";

export function registerConvCommands(program) {
    const conv = program.command("conv").description("Manage conversations");

    conv.command("pinned")
        .description("List pinned conversations")
        .action(async () => {
            try {
                const result = await getApi().getPinnedConversations();
                output(result, program.opts().json);
            } catch (e) {
                error(e.message);
            }
        });

    conv.command("archived")
        .description("List archived conversations")
        .action(async () => {
            try {
                const result = await getApi().getArchivedConversations();
                output(result, program.opts().json);
            } catch (e) {
                error(e.message);
            }
        });

    conv.command("mute <threadId>")
        .description("Mute a conversation")
        .option("-t, --type <n>", "Thread type: 0=User, 1=Group", "0")
        .option("-d, --duration <secs>", "Duration in seconds (-1 = forever)", "-1")
        .action(async (threadId, opts) => {
            try {
                const result = await getApi().setMute(threadId, Number(opts.type), Number(opts.duration));
                output(result, program.opts().json, () => success("Conversation muted"));
            } catch (e) {
                error(e.message);
            }
        });

    conv.command("unmute <threadId>")
        .description("Unmute a conversation")
        .option("-t, --type <n>", "Thread type: 0=User, 1=Group", "0")
        .action(async (threadId, opts) => {
            try {
                const result = await getApi().setMute(threadId, Number(opts.type), 0);
                output(result, program.opts().json, () => success("Conversation unmuted"));
            } catch (e) {
                error(e.message);
            }
        });

    conv.command("read <threadId>")
        .description("Mark conversation as read")
        .option("-t, --type <n>", "Thread type: 0=User, 1=Group", "0")
        .action(async (threadId, opts) => {
            try {
                const result = await getApi().sendSeenEvent(threadId, Number(opts.type));
                output(result, program.opts().json, () => success("Marked as read"));
            } catch (e) {
                error(e.message);
            }
        });

    conv.command("unread <threadId>")
        .description("Mark conversation as unread")
        .option("-t, --type <n>", "Thread type: 0=User, 1=Group", "0")
        .action(async (threadId, opts) => {
            try {
                const result = await getApi().markAsUnread(threadId, Number(opts.type));
                output(result, program.opts().json, () => success("Marked as unread"));
            } catch (e) {
                error(e.message);
            }
        });

    conv.command("delete <threadId>")
        .description("Delete conversation history")
        .option("-t, --type <n>", "Thread type: 0=User, 1=Group", "0")
        .action(async (threadId, opts) => {
            try {
                const result = await getApi().deleteConversation(threadId, Number(opts.type));
                output(result, program.opts().json, () => success("Conversation deleted"));
            } catch (e) {
                error(e.message);
            }
        });
}
