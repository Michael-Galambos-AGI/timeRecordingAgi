sap.ui.define(["./BaseController", "sap/ui/model/json/JSONModel"], function (
  BaseController,
  JSONModel
) {
  "use strict";
  return BaseController.extend("sap.ui.agi.timeRecording.controller.Table", {
    onInit: function () {
      this.getView().setModel(new JSONModel([]), "timers");
      setInterval(() => {
        let timers = this.getView().getModel("timers").getData();
        timers.forEach((timer) => {
          if (timer.running) {
            timer.duration = +Math.round(
              timer.pastDuration + (new Date() - timer.startDate) / 1000
            );
            this.getView().getModel("timers").refresh();
            return;
          }
        });
      }, 500);
    },
    onAddTimer: function () {
      let timers = this.getView().getModel("timers").getData();
      const startDate = new Date();
      const id = Date.now();
      timers.push({
        id: id,
        startDate: startDate,
        duration: 0,
        pastDuration: 0,
        running: false,
        discription: null
      });
      this.getView().getModel("timers").refresh();
    },
    onContinueTimer: function (oEvent) {
      this.getView()
        .getModel("timers")
        .getData()
        .forEach((timer) => {
          if (
            timer.id ===
            oEvent.getSource().getBindingContext("timers").getProperty("id") && timer.discription !== null
          ) {
            timer.running = true;
            timer.startDate = new Date();
          } else if (timer.running) {
            timer.running = false;
            timer.pastDuration += (new Date() - timer.startDate) / 1000;
          } else {
            timer.running = false;
          }
        });
      this.getView().getModel("timers").refresh();
    },
    onPauseTimer: function (oEvent) {
      this.getView()
        .getModel("timers")
        .getData()
        .forEach((timer) => {
          if (
            timer.id ===
            oEvent.getSource().getBindingContext("timers").getProperty("id")
          ) {
            timer.pastDuration += (new Date() - timer.startDate) / 1000;
            timer.startDate = null;
            timer.running = false;
          }
        });
      this.getView().getModel("timers").refresh();
    },
    onSaveTimer: function (oEvent) {},
    onDeleteTimer: function (oEvent) {
      const timers = this.getView().getModel("timers").getData();
      timers.forEach((timer) => {
        if (
          timer === oEvent.getSource().getBindingContext("timers").getObject()
        ) {
          timers.splice(timers.indexOf(timer), 1);
        }
      });
      this.getView().getModel("timers").refresh();
    },
  });
});
