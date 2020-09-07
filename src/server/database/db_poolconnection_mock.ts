import PooledConnection from "./db_poolconnection";

export default class PooledConnectionMock implements PooledConnection {
  public beginTransaction(cb: (e: Error | null) => void): void {
    cb(null);
  }

  public commit(cb: (e: Error | null) => void): void {
    cb(null);
  }

  public rollback(cb: () => void): void {
    cb();
  }

  public query<T>(
    _query: string,
    _values: unknown[],
    cb: (err: Error | null, results?: T) => void
  ): void {
    cb(null);
  }

  public release(): void {}

  public on(_ev: string, _callback: unknown): PooledConnection {
    return this;
  }
}
