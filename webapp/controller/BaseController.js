sap.ui.define(
  ["sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel"],
  function (Controller, JSONModel) {
    "use strict";

    return Controller.extend(
      "sap.ui.agi.timeRecording.controller.BaseController",
      {
        onInit: async function () {
          const data = this.getOwnerComponent().getModel("user").getData();
          data.entries.forEach((entry) => {
            entry.times.forEach((time) => {
              let date = new Date(time.date)
              date.setHours(0,0,0,0)
              time.date = date;
            });
          });
        },
        refresh: async function () {
          await fetch("http://localhost:3000/user", {
            method: "GET",
          })
            .then((res) => res.json())
            .then((data) => {
              data.entries.forEach((entry) => {
                entry.times.forEach((time) => {
                  let date = new Date(time.date)
                  date.setHours(0,0,0,0)
                  time.date = date;
                });
              });
              this.getOwnerComponent().getModel("user").setData(data);
            });
        },
        getModelData: function (modelName) {
          return this.getView().getModel(modelName).getData();
        },
        getModel: function (modelName) {
          return this.getView().getModel(modelName);
        },
      }
    );
  }
);
