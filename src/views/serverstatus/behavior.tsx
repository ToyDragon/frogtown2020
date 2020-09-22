import ViewBehavior from "../shared/client/view_behavior";
import { post } from "../shared/client/request";
import { ServerStatusResponse, SetServerTargetStatusRequest } from "./types";
import * as ReactDom from "react-dom";
import * as React from "react";

class ServerStatusViewBehavior extends ViewBehavior<unknown> {
  public async ready(): Promise<void> {
    this.refreshServerStatus();
    setInterval(() => {
      this.refreshServerStatus();
    }, 30000);
  }

  private async refreshServerStatus(): Promise<void> {
    const result = await post<unknown, ServerStatusResponse>(
      "/serverstatus/get_server_status",
      {}
    );
    const tableEle = document.querySelector("#tblStatus") as HTMLTableElement;
    if (result && tableEle) {
      document.querySelector("#spanLoading")?.classList.add("nodisp");
      const sortedServers = result.servers.sort((a, b) => {
        return a.heartbeat > b.heartbeat ? -1 : 1;
      });
      const activeServers = sortedServers.filter((server) => {
        const heart = new Date(server.heartbeat * 1000);
        const timeSinceDeath = new Date().getTime() - heart.getTime();
        const fiveMinutes = 5 * 60 * 1000;
        const isActive = server.status.substr(0, 1) === "0";
        return isActive && timeSinceDeath < fiveMinutes;
      });
      const suspectServers = sortedServers.filter((server) => {
        const heart = new Date(server.heartbeat * 1000);
        const fiveMinutes = 5 * 60 * 1000;
        const thirtyMinutes = 30 * 60 * 1000;
        const timeSinceDeath = new Date().getTime() - heart.getTime();
        const isActive = server.status.substr(0, 1) === "0";
        return (
          (!isActive || timeSinceDeath > fiveMinutes) &&
          timeSinceDeath < thirtyMinutes
        );
      });
      ReactDom.render(
        <React.Fragment>
          {(() => {
            if (result.batch_server) {
              return <h3>Batch server: {result.batch_server}</h3>;
            }
            return <React.Fragment></React.Fragment>;
          })()}
          <h3>Active Servers</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Last Heartbeat</th>
                <th>Version</th>
                <th>Status</th>
                <th>Requested Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {activeServers.map((server, index) => {
                return (
                  <tr key={index}>
                    <td>{server.name}</td>
                    <td>
                      {new Date(server.heartbeat * 1000).toLocaleString()}
                    </td>
                    <td>{server.version}</td>
                    <td>{server.status}</td>
                    <td>{server.targetStatus}</td>
                    <td>
                      <button className="btnKill" data-servername={server.name}>
                        Kill
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <h3>Recently Shutdown Servers</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Last Heartbeat</th>
                <th>Version</th>
                <th>Status</th>
                <th>Requested Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {suspectServers.map((server, index) => {
                return (
                  <tr key={index}>
                    <td>{server.name}</td>
                    <td>
                      {new Date(server.heartbeat * 1000).toLocaleString()}
                    </td>
                    <td>{server.version}</td>
                    <td>{server.status}</td>
                    <td>{server.targetStatus}</td>
                    <td>
                      <button className="btnKill" data-servername={server.name}>
                        Kill
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </React.Fragment>,
        tableEle
      );
      const killBtns = document.querySelectorAll(".btnKill");
      if (killBtns) {
        for (const killBtn of killBtns) {
          killBtn.addEventListener("click", async () => {
            await post<SetServerTargetStatusRequest, unknown>(
              "/serverstatus/set_server_target_status",
              {
                name: killBtn.getAttribute("data-servername") || "",
                targetStatus: 1,
              }
            );
            this.refreshServerStatus();
          });
        }
      }
    }
  }
}

// Expose behavior to the window for easier debugging.
const behavior = new ServerStatusViewBehavior();
behavior;
