export class DatabaseActionResult<T> {
  public err: Error | null;
  public value: T | null;

  public constructor(err: Error | null, value: T | null) {
    this.err = err;
    this.value = value;
  }
}
