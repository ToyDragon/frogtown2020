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

    const cbHeartbeatFilter = document.querySelector(
      "#cbHeartbeatFilter"
    ) as HTMLInputElement;
    if (cbHeartbeatFilter) {
      cbHeartbeatFilter.addEventListener("change", () => {
        console.log(cbHeartbeatFilter.checked);
        this.refreshServerStatus();
      });
    }
  }

  private async refreshServerStatus(): Promise<void> {
    const result = await post<unknown, ServerStatusResponse>(
      "/serverstatus/get_server_status",
      {}
    );
    let filterOld = false;
    const cbHeartbeatFilter = document.querySelector(
      "#cbHeartbeatFilter"
    ) as HTMLInputElement;
    if (cbHeartbeatFilter) {
      filterOld = cbHeartbeatFilter.checked;
    }
    const tableEle = document.querySelector("#tblStatus") as HTMLTableElement;
    if (result && tableEle) {
      document.querySelector("#spanLoading")?.classList.add("nodisp");
      ReactDom.render(
        <React.Fragment>
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
            {result.servers.map((server, index) => {
              const heart = new Date(server.heartbeat * 1000);
              if (
                filterOld &&
                new Date().getTime() - heart.getTime() > 5 * 60 * 1000
              ) {
                return <React.Fragment></React.Fragment>;
              }
              // Super hacky key to be unique with every refresh.
              return (
                <tr key={index}>
                  <td>{server.name}</td>
                  <td>{heart.toLocaleString()}</td>
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
