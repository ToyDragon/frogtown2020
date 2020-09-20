interface CacheEntry<T> {
  value: T;
  date: Date;
}

export class AsyncCacher<T> {
  private retriever!: (r: string) => Promise<T>;
  private ttlMilliseconds: number;

  private cache: Record<string, CacheEntry<T>> = {};
  private inProgress: Record<string, Promise<T>> = {};

  public constructor(
    ttlMilliseconds: number,
    retriever: (r: string) => Promise<T>
  ) {
    this.ttlMilliseconds = ttlMilliseconds;
    this.retriever = retriever;
  }

  public async get(r: string): Promise<T> {
    if (this.inProgress[r]) {
      return await this.inProgress[r];
    }

    const cacheEntry = this.cache[r];
    if (cacheEntry) {
      const millisEllapsed = new Date().getTime() - cacheEntry.date.getTime();
      if (millisEllapsed <= this.ttlMilliseconds) {
        return cacheEntry.value;
      }
    }

    let resolver!: (value: T) => void;
    this.inProgress[r] = new Promise<T>((resolverTmp) => {
      resolver = resolverTmp;
    });
    const value = await this.retriever(r);
    this.cache[r] = {
      value: value,
      date: new Date(),
    };
    delete this.inProgress[r];
    resolver(value);
    return value;
  }
}
