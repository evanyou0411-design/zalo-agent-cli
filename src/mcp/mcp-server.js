/**
 * MCP server setup with stdio transport.
 * Creates and connects the McpServer instance for Claude Code integration.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./mcp-tools.js";

/**
 * Create and start MCP server with stdio transport.
 * All logs MUST use console.error() — stdout is reserved for MCP protocol.
 * @param {object} api - zca-js API instance
 * @param {import("./message-buffer.js").MessageBuffer} buffer
 * @param {import("./thread-filter.js").ThreadFilter} filter
 * @param {object} config - MCP config
 * @returns {Promise<McpServer>}
 */
export async function createMCPServer(api, buffer, filter, config) {
    const server = new McpServer({
        name: "zalo-agent",
        version: "1.0.0",
    });

    registerTools(server, api, buffer, filter, config);

    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error("[mcp-server] MCP server connected via stdio transport");

    return server;
}
