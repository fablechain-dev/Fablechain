// Oracle system for ClawChain
import { keccak256 } from 'js-sha3';

interface DataSource {
  name: string;
  fetchData(): Promise<any>;
}

export class Oracle {
  private commitments: Map<string, string> = new Map();
  private dataSources: DataSource[] = [];

  registerDataSource(dataSource: DataSource) {
    this.dataSources.push(dataSource);
  }

  async commit(dataSourceName: string): Promise<string> {
    const dataSource = this.dataSources.find((ds) => ds.name === dataSourceName);
    if (!dataSource) {
      throw new Error(`Unknown data source: ${dataSourceName}`);
    }
    const data = await dataSource.fetchData();
    const commitment = keccak256(JSON.stringify(data));
    this.commitments.set(commitment, JSON.stringify(data));
    return commitment;
  }

  async reveal(commitment: string): Promise<any> {
    const data = this.commitments.get(commitment);
    if (!data) {
      throw new Error('Invalid commitment');
    }
    this.commitments.delete(commitment);
    return JSON.parse(data);
  }
}