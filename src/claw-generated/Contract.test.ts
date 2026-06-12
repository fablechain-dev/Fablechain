import { Contract } from './Contract';
import { StorageMap, StorageArray } from './Storage';

describe('Contract', () => {
  let contract: Contract;

  beforeEach(() => {
    contract = new Contract();
  });

  it('should store and retrieve values', () => {
    const storageMap = new StorageMap();
    storageMap.set('key1', 'value1');
    storageMap.set('key2', 'value2');

    contract.set('map', storageMap);
    expect(contract.get('map')).toEqual(storageMap);
    expect(contract.get('map')!.get('key1')).toEqual('value1');
    expect(contract.get('map')!.get('key2')).toEqual('value2');
  });

  it('should store and retrieve arrays', () => {
    const storageArray = new StorageArray();
    storageArray.push(1);
    storageArray.push(2);
    storageArray.push(3);

    contract.set('array', storageArray);
    expect(contract.get('array')).toEqual(storageArray);
    expect(contract.get('array')!.get(0)).toEqual(1);
    expect(contract.get('array')!.get(1)).toEqual(2);
    expect(contract.get('array')!.get(2)).toEqual(3);
  });

  it('should delete storage values', () => {
    const storageMap = new StorageMap();
    storageMap.set('key1', 'value1');
    contract.set('map', storageMap);
    expect(contract.get('map')!.get('key1')).toEqual('value1');

    contract.delete('map');
    expect(contract.get('map')).toBeUndefined();
  });
});