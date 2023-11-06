sap.ui.define(["sap/ui/core/mvc/Controller"], function (Controller) {
  "use strict";
  return Controller.extend(
    "sap.ui.agi.timeRecording.controller.BaseController",
    {
      oMessagePopover: undefined,
      async refresh(model = undefined) {
        if (!model) {
          model = await fetch("http://localhost:3000/getUser", {
            method: "GET",
          });
        }
        model = await model.json();
        this.getOwnerComponent().getModel("user").setData(model);
      },
    }
  );
});
