# Contributing to zalo-agent-cli

Thanks for your interest in contributing! This guide will help you get started.

## Development Setup

```bash
# Clone the repo
git clone https://github.com/ChickenAI/zalo-agent-cli.git
cd zalo-agent-cli

# Install dependencies
npm install

# Link globally for local testing
npm link

# Verify
zalo-agent --version
```

## Code Style

- **ESM modules** — use `import`/`export`, never `require()`
- **No `var`** — use `const` by default, `let` when reassignment needed
- **Async/await** — no raw `.then()` chains
- **4-space indentation** — enforced by Prettier
- **Double quotes** — enforced by Prettier
- **Semicolons** — always

### Lint & Format

```bash
# Check for issues
npm run lint
npm run format:check

# Auto-fix
npm run lint:fix
npm run format
```

All PRs must pass `npm run lint` and `npm run format:check`.

## Project Structure

```
src/
├── index.js              # CLI entry point (Commander.js)
├── commands/             # One file per command group
│   ├── login.js          # login, logout, status, whoami
│   ├── msg.js            # 10 message subcommands
│   ├── friend.js         # 10 friend subcommands
│   ├── group.js          # 9 group subcommands
│   ├── conv.js           # 7 conversation subcommands
│   └── account.js        # 6 account subcommands
├── core/                 # Business logic (no CLI deps)
│   ├── zalo-client.js    # Direct zca-js wrapper
│   ├── credentials.js    # Credential storage (0600)
│   └── accounts.js       # Account registry
└── utils/                # Shared helpers
    ├── output.js         # JSON/human output formatter
    ├── proxy-helpers.js  # Proxy URL masking
    ├── bank-helpers.js   # Bank BIN mapping + VietQR
    ├── qr-display.js     # Cross-platform QR display
    └── qr-http-server.js # Local HTTP QR server
```

## Adding a New Command

1. Find the appropriate file in `src/commands/`
2. Follow the existing pattern:

```js
subcommand.command("my-command <arg>")
    .description("What it does")
    .option("-x, --flag <value>", "Description")
    .action(async (arg, opts) => {
        try {
            const api = getApi();
            const result = await api.someMethod(arg);
            output(result, program.opts().json, () => success("Done"));
        } catch (e) { error(e.message); }
    });
```

3. Always support `--json` output via the `output()` helper
4. Use `success()`, `error()`, `info()`, `warning()` for human output
5. Use `getApi()` for Zalo API access (throws if not logged in)

## Security Rules

**CRITICAL — violations will result in PR rejection:**

- **NEVER** log credentials, cookies, IMEI, or proxy passwords
- **NEVER** commit test credentials, user IDs, or phone numbers
- **ALWAYS** use `maskProxy()` when displaying proxy URLs
- **ALWAYS** set 0600 permissions on credential files
- **NEVER** use `execSync()` or `exec()` with user-supplied input (command injection)
- **NEVER** commit `.env`, `accounts.json`, or anything from `~/.zalo-agent-cli/`

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add video message support
fix: handle expired QR gracefully
docs: update proxy setup guide
refactor: extract shared QR logic
```

## Pull Request Process

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make changes + ensure lint passes
4. Write clear commit messages
5. Push and open a PR against `main`
6. Describe what changed and why in the PR description

## Testing

```bash
# Run tests (when available)
npm test

# Manual testing — login and verify commands work
zalo-agent login
zalo-agent msg send THREAD_ID "test"
zalo-agent account list
```

## Reporting Issues

- Search existing issues first
- Include: Node.js version, OS, error message, steps to reproduce
- **NEVER** include credentials, cookies, or proxy passwords in issues

## Code of Conduct

Be respectful, constructive, and professional. We're all here to build something useful.
