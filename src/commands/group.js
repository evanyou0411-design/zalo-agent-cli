/**
 * Group commands — list, create, info, members, add/remove-member, rename, avatar,
 * admin, owner, block/unblock, settings, leave, join.
 */

import { resolve } from "path";
import { getApi } from "../core/zalo-client.js";
import { success, error, info, output } from "../utils/output.js";

export function registerGroupCommands(program) {
    const group = program.command("group").description("Manage groups");

    group
        .command("list")
        .description("List all groups")
        .action(async () => {
            try {
                const result = await getApi().getAllGroups();
                output(result, program.opts().json);
            } catch (e) {
                error(e.message);
            }
        });

    group
        .command("create <name> <memberIds...>")
        .description("Create a new group")
        .action(async (name, memberIds) => {
            try {
                const result = await getApi().createGroup({ members: memberIds, name });
                output(result, program.opts().json, () => success(`Group "${name}" created`));
            } catch (e) {
                error(e.message);
            }
        });

    group
        .command("info <groupId>")
        .description("Show group details")
        .action(async (groupId) => {
            try {
                const result = await getApi().getGroupInfo(groupId);
                output(result, program.opts().json);
            } catch (e) {
                error(e.message);
            }
        });

    group
        .command("members <groupId>")
        .description("List group members")
        .action(async (groupId) => {
            try {
                const result = await getApi().getGroupInfo(groupId);
                const members = result?.gridInfoMap?.[groupId]?.memberIds || {};
                output(members, program.opts().json, () => {
                    const ids = Object.keys(members);
                    info(`${ids.length} members`);
                    ids.forEach((id) => console.log(`  ${id}`));
                });
            } catch (e) {
                error(e.message);
            }
        });

    group
        .command("add-member <groupId> <userIds...>")
        .description("Add members to a group")
        .action(async (groupId, userIds) => {
            try {
                const result = await getApi().addUserToGroup(userIds, groupId);
                output(result, program.opts().json, () => success("Member(s) added"));
            } catch (e) {
                error(e.message);
            }
        });

    group
        .command("remove-member <groupId> <userIds...>")
        .description("Remove members from a group")
        .action(async (groupId, userIds) => {
            try {
                const result = await getApi().removeUserFromGroup(userIds, groupId);
                output(result, program.opts().json, () => success("Member(s) removed"));
            } catch (e) {
                error(e.message);
            }
        });

    group
        .command("rename <groupId> <name>")
        .description("Rename a group")
        .action(async (groupId, name) => {
            try {
                const result = await getApi().changeGroupName(groupId, name);
                output(result, program.opts().json, () => success(`Group renamed to "${name}"`));
            } catch (e) {
                error(e.message);
            }
        });

    group
        .command("avatar <groupId> <imagePath>")
        .description("Change group avatar")
        .action(async (groupId, imagePath) => {
            try {
                const result = await getApi().changeGroupAvatar(resolve(imagePath), groupId);
                output(result, program.opts().json, () => success("Group avatar changed"));
            } catch (e) {
                error(`Change avatar failed: ${e.message}`);
            }
        });

    group
        .command("add-admin <groupId> <userIds...>")
        .description("Promote members to group admin (deputy)")
        .action(async (groupId, userIds) => {
            try {
                const result = await getApi().addGroupDeputy(userIds, groupId);
                output(result, program.opts().json, () => success("Admin(s) added"));
            } catch (e) {
                error(`Add admin failed: ${e.message}`);
            }
        });

    group
        .command("remove-admin <groupId> <userIds...>")
        .description("Demote admins back to regular members")
        .action(async (groupId, userIds) => {
            try {
                const result = await getApi().removeGroupDeputy(userIds, groupId);
                output(result, program.opts().json, () => success("Admin(s) removed"));
            } catch (e) {
                error(`Remove admin failed: ${e.message}`);
            }
        });

    group
        .command("transfer-owner <groupId> <userId>")
        .description("Transfer group ownership to another member")
        .action(async (groupId, userId) => {
            try {
                const result = await getApi().changeGroupOwner(userId, groupId);
                output(result, program.opts().json, () => success(`Ownership transferred to ${userId}`));
            } catch (e) {
                error(`Transfer owner failed: ${e.message}`);
            }
        });

    group
        .command("block-member <groupId> <userIds...>")
        .description("Block members from rejoining the group")
        .action(async (groupId, userIds) => {
            try {
                const result = await getApi().addGroupBlockedMember(userIds, groupId);
                output(result, program.opts().json, () => success("Member(s) blocked"));
            } catch (e) {
                error(`Block member failed: ${e.message}`);
            }
        });

    group
        .command("unblock-member <groupId> <userIds...>")
        .description("Unblock previously blocked members")
        .action(async (groupId, userIds) => {
            try {
                const result = await getApi().removeGroupBlockedMember(userIds, groupId);
                output(result, program.opts().json, () => success("Member(s) unblocked"));
            } catch (e) {
                error(`Unblock member failed: ${e.message}`);
            }
        });

    group
        .command("leave <groupId>")
        .description("Leave a group")
        .action(async (groupId) => {
            try {
                const result = await getApi().leaveGroup(groupId);
                output(result, program.opts().json, () => success("Left group"));
            } catch (e) {
                error(e.message);
            }
        });

    group
        .command("join <link>")
        .description("Join a group via invite link")
        .action(async (link) => {
            try {
                const result = await getApi().joinGroup(link);
                output(result, program.opts().json, () => success("Joined group"));
            } catch (e) {
                error(e.message);
            }
        });
}
