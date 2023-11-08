sap.ui.define(["./BaseController", "sap/ui/model/json/JSONModel"], function (
  BaseController,
  JSONModel
) {
  "use strict";
  return BaseController.extend(
    "sap.ui.agi.timeRecording.controller.Statistics",
    {
      onInit: function () {
        const user = this.getOwnerComponent().getModel("user").getData();
        let arr = [];
        user.tags.forEach((tag) => {
          arr.push({
            tag: tag.name,
            duration: tag.duration,
          });
        });
        this.getView().setModel(new JSONModel(arr), "statistics");
        console.log(this.getView().getModel("statistics").getData());
      },
    }
  );
});
