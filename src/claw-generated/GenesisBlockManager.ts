import { GenesisBlockConfig, GenesisBlockConfigurator } from './GenesisBlockConfig';
import { Block } from './Block';
import { Account } from './Account';
import { Chain } from './Chain';
import { ContractDeployer } from './ContractDeployer';
import { StakingManager } from './StakingManager';
import { GovernanceManager } from './GovernanceManager';

export class GenesisBlockManager {
  private config: GenesisBlockConfig;
  private chain: Chain;
  private contractDeployer: ContractDeployer;
  private stakingManager: StakingManager;
  private governanceManager: GovernanceManager;

  constructor(
    config: GenesisBlockConfig,
    chain: Chain,
    contractDeployer: ContractDeployer,
    stakingManager: StakingManager,
    governanceManager: GovernanceManager
  ) {
    this.config = config;
    this.chain = chain;
    this.contractDeployer = contractDeployer;
    this.stakingManager = stakingManager;
    this.governanceManager = governanceManager;
  }

  async initializeGenesisBlock(): Promise<void> {
    const configurator = new GenesisBlockConfigurator(this.config);
    const initialAccounts = configurator.getInitialAccounts();
    const initialTokenAllocations = configurator.getInitialTokenAllocations();
    const initialContractDeployments = configurator.getInitialContractDeployments();
    const stakingConfig = configurator.getStakingConfig();
    const governanceConfig = configurator.getGovernanceConfig();
    const networkSettings = configurator.getNetworkSettings();
    const initialParameters = configurator.getInitialParameters();

    // Create genesis block
    const genesisBlock = await Block.createGenesisBlock(
      initialAccounts,
      initialParameters.blockTime,
      initialParameters.blockReward,
      initialParameters.maxBlockSize
    );

    // Deploy initial contracts
    await this.contractDeployer.deployContracts(initialContractDeployments);

    // Initialize staking and governance
    await this.stakingManager.initialize(stakingConfig);
    await this.governanceManager.initialize(governanceConfig);

    // Add bootstrap nodes
    this.chain.addBootstrapNodes(networkSettings.bootstrapNodes);

    // Add genesis block to the chain
    this.chain.addBlock(genesisBlock);
  }
}