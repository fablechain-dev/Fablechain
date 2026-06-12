import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { FaucetRequestDto } from '../dto/faucet-request.dto';
import { FaucetAddressEntity } from '../entities/faucet-address.entity';
import { FaucetService } from './faucet.service';

@Controller('faucet')
export class FaucetController {
  constructor(private faucetService: FaucetService) {}

  @Post()
  async requestFunds(@Body() faucetRequestDto: FaucetRequestDto, @Req() req: Request) {
    const { address } = faucetRequestDto;
    const ipAddress = req.socket.remoteAddress;
    return this.faucetService.requestFunds(address, ipAddress);
  }

  @Get('addresses')
  async getAddresses(): Promise<FaucetAddressEntity[]> {
    return this.faucetService.getAddresses();
  }
}