import { Clock } from "./clock";

export default class RealClock implements Clock {
  public now(): Date {
    return new Date();
  }
}
