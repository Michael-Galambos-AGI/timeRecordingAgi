sap.ui.define(["sap/ui/core/mvc/Controller"], function (Controller) {
  "use strict";
  return Controller.extend(
    "sap.ui.agi.timeRecording.controller.BaseController",
    {
      oMessagePopover: undefined,
      async refresh(model = undefined) {
        if (!model) {
          model = await this.getFetch();
        }
        model = await model.json();
        this.getOwnerComponent().getModel("user").setData(model);
      },
      getModel(sModelName) {
        return this.getView().getModel(sModelName);
      },
      getModelData(sModelName) {
        return this.getModel(sModelName).getData();
      },

      async postFetch(oObject) {
        const res = await fetch("http://localhost:3000/post", {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(oObject),
        });
        return res;
      },
      async getFetch() {
        const res = await fetch("http://localhost:3000/getUser", {
          method: "GET",
        });
        return res;
      },
      async deleteFetch(oObject) {
        const res = await fetch("http://localhost:3000/delete", {
          method: "DELETE",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(oObject),
        });
        return res;
      },
      async patchFetch(oObject) {
        const res = await fetch("http://localhost:3000/patch", {
          method: "PATCH",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(oObject),
        });
        return res;
      },
    }
  );
});
