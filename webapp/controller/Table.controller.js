sap.ui.define(["./BaseController", "sap/ui/model/json/JSONModel"], function (
  BaseController,
  JSONModel
) {
  "use strict";
  return BaseController.extend("sap.ui.agi.timeRecording.controller.Table", {
    onInit: function () {
      this.getView().setModel(new JSONModel([]), "timers");
      setInterval(() => {
        let oModel = this.getView().getModel("timers").getData();
        oModel.forEach((element) => {
          if (element.id === this.id) {
            element.duration = Math.round(
              new Date() / 1000 - element.times[0].startDate / 1000
            );
            this.getView().getModel("timers").refresh();
            return;
          }
        });
      }, 1000);
    },
    id: 0,
    onAddTimer: function () {
      let oModel = this.getView().getModel("timers").getData();
      const startDate = new Date();
      const endDate = null;
      const id = oModel.length + 1;
      oModel.push({
        id: id,
        times: [{ startDate, endDate }],
        duration: 0,
        discription:
          "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam",
      });
      this.getView().getModel("timers").refresh();
      this.id = id;
    },
    onContinueTimer: function (oEvent) {
      this.id = oEvent.getSource().getBindingContext("timers").getProperty("id")
    }
  });
});
