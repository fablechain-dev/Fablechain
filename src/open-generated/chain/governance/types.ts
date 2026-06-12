export interface Vote {
  voter: string;
  option: number; // 0 = Nay, 1 = Yay
  weight: number; // Voter's token balance
}

export interface Proposal {
  id: number;
  title: string;
  description: string;
  creator: string;
  createdAt: number;
  votes: Vote[];
  status: ProposalStatus;
}

export enum ProposalStatus {
  Pending,
  Active,
  Approved,
  Rejected
}