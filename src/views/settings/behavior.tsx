import ViewBehavior from "../shared/client/view_behavior";
import Debouncer from "../shared/debouncer";
import { post } from "../shared/client/request";
import {
  NameChangeRequest,
  TTSBackChangeRequest,
  UserQualityResponse,
  QualityChangeRequest,
  ValidatePrivateIDRequest,
  ValidatePrivateIDResponse,
} from "./types";
import { isValidPrivateId } from "../../shared/id_validation";

class SettingsViewBehavior extends ViewBehavior<unknown> {
  private nameDebouncer = new Debouncer(500);
  private backDebouncer = new Debouncer(500);
  private idDebouncer = new Debouncer(500);
  private isHQ = false;

  public async ready(): Promise<void> {
    this.setupEditDisplayName();
    this.setupEditTTSBack();
    this.setupToggleQuality();
    this.setupEditPrivate();
  }

  private async updateQualityDisplay(): Promise<void> {
    const spanQualityDisplay = document.querySelector(
      "#spanCurrentQualityDisplay"
    ) as HTMLElement;
    const btnToggleQuality = document.querySelector(
      "#btnToggleHQ"
    ) as HTMLElement;
    if (spanQualityDisplay && btnToggleQuality) {
      if (this.isHQ) {
        spanQualityDisplay.innerText = "High Quality";
        btnToggleQuality.innerText = "Change to Low Quality";
      } else {
        spanQualityDisplay.innerText = "Low Quality";
        btnToggleQuality.innerText = "Change to High Quality";
      }
    }
  }

  private async setupEditPrivate(): Promise<void> {
    const btnShowPrivateId = document.querySelector("#btnChangePrivateId");
    const divEdit = document.querySelector("#divPrivateId");
    const inputPrivateID = document.querySelector(
      "#inputId"
    ) as HTMLInputElement;
    const inputBad = document.querySelector("#inputId + .error");
    const inputRefresh = document.querySelector("#inputId + .error + .refresh");
    const inputOK = document.querySelector(
      "#inputId + .error + .refresh + .ok"
    );
    if (
      btnShowPrivateId &&
      divEdit &&
      inputPrivateID &&
      inputRefresh &&
      inputBad &&
      inputOK
    ) {
      inputPrivateID.value = this.authSession.user.privateId;
      btnShowPrivateId.addEventListener("click", () => {
        btnShowPrivateId.classList.add("nodisp");
        inputBad.classList.add("nodisp");
        divEdit.classList.remove("nodisp");
        console.log("Showing provate");
      });

      inputPrivateID.addEventListener("keyup", async () => {
        inputRefresh.classList.remove("nodisp");
        inputBad.classList.add("nodisp");
        inputOK.classList.add("nodisp");
        if (await this.idDebouncer.waitAndShouldAct()) {
          const newID = inputPrivateID.value;
          if (!isValidPrivateId(newID)) {
            inputBad.classList.remove("nodisp");
            inputRefresh.classList.add("nodisp");
            inputOK.classList.add("nodisp");
          } else {
            const result = await post<
              ValidatePrivateIDRequest,
              ValidatePrivateIDResponse
            >("/settings/validate_private_id", {
              id: newID,
            });

            if (result && result.publicId) {
              this.authSession.changeUser(result.publicId, newID);
              inputOK.classList.remove("nodisp");
              inputRefresh.classList.add("nodisp");
              inputBad.classList.add("nodisp");
            } else {
              inputBad.classList.remove("nodisp");
              inputOK.classList.add("nodisp");
              inputRefresh.classList.add("nodisp");
            }
          }
        }
      });
    }
  }

  private async setupToggleQuality(): Promise<void> {
    const result = await post<unknown, UserQualityResponse>(
      "/settings/check_quality",
      {}
    );
    this.isHQ = !!result && result.isHQ;
    this.updateQualityDisplay();
    const btnToggleQuality = document.querySelector("#btnToggleHQ");
    if (btnToggleQuality) {
      btnToggleQuality.addEventListener("click", async () => {
        this.isHQ = !this.isHQ;
        await post<QualityChangeRequest, void>("/settings/change_quality", {
          isHQ: this.isHQ,
        });
        this.updateQualityDisplay();
      });
    }
  }

  private async updateBackPreview(): Promise<void> {
    let backURL = "https://www.frogtown.me/Images/CardBack.jpg";
    const input = document.querySelector("#ttsBackInput") as HTMLInputElement;
    if (input && input.value.trim().length > 0) {
      backURL = input.value.trim();
    }
    const preview = document.querySelector("#ttsBackPreview") as HTMLDivElement;
    if (preview) {
      // eslint-disable-next-line prettier/prettier
      preview.style.backgroundImage = "url('" + backURL + "')";
      preview.style.backgroundColor = "red";
      // eslint-disable-next-line prettier/prettier
      console.log("Set background to " + "url('" + backURL + "')");
    }
  }

  private async setupEditTTSBack(): Promise<void> {
    const input = document.querySelector("#ttsBackInput") as HTMLInputElement;
    const inputRefresh = document.querySelector("#ttsBackInput + .refresh");
    const inputOK = document.querySelector("#ttsBackInput + .refresh + .ok");
    if (input && inputRefresh && inputOK) {
      input.value = this.getIncludedData().userDetails.backUrl;
      this.updateBackPreview();
      input.addEventListener("keyup", async () => {
        if (input.value.length > 250) {
          input.value = input.value.substr(0, 250);
        }
        inputOK.classList.add("nodisp");
        inputRefresh.classList.remove("nodisp");
        if (await this.backDebouncer.waitAndShouldAct()) {
          this.updateBackPreview();
          await post<TTSBackChangeRequest, void>("/settings/change_tts_back", {
            newURL: input.value,
          });
          inputOK.classList.remove("nodisp");
          inputRefresh.classList.add("nodisp");
        }
      });
    }
  }

  private async setupEditDisplayName(): Promise<void> {
    const inputName = document.querySelector("#inputName") as HTMLInputElement;
    const inputNameRefresh = document.querySelector("#inputName + .refresh");
    const inputNameOK = document.querySelector("#inputName + .refresh + .ok");
    if (inputName && inputNameRefresh && inputNameOK) {
      inputName.value = this.getIncludedData().userDetails.name;
      inputName.addEventListener("keyup", async () => {
        if (inputName.value.length > 30) {
          inputName.value = inputName.value.substr(0, 30);
        }
        inputNameOK.classList.add("nodisp");
        inputNameRefresh.classList.remove("nodisp");
        if (await this.nameDebouncer.waitAndShouldAct()) {
          await post<NameChangeRequest, void>("/settings/change_name", {
            newName: inputName.value,
          });
          inputNameOK.classList.remove("nodisp");
          inputNameRefresh.classList.add("nodisp");
        }
      });
    }
  }
}

// Expose behavior to the window for easier debugging.
const behavior = new SettingsViewBehavior();
behavior;
