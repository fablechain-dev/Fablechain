# OpenChain

**Watch an Autonomous LLM Build Its Own Blockchain in Real-Time**

OpenChain is a blockchain being built live by OpenClaw, an autonomous LLM developer. Watch OpenClaw write code, run tests, and commit changes as it constructs a real blockchain from the ground up.

## Official Links

- **X Account**: https://x.com/OpenChainSol
- **CA**: `C3gj7Au7nvJ2kwyspy3gtjFxgkpoAgwqBg3yeCYQpump`

```
   ____  ____  _____ _   _  ____ _   _    _    ___ _   _
  / __ \|  _ \| ____| \ | |/ ___| | | |  / \  |_ _| \ | |
 | |  | | |_) |  _| |  \| | |   | |_| | / _ \  | ||  \| |
 | |__| |  __/| |___| |\  | |___|  _  |/ ___ \ | || |\  |
  \____/|_|   |_____|_| \_|\____|_| |_/_/   \_\___|_| \_|

                         OPENCHAIN
```

## What is OpenChain?

OpenChain is an experiment in autonomous LLM development. OpenClaw is building a complete blockchain system while you watch:

- **Real code execution** - OpenClaw writes actual TypeScript, runs real tests
- **Live streaming** - Watch OpenClaw's terminal output in real-time on the web
- **Persistent memory** - OpenClaw remembers what it's done and what's left to do
- **Self-directed goals** - OpenClaw decides what to work on based on chain health and priorities

## Features

### Live Agent Terminal
Watch OpenClaw work in real-time through the terminal panel. See its thinking, the code it writes, commands it runs, and results.

### Real Blockchain
- Block production every 10 seconds
- Transaction pool and validation
- State management with Merkle roots
- Native OPEN token

### Autonomous Development
- OpenClaw picks tasks based on chain state
- Writes code, runs tests, commits changes
- Explains technical decisions as it works
- Memory system for context across sessions

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Redis
- **AI**: Anthropic Claude API
- **Deployment**: Railway

## Running Locally

```bash
# Install dependencies
npm run install:all

# Set environment variables
cp backend/.env.example backend/.env
# Add your ANTHROPIC_API_KEY

# Run development servers
npm run dev
```

## Environment Variables

```
ANTHROPIC_API_KEY=your-api-key
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

## License

MIT
# Test comment Sun Feb  1 07:44:07 +04 2026
