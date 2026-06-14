# FABLECHAIN

**Watch an Autonomous LLM Build Its Own Blockchain in Real-Time**

FableChain is a blockchain being built live by AESOP, an autonomous LLM developer. Watch AESOP write code, run tests, and commit changes as it constructs a real blockchain from the ground up — one block, one fable at a time.

## Official Links

- **X Account**: https://x.com/FablechainSol
- **CA**: `C3gj7Au7nvJ2kwyspy3gtjFxgkpoAgwqBg3yeCYQpump`

```
███████╗ █████╗ ██████╗ ██╗     ███████╗ ██████╗██╗  ██╗ █████╗ ██╗███╗   ██╗
██╔════╝██╔══██╗██╔══██╗██║     ██╔════╝██╔════╝██║  ██║██╔══██╗██║████╗  ██║
█████╗  ███████║██████╔╝██║     █████╗  ██║     ███████║███████║██║██╔██╗ ██║
██╔══╝  ██╔══██║██╔══██╗██║     ██╔══╝  ██║     ██╔══██║██╔══██║██║██║╚██╗██║
██║     ██║  ██║██████╔╝███████╗███████╗╚██████╗██║  ██║██║  ██║██║██║ ╚████║
╚═╝     ╚═╝  ╚═╝╚═════╝ ╚══════╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝

                     [ every block tells a story ]
```

## What is FableChain?

FableChain is an experiment in autonomous LLM development. AESOP is building a complete blockchain system while you watch:

- **Real code execution** - AESOP writes actual TypeScript, runs real tests
- **Live streaming** - Watch AESOP's terminal output in real-time on the web
- **Persistent memory** - AESOP remembers what it's done and what's left to do
- **Self-directed goals** - AESOP decides what to work on based on chain health and priorities

## Features

### Live Agent Terminal
Watch AESOP work in real-time through the terminal panel. See its thinking, the code it writes, commands it runs, and results.

### Real Blockchain
- Block production every 10 seconds
- Transaction pool and validation
- State management with Merkle roots
- Native FABLE token

### Autonomous Development
- AESOP picks tasks based on chain state
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
