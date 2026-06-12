# OpenChain Architecture Overview

## High-Level System Diagram
```
+---------------+     +---------------+     +---------------+
|    Backend    |     |   Frontends   |     |    Shared     |
|               |     |               |     |               |
| +----------+ |     | +----------+ |     | +----------+ |
| |   Agent   | |     | |   Pages  | |     | | Blockchain| |
| +----------+ |     | +----------+ |     | +----------+ |
| +----------+ |     | +----------+ |     | +----------+ |
| | Blockchain| |     | | Services | |     | |  Networking| |
| +----------+ |     | +----------+ |     | +----------+ |
| +----------+ |     |               |     | +----------+ |
| |   API     | |     |               |     | |  Wallet   | |
| +----------+ |     |               |     | +----------+ |
| +----------+ |     |               |     | +----------+ |
| | Database  | |     |               |     | |  Utilities| |
| +----------+ |     |               |     | +----------+ |
| +----------+ |     |               |     |               |
| |Integrations| |     |               |     |               |
| +----------+ |     |               |     |               |
+---------------+     +---------------+     +---------------+
     Backend              Frontends             Shared
```

## Blockchain Core
```
+---------------+
|    Blockchain  |
|               |
| +----------+ |
| |   Block   | |
| +----------+ |
| +----------+ |
| |Transaction| |
| +----------+ |
| +----------+ |
| |Consensus | |
| +----------+ |
| +----------+ |
| |StateManager| |
| +----------+ |
| +----------+ |
| |TransactionPool| |
| +----------+ |
+---------------+
```

## Networking
```
+---------------+
|   Networking  |
|               |
| +----------+ |
| |   Peer   | |
| +----------+ |
| +----------+ |
| |PeerManager| |
| +----------+ |
| +----------+ |
| |TransactionGossip| |
| +----------+ |
| +----------+ |
| |BlockPropagator| |
| +----------+ |
+---------------+
```

## Wallet and Accounts
```
+---------------+
|     Wallet    |
|               |
| +----------+ |
| |  Account  | |
| +----------+ |
| +----------+ |
| |AccountManager| |
| +----------+ |
| +----------+ |
| |AccountStorage| |
| +----------+ |
| +----------+ |
| |WalletConnect| |
| +----------+ |
+---------------+
```

## Smart Contracts
```
+---------------+
|   Contracts   |
|               |
| +----------+ |
| |Contract  | |
| +----------+ |
| +----------+ |
| |ContractDeployer| |
| +----------+ |
| +----------+ |
| |ContractStorage| |
| +----------+ |
| +----------+ |
| |ContractExecutor| |
| +----------+ |
+---------------+
```

This architecture overview provides a high-level view of the OpenChain system, highlighting the main components and their interactions. The more detailed component diagrams dive deeper into the internal structure and functionality of these key subsystems. Together, this documentation should give developers a comprehensive understanding of the OpenChain architecture and design.