export interface AccountInfo {
  pubkey: string;
  lamports: number;
  owner: string;
  executable: boolean;
}

export class Account {
  public info: AccountInfo;

  constructor(info: AccountInfo) {
    this.info = info;
  }

  static fromRawData(data: any): Account {
    return new Account({
      pubkey: data.pubkey,
      lamports: data.lamports,
      owner: data.owner,
      executable: data.executable,
    });
  }
}