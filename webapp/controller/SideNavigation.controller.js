sap.ui.define(["./BaseController", "sap/ui/model/json/JSONModel"], function (
  BaseController,
  JSONModel
) {
  "use strict";
  return BaseController.extend(
    "sap.ui.agi.timeRecording.controller.SideNavigation",
    {
      onInit: function () {
        const entries = this.getOwnerComponent().getModel("user").getData().entries;
        entries.forEach((entry) => {
          entry.duration = 0;
          entry.times.forEach((time) => {
            entry.duration += time.duration
          });
        });
        this.getView().setModel(new JSONModel(entries), "entries");
      },

      refreshSide: async function () {
        const entries = this.getOwnerComponent().getModel("user").getData().entries;
        entries.forEach((entry) => {
          entry.duration = 0;
          entry.times.forEach((time) => {
            entry.duration += time.duration
          });
        });
        this.getModel("entries").setData(entries)
      },
      onPressEdit: function () {
        
      }
    }
  );
});
