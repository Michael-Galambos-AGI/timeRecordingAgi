sap.ui.define(["./Week", "sap/ui/model/json/JSONModel"], function (
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
              timer.pastDuration + (new Date() - timer.lastDate) / 1000
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
        lastDate: startDate,
        duration: 0,
        pastDuration: 0,
        running: false,
        discription: null,
        tag: null,
      });
      this.getView().getModel("timers").refresh();
    },
    onContinueTimer: function (oEvent) {
      const row = oEvent.getSource().getBindingContext("timers");
      if (
        row.getProperty("tag") === null ||
        row.getProperty("discription") === null
      ) {
        return;
      }
      this.getView()
        .getModel("timers")
        .getData()
        .forEach((timer) => {
          if (timer.id === row.getProperty("id")) {
            timer.running = true;
            timer.lastDate = new Date();
          } else if (timer.running) {
            timer.running = false;
            timer.pastDuration += (new Date() - timer.lastDate) / 1000;
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
            timer.pastDuration += (new Date() - timer.lastDate) / 1000;
            timer.lastDate = null;
            timer.running = false;
          }
        });
      this.getView().getModel("timers").refresh();
    },
    onSaveTimer: async function (oEvent) {
      const row = oEvent.getSource().getBindingContext("timers");
      if (row.getProperty("duration") === 0) return;
      const model = new JSONModel({
        date: row.getProperty("startDate"),
        discription: row.getProperty("discription"),
        duration: Math.round(row.getProperty("duration")/60),
        tag: row.getProperty("tag"),
      });
      this.onDeleteTimer(oEvent)
      await fetch("http://localhost:3000/entry", {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        redirect: "follow",
        body: JSON.stringify(model.getData())
      })

    },
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
    onDropWeekToTable: function (oEvent) {
      const date = oEvent
        .getParameter("draggedControl")
        .getBindingContext("dates");
      const id = Date.now();
      this.getView()
        .getModel("timers")
        .getData()
        .push({
          id: id,
          startDate: date.getProperty("date"),
          lastDate: date.getProperty("date"),
          duration: date.getProperty("duration") * 60,
          pastDuration: date.getProperty("duration") * 60,
          running: false,
          discription: date.getProperty("discription"),
          tag: date.getProperty("tag"),
        });
      this.getView().getModel("timers").refresh();
    },
  });
});
