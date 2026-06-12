import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class FaucetAddress {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  address: string;

  @Column()
  lastRequestTimestamp: Date;
}