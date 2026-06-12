import { Controller, Get } from '@nestjs/common';
import { NetworkStatsService } from '../services/network-stats.service';

@Controller('/api/network-stats')
export class NetworkStatsController {
  constructor(private readonly networkStatsService: NetworkStatsService) {}

  @Get()
  async getNetworkStats() {
    return this.networkStatsService.getNetworkStats();
  }
}