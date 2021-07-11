import { logWarning } from "../../log";

export interface SummaryData {
  max_millis: number;
  total_millis: number;
  total_occurances: number;
  label: string;
  children: Record<string, SummaryData>;
}

/**
  Performance sessions don't support monitoring separate sub-sections
  in parallel, only in series. To start a new subsection call `Push`
  with your label, and when complete call `Pop`.

  Labels should not include request specific data, only broad stuff
  such as which view is being rendered, or which queries are being ran.
 */
export interface PerformanceSession {
  Push(label: string): void;
  Pop(): void;
}

/**
  SessionData tracks in-progress sessions, it is similar to
  SummaryData but never exposed to consumers.
 */
interface SessionData {
  ellapsed_millis: number;
  start_millis: number;
  label: string;
  children: SessionData[];
}

// PerformanceSession is intended to be a parameter in our
// consumers' APIs, so having it be an interface with an
// implementation like this makestheir testing easier.
class RealPerformanceSession implements PerformanceSession {
  public constructor(
    rootLabel: string,
    onFinished: (data: SessionData) => void
  ) {
    this.data = {
      ellapsed_millis: -1,
      start_millis: new Date().getTime(),
      label: rootLabel,
      children: [],
    };
    this.onFinished = onFinished;
  }

  private GetLatestUnfinishedCell(): SessionData | null {
    const DFS = (data: SessionData): SessionData | null => {
      // If this node is finished, there's no need to check children.
      if (data.ellapsed_millis >= 0) {
        return null;
      }

      // Check if any children aren't completed yet.
      for (const child of data.children) {
        const unfinished_child = DFS(child);
        if (unfinished_child) {
          return unfinished_child;
        }
      }

      // If this node isn't finished, but all children are finished, then
      // this node must be the lastest unfinished.
      return data;
    };
    return DFS(this.data);
  }

  public Push(label: string): void {
    const cell = this.GetLatestUnfinishedCell();
    if (!cell) {
      logWarning("Trying to push performance data after finish.");
    } else {
      cell.children.push({
        ellapsed_millis: -1,
        start_millis: new Date().getTime(),
        label: label,
        children: [],
      });
    }
  }

  public Pop(): void {
    const cell = this.GetLatestUnfinishedCell();
    if (!cell) {
      logWarning("Trying to pop performance data after finish.");
    } else {
      cell.ellapsed_millis = new Date().getTime() - cell.start_millis;
      if (this.GetLatestUnfinishedCell() === null) {
        this.onFinished(this.data);
      }
    }
  }

  private onFinished!: (data: SessionData) => void;
  private data!: SessionData;
}

export class PerformanceMonitor {
  public StartSession(label: string): PerformanceSession {
    return new RealPerformanceSession(label, (data) => {
      this.SessionFinished(data);
    });
  }

  public GetSummary(): Record<string, SummaryData> {
    return this.summary;
  }

  private SessionFinished(data: SessionData): void {
    this.CopyIntoSummary(data, this.summary);
  }

  private CopyIntoSummary(
    data: SessionData,
    summary: Record<string, SummaryData>
  ): void {
    summary[data.label] = summary[data.label] || {
      children: {},
      label: data.label,
      max_millis: 0,
      total_millis: 0,
      total_occurances: 0,
    };

    summary[data.label].total_millis += data.ellapsed_millis;
    summary[data.label].total_occurances++;
    if (data.ellapsed_millis > summary[data.label].max_millis) {
      summary[data.label].max_millis = data.ellapsed_millis;
    }

    for (const child of data.children) {
      this.CopyIntoSummary(child, summary[data.label].children);
      this.CopyIntoSummary(child, this.summary);
    }
  }

  private summary: Record<string, SummaryData> = {};
}
