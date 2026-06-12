import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class FaucetAddressEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  address: string;

  @Column()
  lastRequestTimestamp: Date;

  @Column()
  requestCount: number;
}