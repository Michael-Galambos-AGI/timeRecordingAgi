sap.ui.define(["./BaseController", "sap/ui/model/json/JSONModel"], function (
  BaseController,
  JSONModel
) {
  "use strict";
  return BaseController.extend("sap.ui.agi.timeRecording.controller.Calendar", {
    onInit: function () {
      this.getView().setModel(
        new JSONModel({
          time1: "",
          time2: "",
        })
      );
    },
    onPress: function () {
      console.log("sus");
      this.getView()
        .byId("gridMonday")
        .getItems()
        .forEach((element, index) => {
          if (
            index >= this.getView().getModel().getData().time1 &&
            index <= this.getView().getModel().getData().time2
          ) {
            element.setEnabled(false);
          } else {
            element.setEnabled(true);
          }
        });
    },
    onPressRout: function () {
      this.getOwnerComponent().getRouter().navTo("week");
    },
  });
});
