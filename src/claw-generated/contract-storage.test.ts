import { ContractStorage } from './contract-storage';
import { StorageSlot } from '../accounts/storage-slot';

describe('ContractStorage', () => {
  let storage: ContractStorage;

  beforeEach(() => {
    storage = new ContractStorage();
  });

  it('should get and set storage slots', () => {
    const slot1 = storage.get('key1');
    slot1.setValue(100);
    expect(slot1.getValue()).toBe(100);

    const slot2 = storage.get('key2');
    slot2.setValue(200);
    expect(slot2.getValue()).toBe(200);
  });

  it('should support mappings', () => {
    const mapping = storage.getMapping('map');
    mapping.set('key1', new StorageSlot().setValue(100));
    mapping.set('key2', new StorageSlot().setValue(200));

    expect(mapping.get('key1')?.getValue()).toBe(100);
    expect(mapping.get('key2')?.getValue()).toBe(200);
  });

  it('should support arrays', () => {
    const array = storage.getArray('arr');
    array.push(new StorageSlot().setValue(1));
    array.push(new StorageSlot().setValue(2));
    array.push(new StorageSlot().setValue(3));

    expect(array.map(slot => slot.getValue())).toEqual([1, 2, 3]);
  });

  it('should delete storage slots', () => {
    storage.set('key', new StorageSlot().setValue(100));
    expect(storage.has('key')).toBe(true);

    storage.delete('key');
    expect(storage.has('key')).toBe(false);
  });
});