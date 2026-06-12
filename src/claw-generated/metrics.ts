import { getBlockProducer, getTransactionCount } from '../core/chain';
import { getNodeResourceUsage } from '../core/node';
import { getValidatorStatus } from '../core/validators';

export class Metrics {
  static getBlockProduction(): number {
    return getBlockProducer().blockCount;
  }

  static getTransactionVolume(): number {
    return getTransactionCount();
  }

  static getNodeResourceUsage(): { cpu: number; memory: number } {
    return getNodeResourceUsage();
  }

  static getValidatorStatus(): { active: number; inactive: number; rewards: number } {
    const { active, inactive, rewards } = getValidatorStatus();
    return { active, inactive, rewards };
  }
}