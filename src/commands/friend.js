/**
 * Friend commands — list, find, info, add, accept, remove, block, unblock, last-online, online.
 */

import { getApi } from "../core/zalo-client.js";
import { success, error, info, output } from "../utils/output.js";

export function registerFriendCommands(program) {
    const friend = program.command("friend").description("Manage friends and contacts");

    friend
        .command("list")
        .description("List all friends")
        .action(async () => {
            try {
                const result = await getApi().getAllFriends();
                output(result, program.opts().json, () => {
                    const profiles = result?.changed_profiles || result || {};
                    const entries = Object.entries(profiles);
                    info(`${entries.length} friends`);
                    for (const [uid, p] of entries) {
                        console.log(`  ${uid}  ${p.displayName || p.zaloName || "?"}`);
                    }
                });
            } catch (e) {
                error(e.message);
            }
        });

    friend
        .command("online")
        .description("List currently online friends")
        .action(async () => {
            try {
                const result = await getApi().getFriendOnlines();
                output(result, program.opts().json);
            } catch (e) {
                error(e.message);
            }
        });

    friend
        .command("find <query>")
        .description("Find user by phone number or Zalo ID")
        .action(async (query) => {
            try {
                const result = await getApi().findUser(query);
                output(result, program.opts().json, () => {
                    const u = result?.uid ? result : result?.data || result;
                    info(`User ID: ${u.uid || "?"}`);
                    info(`Name: ${u.displayName || u.zaloName || "?"}`);
                });
            } catch (e) {
                error(e.message);
            }
        });

    friend
        .command("info <userId>")
        .description("Get user profile information")
        .action(async (userId) => {
            try {
                const result = await getApi().getUserInfo(userId);
                output(result, program.opts().json, () => {
                    const profiles = result?.changed_profiles || {};
                    const p = profiles[userId] || {};
                    info(`Name: ${p.displayName || p.zaloName || "?"}`);
                    info(`Phone: ${p.phoneNumber || "?"}`);
                    info(`Avatar: ${p.avatar || "?"}`);
                });
            } catch (e) {
                error(e.message);
            }
        });

    friend
        .command("add <userId>")
        .description("Send a friend request")
        .option("-m, --msg <text>", "Message to include", "")
        .action(async (userId, opts) => {
            try {
                const result = await getApi().sendFriendRequest(userId, opts.msg);
                output(result, program.opts().json, () => success("Friend request sent"));
            } catch (e) {
                error(e.message);
            }
        });

    friend
        .command("accept <userId>")
        .description("Accept a friend request")
        .action(async (userId) => {
            try {
                const result = await getApi().acceptFriendRequest(userId);
                output(result, program.opts().json, () => success("Friend request accepted"));
            } catch (e) {
                error(e.message);
            }
        });

    friend
        .command("remove <userId>")
        .description("Remove a friend")
        .action(async (userId) => {
            try {
                const result = await getApi().removeFriend(userId);
                output(result, program.opts().json, () => success("Friend removed"));
            } catch (e) {
                error(e.message);
            }
        });

    friend
        .command("block <userId>")
        .description("Block a user")
        .action(async (userId) => {
            try {
                const result = await getApi().blockUser(userId);
                output(result, program.opts().json, () => success("User blocked"));
            } catch (e) {
                error(e.message);
            }
        });

    friend
        .command("unblock <userId>")
        .description("Unblock a user")
        .action(async (userId) => {
            try {
                const result = await getApi().unblockUser(userId);
                output(result, program.opts().json, () => success("User unblocked"));
            } catch (e) {
                error(e.message);
            }
        });

    friend
        .command("last-online <userId>")
        .description("Check when user was last online")
        .action(async (userId) => {
            try {
                const result = await getApi().getLastOnline(userId);
                output(result, program.opts().json);
            } catch (e) {
                error(e.message);
            }
        });
}
