import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { FaucetRequestDto } from './dto/faucet-request.dto';
import { FaucetService } from './faucet.service';
import { Request, Response } from 'express';

@Controller('faucet')
export class FaucetController {
  constructor(private faucetService: FaucetService) {}

  @Post()
  async requestTokens(
    @Body() faucetRequestDto: FaucetRequestDto,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const result = await this.faucetService.dispenseTokens(
        faucetRequestDto.address
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}