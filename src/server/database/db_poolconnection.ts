import { MysqlError } from "mysql";

export default interface PooledConnection {
  beginTransaction(cb: (e: Error | null) => void): void;
  commit(cb: (e: Error | null) => void): void;
  rollback(cb: () => void): void;
  query<T>(
    query: string,
    values: unknown[],
    cb: (err: Error | null, results?: T) => void
  ): void;
  release(): void;
  on(ev: string, callback: (err?: MysqlError) => void): unknown;
}
