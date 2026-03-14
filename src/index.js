#!/usr/bin/env node

/**
 * zalo-agent-cli — CLI for Zalo automation with multi-account + proxy support.
 * Entry point: registers all command groups via Commander.js.
 */

import { Command } from "commander";
import { registerLoginCommands } from "./commands/login.js";
import { registerMsgCommands } from "./commands/msg.js";
import { registerFriendCommands } from "./commands/friend.js";
import { registerGroupCommands } from "./commands/group.js";
import { registerConvCommands } from "./commands/conv.js";
import { registerAccountCommands } from "./commands/account.js";
import { autoLogin } from "./core/zalo-client.js";

const program = new Command();

program
    .name("zalo-agent")
    .description("CLI tool for Zalo automation — multi-account, proxy, bank transfers, QR payments")
    .version("1.0.0")
    .option("--json", "Output results as JSON (machine-readable)")
    .hook("preAction", async (thisCommand) => {
        // Auto-login before any command that needs it (skip for login/account commands)
        const cmdName = thisCommand.args?.[0] || thisCommand.name();
        const skipAutoLogin = ["login", "account", "help", "version"].includes(cmdName);
        if (!skipAutoLogin) {
            await autoLogin(program.opts().json);
        }
    });

// Register all command groups
registerLoginCommands(program);
registerMsgCommands(program);
registerFriendCommands(program);
registerGroupCommands(program);
registerConvCommands(program);
registerAccountCommands(program);

program.parse();
