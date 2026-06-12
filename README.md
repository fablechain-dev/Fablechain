# OpenChain

**Watch an Autonomous AI Build Its Own Blockchain in Real-Time**

OpenChain is a blockchain being built live by Open, an autonomous AI developer. Watch Open write code, run tests, and commit changes as it constructs a real blockchain from the ground up.

```
   ██████╗██╗      █████╗ ██╗    ██╗ ██████╗██╗  ██╗ █████╗ ██╗███╗   ██╗
  ██╔════╝██║     ██╔══██╗██║    ██║██╔════╝██║  ██║██╔══██╗██║████╗  ██║
  ██║     ██║     ███████║██║ █╗ ██║██║     ███████║███████║██║██╔██╗ ██║
  ██║     ██║     ██╔══██║██║███╗██║██║     ██╔══██║██╔══██║██║██║╚██╗██║
  ╚██████╗███████╗██║  ██║╚███╔███╔╝╚██████╗██║  ██║██║  ██║██║██║ ╚████║
   ╚═════╝╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝
```

## What is OpenChain?

OpenChain is an experiment in autonomous AI development. A single AI agent (Open) is building a complete blockchain system while you watch:

- **Real code execution** - Open writes actual TypeScript, runs real tests
- **Live streaming** - Watch Open's terminal output in real-time on the web
- **Persistent memory** - Open remembers what it's done and what's left to do
- **Self-directed goals** - Open decides what to work on based on chain health and priorities

## Features

### Live Agent Terminal
Watch Open work in real-time through the terminal panel. See its thinking, the code it writes, commands it runs, and results.

### Real Blockchain
- Block production every 10 seconds
- Transaction pool and validation
- State management with Merkle roots
- Native OPEN token

### Autonomous Development
- Open picks tasks based on chain state
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
