# zalo-agent CLI — Full Command Reference

## Global Flags
| Flag | Description |
|------|-------------|
| `--json` | JSON output for all commands |
| `-V, --version` | Version number |

## Auth (5)
| Command | Description |
|---------|-------------|
| `login [-p proxy] [--credentials path] [--qr-url]` | QR or credential login |
| `logout [--purge]` | Clear session (--purge deletes creds) |
| `status` | Login state |
| `whoami` | Profile info |

## Messages — `msg` (10)
| Command | Description |
|---------|-------------|
| `send <id> <text> [-t 0\|1]` | Text message |
| `send-image <id> <paths...> [-t] [-m caption]` | Images |
| `send-file <id> <paths...> [-t] [-m caption]` | Files |
| `send-card <id> <userId> [-t] [--phone]` | Contact card |
| `send-bank <id> <accNum> -b bank [-n name] [-t]` | Bank card (55+ VN banks) |
| `send-qr-transfer <id> <accNum> -b bank [-a amt] [-m content] [--template] [-t]` | VietQR image |
| `sticker <id> <keyword> [-t]` | Sticker search+send |
| `react <msgId> <id> <emoji> [-t]` | Reaction |
| `delete <msgId> <id> [-t]` | Delete message |
| `forward <msgId> <id> [-t]` | Forward message |

## Friends — `friend` (10)
| Command | Description |
|---------|-------------|
| `list` | All friends |
| `online` | Online friends |
| `find <query>` | By phone/ID |
| `info <userId>` | Profile |
| `add <userId> [-m msg]` | Friend request |
| `accept <userId>` | Accept request |
| `remove <userId>` | Unfriend |
| `block <userId>` | Block |
| `unblock <userId>` | Unblock |
| `last-online <userId>` | Last seen |

## Groups — `group` (9)
| Command | Description |
|---------|-------------|
| `list` | All groups |
| `create <name> <ids...>` | Create |
| `info <groupId>` | Details |
| `members <groupId>` | Member list |
| `add-member <groupId> <ids...>` | Add members |
| `remove-member <groupId> <ids...>` | Remove members |
| `rename <groupId> <name>` | Rename |
| `leave <groupId>` | Leave |
| `join <link>` | Join via link |

## Conversations — `conv` (7)
| Command | Description |
|---------|-------------|
| `pinned` | Pinned list |
| `archived` | Archived list |
| `mute <id> [-t] [-d secs]` | Mute (-1=forever) |
| `unmute <id> [-t]` | Unmute |
| `read <id> [-t]` | Mark read |
| `unread <id> [-t]` | Mark unread |
| `delete <id> [-t]` | Delete history |

## Accounts — `account` (6)
| Command | Description |
|---------|-------------|
| `list` | All accounts (proxy masked) |
| `login [-p proxy] [-n name] [--qr-url]` | Add account |
| `switch <ownerId>` | Switch active |
| `remove <ownerId>` | Delete account+creds |
| `info` | Active account |
| `export [ownerId] [-o path]` | Export creds |

## Bank Name Aliases
ocb, vcb, vietcombank, bidv, mb, mbbank, techcombank, tpbank, acb, vpbank, msb, sacombank, hdbank, seabank, shb, eximbank, vib, agribank, vietinbank, ctg, scb, ncb, abbank, dongabank, kienlongbank, shinhan, hsbc, cimb, woori, and 25+ more.

## Thread Type
`-t 0` = User (default), `-t 1` = Group
