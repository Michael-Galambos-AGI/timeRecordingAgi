sap.ui.define(["./BaseController",
	"sap/ui/model/json/JSONModel"], function (BaseController,
	JSONModel) {
  "use strict";
  return BaseController.extend(
    "sap.ui.agi.timeRecording.controller.SideNavigation",
    {
      onInit: function () {
        const model = this.getOwnerComponent().getModel("user").getData();
        let map = model.eligibleTags.map((e) => ({
          tagName: e.name,
          duration: 0,
        }));
        map.forEach((tag) => {
          const entries = model.entries
            .filter((entry) => entry.tag === tag.tagName)
            .forEach((entry) => {
              entry.times.forEach((time) => (tag.duration += time.duration));
            });
        });
        this.getView().setModel(new JSONModel(map),"eligibleTags")
      },
    }
  );
});
