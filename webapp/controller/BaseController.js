sap.ui.define(["sap/ui/core/mvc/Controller"], function (Controller) {
  "use strict";
  return Controller.extend(
    "sap.ui.agi.timeRecording.controller.BaseController",
    {
      oMessagePopover: undefined,
      async refresh() {
        await fetch("http://localhost:3000/user", {
          method: "GET",
        })
          .then((res) => res.json())
          .then((data) => {
            data.entries.forEach((entry) => {
              entry.times.forEach((time) => {
                let date = new Date(time.date);
                date.setHours(0, 0, 0, 0);
                time.date = date;
              });
            });
            this.getOwnerComponent().getModel("user").setData(data);
          });
      },
      getModelData(modelName) {
        return this.getView().getModel(modelName).getData();
      },
      getModel(modelName) {
        return this.getView().getModel(modelName);
      },
    }
  );
});
