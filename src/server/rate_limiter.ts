export class RateLimiter {
  private lastExecute: Date;
  private delayInMiliseconds: number;
  private requestQueue: (() => void)[] = [];
  private waiting = false;
  private farFuture = new Date();

  public constructor(delayInMiliseconds: number) {
    this.lastExecute = new Date();
    this.lastExecute.setFullYear(1990);
    this.delayInMiliseconds = delayInMiliseconds;
    this.farFuture.setFullYear(2099);
  }

  private timeRemaining(): number {
    const timeEllapsed = new Date().getTime() - this.lastExecute.getTime();
    if (timeEllapsed < 0) {
      // Request is in progress. Assume it will finish immediately, so check again after specified delay.
      return this.delayInMiliseconds;
    }
    const timeRemaining = this.delayInMiliseconds - timeEllapsed;
    return timeRemaining;
  }

  public lock(): Promise<void> {
    return new Promise((resolve) => {
      this.requestQueue.push(resolve);
      this.tryProcessNextRequest();
    });
  }

  public unlock(): void {
    this.lastExecute = new Date();
  }

  private tryProcessNextRequest(): void {
    if (this.requestQueue.length === 0) {
      return;
    }

    const timeRemaining = this.timeRemaining();
    if (timeRemaining <= 0) {
      const resolver = this.requestQueue.splice(0, 1)[0];
      this.lastExecute = this.farFuture;
      resolver();
      this.tryProcessNextRequest();
    } else if (!this.waiting) {
      this.waiting = true;
      setTimeout(() => {
        this.waiting = false;
        this.tryProcessNextRequest();
      }, timeRemaining);
    }
  }
}
