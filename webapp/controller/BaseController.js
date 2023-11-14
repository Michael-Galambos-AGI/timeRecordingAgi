sap.ui.define(["sap/ui/core/mvc/Controller"], function (Controller) {
  "use strict";
  return Controller.extend(
    "sap.ui.agi.timeRecording.controller.BaseController",
    {
      oMessagePopover: undefined,
      /**
       * refreshes user model wit a res or fetches res from server
       * @param {?String} sRes
       */
      async refresh(sRes = undefined) {
        if (!sRes) {
          sRes = await this.getFetch();
        }
        oRes = await sRes.json();
        this.getOwnerComponent().getModel("user").setData(oRes);
      },
      /**
       * get oModel from model
       * @param {String} sModelName
       * @returns oModel
       */
      getModel(sModelName) {
        return this.getView().getModel(sModelName);
      },
      /**
       * get oObject from model
       * @param {String} sModelName
       * @returns oObject
       */
      getModelData(sModelName) {
        return this.getModel(sModelName).getData();
      },
      /**
       * handles post reqest to server
       * @param {Object} oObject
       * @returns
       */
      async postFetch(oObject) {
        const sRes = await fetch("http://localhost:3000/post", {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(oObject),
        });
        return sRes;
      },
      /**
       * handles get reqest to server
       * @param {Object} oObject
       * @returns
       */
      async getFetch() {
        const sRes = await fetch("http://localhost:3000/getUser", {
          method: "GET",
        });
        return sRes;
      },
      /**
       * handles delete reqest to server
       * @param {Object} oObject
       * @returns
       */
      async deleteFetch(oObject) {
        const sRes = await fetch("http://localhost:3000/delete", {
          method: "DELETE",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(oObject),
        });
        return sRes;
      },
      /**
       * handles patch reqest to server
       * @param {Object} oObject
       * @returns
       */
      async patchFetch(oObject) {
        const sRes = await fetch("http://localhost:3000/patch", {
          method: "PATCH",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(oObject),
        });
        return sRes;
      },
    }
  );
});
