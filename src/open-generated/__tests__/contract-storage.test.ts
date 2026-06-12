import { ContractStorage } from '../contract-storage';
import { StorageSlot } from '../accounts/storage-slot';

describe('ContractStorage', () => {
  let contractStorage: ContractStorage;

  beforeEach(() => {
    contractStorage = new ContractStorage();
  });

  test('basic storage slot operations', () => {
    const key = 'myKey';
    const value = new StorageSlot(42);

    contractStorage.write(key, value);
    expect(contractStorage.read(key)).toEqual(value);

    value.value = 24;
    contractStorage.update(key, value);
    expect(contractStorage.read(key)).toEqual(value);

    contractStorage.remove(key);
    expect(contractStorage.has(key)).toBe(false);
  });

  test('mapping operations', () => {
    const key = 'myMapping';
    const mapKey1 = 'map1';
    const mapKey2 = 'map2';
    const value1 = new StorageSlot(100);
    const value2 = new StorageSlot(200);

    contractStorage.writeMapping(key, mapKey1, value1);
    contractStorage.writeMapping(key, mapKey2, value2);

    expect(contractStorage.readMapping(key, mapKey1)).toEqual(value1);
    expect(contractStorage.readMapping(key, mapKey2)).toEqual(value2);

    value1.value = 150;
    contractStorage.updateMapping(key, mapKey1, value1);
    expect(contractStorage.readMapping(key, mapKey1)).toEqual(value1);

    contractStorage.removeMapping(key, mapKey1);
    expect(contractStorage.readMapping(key, mapKey1)).toEqual(new StorageSlot());
  });

  test('array operations', () => {
    const key = 'myArray';
    const value1 = new StorageSlot(1);
    const value2 = new StorageSlot(2);
    const value3 = new StorageSlot(3);

    contractStorage.writeArray(key, 0, value1);
    contractStorage.writeArray(key, 1, value2);
    contractStorage.writeArray(key, 2, value3);

    expect(contractStorage.readArray(key, 0)).toEqual(value1);
    expect(contractStorage.readArray(key, 1)).toEqual(value2);
    expect(contractStorage.readArray(key, 2)).toEqual(value3);

    value2.value = 22;
    contractStorage.updateArray(key, 1, value2);
    expect(contractStorage.readArray(key, 1)).toEqual(value2);

    contractStorage.removeArray(key, 1);
    expect(contractStorage.readArray(key, 1)).toEqual(new StorageSlot());
  });
});