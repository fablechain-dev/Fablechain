class StorageMap {
  private map: Map<string, any> = new Map();

  get(key: string): any {
    return this.map.get(key);
  }

  set(key: string, value: any): void {
    this.map.set(key, value);
  }

  delete(key: string): void {
    this.map.delete(key);
  }
}

class StorageArray {
  private array: any[] = [];

  get(index: number): any {
    return this.array[index];
  }

  set(index: number, value: any): void {
    this.array[index] = value;
  }

  push(value: any): void {
    this.array.push(value);
  }

  pop(): any {
    return this.array.pop();
  }
}

export { StorageMap, StorageArray };