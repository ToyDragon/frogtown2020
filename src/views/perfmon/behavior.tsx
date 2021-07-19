import ViewBehavior from "../shared/client/view_behavior";
import { post } from "../shared/client/request";
import { SummaryData } from "../../server/services/performance_monitor/performance_monitor";

class PerfMonitorViewBehavior extends ViewBehavior<unknown> {
  public async ready(): Promise<void> {
    this.refreshPerfSummary();
    setInterval(() => {
      this.refreshPerfSummary();
    }, 5000);
  }

  private async refreshPerfSummary(): Promise<void> {
    const result = await post<unknown, Record<string, SummaryData>>(
      "/perfmon/get_performance_summary",
      {}
    );

    let display = "";
    const row = (msg: string, indent: number) => {
      return `<div style="padding-left: ${indent * 7}px">${msg}</div>`;
    };

    const Print = (data: Record<string, SummaryData>, indent: number) => {
      for (const label in data) {
        const d = data[label];
        display += row("{", indent);
        display += row("label: " + label, indent + 1);
        display += row(
          `max millis: ${d.max_millis}, ` +
            `avg millis: ${Math.round(d.total_millis / d.total_occurances)}, ` +
            `occurances: ${d.total_occurances}`,
          indent + 1
        );
        if (d.children && Object.keys(d.children).length > 0) {
          display += row("children: [", indent + 1);
          Print(d.children, indent + 2);
          display += row(`] // children ${label}`, indent + 1);
        }
        display += row("}", indent);
      }
    };

    Print(result!, 0);
    document.getElementById("divPerfData")!.innerHTML = display;
  }
}

// Expose behavior to the window for easier debugging.
const behavior = new PerfMonitorViewBehavior();
behavior;
