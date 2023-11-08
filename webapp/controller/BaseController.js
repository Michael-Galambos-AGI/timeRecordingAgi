sap.ui.define(["sap/ui/core/mvc/Controller"], function (Controller) {
  "use strict";
  return Controller.extend(
    "sap.ui.agi.timeRecording.controller.BaseController",
    {
      async refresh(data = undefined) {
        if (!data) {
          const result = await fetch("http://localhost:3000/getUser", {
            method: "GET",
          });
          data = await result.json();
        }
        
        this.getOwnerComponent().getModel("user").setData(data);
      },
    }
  );
});
