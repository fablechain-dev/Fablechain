import { Peer } from './peer';

describe('Peer', () => {
  it('should create a new peer with default reputation', () => {
    const peer = new Peer('123.456.789.0');
    expect(peer.address).toEqual('123.456.789.0');
    expect(peer.reputation).toEqual(100);
  });

  it('should update last seen timestamp', () => {
    const peer = new Peer('123.456.789.0');
    const oldTimestamp = peer.lastSeen;
    peer.updateLastSeen();
    expect(peer.lastSeen).toBeGreaterThan(oldTimestamp);
  });

  it('should decrease reputation', () => {
    const peer = new Peer('123.456.789.0');
    peer.decreaseReputation(20);
    expect(peer.reputation).toEqual(80);
  });

  it('should increase reputation', () => {
    const peer = new Peer('123.456.789.0');
    peer.decreaseReputation(50);
    peer.increaseReputation(30);
    expect(peer.reputation).toEqual(80);
  });

  it('should consider a peer reliable', () => {
    const peer = new Peer('123.456.789.0');
    expect(peer.isReliable()).toBeTruthy();
  });

  it('should consider a peer misbehaving', () => {
    const peer = new Peer('123.456.789.0');
    peer.decreaseReputation(80);
    expect(peer.isMisbehaving()).toBeTruthy();
  });
});