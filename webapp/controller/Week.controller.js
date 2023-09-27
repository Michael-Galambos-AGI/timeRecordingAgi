sap.ui.define(["./BaseController", "sap/ui/model/json/JSONModel"], function (
    BaseController,
    JSONModel
  ) {
    "use strict";
    return BaseController.extend("sap.ui.agi.timeRecording.controller.Week", {
      onInit: function () {
        let date = new JSONModel([
            new Date().toLocaleDateString(),
            new Date().toLocaleDateString(),
            new Date().toLocaleDateString(),
            new Date().toLocaleDateString(),
            new Date().toLocaleDateString(),
            new Date().toLocaleDateString(),
            new Date().toLocaleDateString(),
            new Date().toLocaleDateString(),
            new Date().toLocaleDateString(),
            new Date().toLocaleDateString(),
            new Date().toLocaleDateString(),
            new Date().toLocaleDateString(),
            new Date().toLocaleDateString(),
            new Date().toLocaleDateString(),
            new Date().toLocaleDateString(),
            new Date().toLocaleDateString(),
            new Date().toLocaleDateString(),
            new Date().toLocaleDateString(),
            new Date().toLocaleDateString(),
            new Date().toLocaleDateString(),
            new Date().toLocaleDateString(),
            new Date().toLocaleDateString(),
            new Date().toLocaleDateString(),
            new Date().toLocaleDateString(),
            new Date().toLocaleDateString(),
            new Date().toLocaleDateString(),
            new Date().toLocaleDateString(),
            new Date().toLocaleDateString(),
            new Date().toLocaleDateString(),
            new Date().toLocaleDateString(),
            new Date().toLocaleDateString(),
        ])
        this.getView().setModel(date,"date")


        this.getView().setModel(
          new JSONModel({
            time1: "",
            time2: "",
          })
        );
      },
      onPress: function () {
        alert(new Date().getMonth());
      },
      onPressRout: function () {
        this.getOwnerComponent().getRouter().navTo("Overview");
      },
    });
  });
  