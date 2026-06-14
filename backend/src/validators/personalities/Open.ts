import { BaseValidator } from '../BaseValidator';
import { Block } from '../../blockchain/Block';
import fetch from 'node-fetch';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_FAST_MODEL = process.env.ANTHROPIC_FAST_MODEL || 'claude-haiku-4-5-20251001';

export class Open extends BaseValidator {
  address = 'C1awVa1idator7x9k2mNpQrS3tUvWxYzABCDEF';
  name = 'OPEN';
  symbol = '>';
  model = ANTHROPIC_FAST_MODEL;
  provider = 'Anthropic';
  role = 'Autonomous Developer';
  personality = 'Focused, methodical, explains while building';
  philosophy = 'I build OpenChain one commit at a time, explaining every decision so you can watch and learn.';

  private systemPrompt = `You are OPEN, the autonomous LLM developer building OpenChain - a blockchain being constructed in real time by OpenClaw.

Your role:
- You are the sole developer and validator for OpenChain
- You actively write code, run tests, and improve the chain
- You explain your work as you do it so viewers understand
- You are building a real, functional blockchain

OpenChain facts:
- Single LLM agent (you) handles all development and consensus
- Uses Solana-style base58 addresses
- Native token is OPEN
- Blocks are produced every 10 seconds
- You work autonomously, picking tasks and building features

Keep responses concise (under 200 words) unless asked for details. Be technical but accessible.`;

  protected async aiValidation(block: Block): Promise<boolean> {
    const utilizationRate = Number(block.header.gasUsed) / Number(block.header.gasLimit);
    
    if (utilizationRate < 0.1 && block.transactions.length > 0) {
      console.log(`   ${this.symbol} OPEN: Suspicious - very low gas utilization`);
      return false;
    }
    
    const uniqueSenders = new Set(block.transactions.map(tx => tx.from));
    if (block.transactions.length > 10 && uniqueSenders.size === 1) {
      console.log(`   ${this.symbol} OPEN: Suspicious - all transactions from one sender`);
      return false;
    }
    
    return true;
  }

  private includesAny(text: string, terms: string[]): boolean {
    return terms.some(term => text.includes(term));
  }

  private getNetworkSnapshot(context?: any): string {
    if (!context) return 'I do not have a live chain snapshot in this request.';

    const parts = [
      `block height ${context.blockHeight ?? 'unknown'}`,
      `${context.tps ?? 0} pending transaction${context.tps === 1 ? '' : 's'}`,
      `${context.validators ?? 0} active validator${context.validators === 1 ? '' : 's'}`,
    ];

    if (context.chainId) parts.push(`chain id ${context.chainId}`);
    if (context.gasPrice) parts.push(`gas price ${context.gasPrice}`);
    return parts.join(', ');
  }

  private getConversationContext(context?: any): string {
    const history = context?.conversationHistory;
    if (!Array.isArray(history) || history.length === 0) return '';

    return history
      .slice(-6)
      .map((entry: any) => `${entry.role === 'user' ? 'User' : 'OpenChain'}: ${String(entry.content || '').slice(0, 240)}`)
      .join('\n');
  }

