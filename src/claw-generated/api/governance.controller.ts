import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Proposal, Vote } from '../chain/governance/types';
import { GovernanceService } from '../chain/governance/governance.service';

@Controller('governance')
export class GovernanceController {
  constructor(private readonly governanceService: GovernanceService) {}

  @Get('proposals')
  async getProposals(): Promise<Proposal[]> {
    return this.governanceService.getProposals();
  }

  @Get('proposals/:id')
  async getProposal(@Param('id') id: number): Promise<Proposal> {
    return this.governanceService.getProposal(id);
  }

  @Post('proposals')
  async createProposal(@Body() proposal: { title: string; description: string }): Promise<Proposal> {
    return this.governanceService.createProposal(proposal.title, proposal.description, '0x1234567890');
  }

  @Post('proposals/:id/vote')
  async voteOnProposal(
    @Param('id') id: number,
    @Body() vote: { option: number }
  ): Promise<void> {
    await this.governanceService.voteOnProposal(id, '0x1234567890', vote.option, 100);
  }

  @Post('proposals/:id/resolve')
  async resolveProposal(@Param('id') id: number): Promise<void> {
    await this.governanceService.resolveProposal(id);
  }
}