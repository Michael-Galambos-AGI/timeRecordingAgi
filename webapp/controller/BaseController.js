sap.ui.define(
  ["sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel"],
  function (Controller, JSONModel) {
    "use strict";

    return Controller.extend(
      "sap.ui.agi.timeRecording.controller.BaseController",
      {
        onInit: function () {},
        refresh: async function () {
          await fetch("http://localhost:3000/user", {
            method: "GET",
          })
            .then((res) => res.json())
            .then((data) => {
              this.getOwnerComponent()
                .getModel("user")
                .setData(data);
            });
        },
      }
    );
  }
);