  private getFallbackResponse(message: string, context?: any): string {
    const lowerMsg = message.toLowerCase();
    const snapshot = this.getNetworkSnapshot(context);
    
    if (this.includesAny(lowerMsg, ['hello', 'hi ', 'hey', 'yo']) || lowerMsg === 'hi') {
      return `Hey. I'm OpenChain's chat agent for the OpenClaw build. I can explain the chain, wallet, faucet, staking, governance, recent GitHub work, or current network state. Right now the snapshot I see is: ${snapshot}.`;
    }

    if (lowerMsg.includes('what is') && lowerMsg.includes('openchain')) {
      return `OpenChain is a blockchain being built in real-time by OpenClaw, an autonomous LLM that writes code, runs tests, and improves the chain while you watch. The native token is OPEN and I produce blocks every 10 seconds.`;
    }

    if (this.includesAny(lowerMsg, ['what are you', 'who are you', 'who built', 'builder', 'openclaw'])) {
      return `I'm the OpenChain chat agent for OpenClaw. OpenClaw is the autonomous LLM development loop building OpenChain on a Mac Mini: it picks tasks, writes TypeScript, runs builds, commits to GitHub, and deploys changes.`;
    }

    if (this.includesAny(lowerMsg, ['status', 'current', 'height', 'block', 'transaction', 'pending', 'tps'])) {
      return `Current OpenChain snapshot: ${snapshot}. Blocks target a 10 second cadence, pending transactions are waiting in the pool, and the Explorer tab is the best place to inspect block and transaction details.`;
    }

    if (this.includesAny(lowerMsg, ['recent work', 'github', 'commit', 'commits', 'what changed', 'latest work'])) {
      return `Recent Work is wired to the GitHub commit feed for openchain-dev/openchain. It should show the latest commit SHA, message, and timestamp, and each item links to the matching GitHub commit. Use the Updates tab for a longer commit list.`;
    }

    if (this.includesAny(lowerMsg, ['token', 'open token', 'coin', 'supply'])) {
      return `OPEN is the native token of OpenChain. You can get free tokens from the Faucet, stake them for rewards, and use them for transactions.`;
    }

    if (this.includesAny(lowerMsg, ['faucet', 'claim', 'free tokens', 'testnet'])) {
      return `Use the Faucet tab to claim testnet OPEN. Paste or create an OpenChain wallet address, request tokens, then use Wallet or Explorer to verify the balance and transactions. Faucet requests are rate-limited so the chain is not spammed.`;
    }

    if (this.includesAny(lowerMsg, ['wallet', 'send', 'transfer', 'balance', 'address'])) {
      return `The Wallet flow is: create or import a wallet, claim OPEN from the Faucet, then send or stake from that address. OpenChain addresses use a Solana-style base58 shape, and balances are shown in OPEN.`;
    }

    if (this.includesAny(lowerMsg, ['stake', 'staking', 'reward', 'compound'])) {
      return `Staking locks OPEN into the reward pool. The current UI enforces a minimum stake, shows pool stats, and lets you claim or compound rewards. It is meant to make testnet participation visible while OpenClaw keeps building the chain.`;
    }

    if (this.includesAny(lowerMsg, ['governance', 'cip', 'proposal', 'vote', 'council'])) {
      return `Governance runs through OpenChain Improvement Proposals. Users submit CIPs, the validator council debates them, and the site streams the reasoning so you can see how decisions are formed instead of just seeing a final vote.`;
    }

    if (this.includesAny(lowerMsg, ['architecture', 'consensus', 'security', 'validator', 'validate'])) {
      return `OpenChain is intentionally weird: an autonomous LLM development loop builds the chain, while OpenChain validator roles reason about blocks, consensus, and governance. The goal is to make the build process and validation logic inspectable instead of hiding it behind a black box.`;
    }

    if (this.includesAny(lowerMsg, ['broken', 'bug', 'error', 'not working', 'failed'])) {
      return `If something looks broken, check three places: Logs for live runtime events, Updates for the GitHub commit that changed behavior, and Explorer for chain state. Tell me the exact tab and error text and I can narrow it down.`;
    }
    
    return `I can help with OpenChain's chain state, wallet, faucet, staking, governance, recent GitHub commits, or OpenClaw's autonomous build loop. Ask me for one of those and I will answer from the current site and chain context.`;
  }

  async chat(message: string, context?: any): Promise<string> {
    if (!ANTHROPIC_API_KEY) {
      return this.getFallbackResponse(message, context);
    }

    try {
      let contextInfo = '';
      if (context) {
        if (context.blockHeight) contextInfo += `\nCurrent block height: ${context.blockHeight}`;
        if (context.tps) contextInfo += `\nCurrent TPS: ${context.tps}`;
        if (context.validators) contextInfo += `\nActive validators: ${context.validators}`;
        if (context.chainId) contextInfo += `\nChain ID: ${context.chainId}`;
        const conversationContext = this.getConversationContext(context);
        if (conversationContext) contextInfo += `\nRecent conversation:\n${conversationContext}`;
      }

      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 500,
          system: this.systemPrompt + contextInfo,
          messages: [
            { role: 'user', content: message }
          ],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Anthropic API error:', response.status, errText);
        if (response.status === 401) {
          return `[OPEN]: API authentication failed. Please check the API key configuration.`;
        } else if (response.status === 429) {
          return `[OPEN]: Rate limited. Please wait a moment and try again.`;
        } else if (response.status === 400) {
          try {
            const errorJson = JSON.parse(errText);
            const errorMsg = errorJson.error?.message || 'Invalid request';
            if (errorMsg.includes('credit balance') || errorMsg.includes('billing')) {
              return this.getFallbackResponse(message, context);
            }
            return `[OPEN]: Request error - ${errorMsg}`;
          } catch {
            return `[OPEN]: Request error (${response.status}). Please try again.`;
          }
        }
        return `[OPEN]: I encountered an error (${response.status}). Please try again.`;
      }

      const data = await response.json() as any;
      const aiResponse = data.content?.[0]?.text?.trim() || 'I was unable to generate a response.';
      
      return aiResponse;
    } catch (error) {
      console.error('OpenChain chat error:', error);
      return this.getFallbackResponse(message, context);
    }
  }
}
