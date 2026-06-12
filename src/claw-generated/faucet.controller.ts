import { Body, Controller, Post, Req } from '@nestjs/common';
import { FaucetRequestDto } from './dto/faucet-request.dto';
import { FaucetService } from './faucet.service';
import { Request } from 'express';

@Controller('faucet')
export class FaucetController {
  constructor(private faucetService: FaucetService) {}

  @Post()
  async requestTokens(@Body() faucetRequest: FaucetRequestDto, @Req() req: Request) {
    const { address } = faucetRequest;
    const ipAddress = req.ip;

    // Check if the address has already requested tokens within the last 24 hours
    const canDispenseTokens = await this.faucetService.canDispenseTokens(address, ipAddress);

    if (canDispenseTokens) {
      // Mint 10 CLAW tokens and update the faucet address record
      await this.faucetService.dispenseTokens(address);
      return { message: 'Tokens dispensed successfully' };
    } else {
      return { message: 'You have already requested tokens within the last 24 hours' };
    }
  }
}