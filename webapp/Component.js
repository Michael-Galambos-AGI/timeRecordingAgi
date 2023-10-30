sap.ui.define(
  ["sap/ui/core/UIComponent", "sap/ui/model/json/JSONModel"],
  (UIComponent, JSONModel) => {
    "use strict";

    return UIComponent.extend("sap.ui.agi.timeRecording.Component", {
      metadata: {
        interfaces: ["sap.ui.core.IAsyncContentCreation"],
        manifest: "json",
      },
      async init() {
        UIComponent.prototype.init.apply(this, arguments);
        this.getRouter().initialize();
        const user = this.getModel("user");
        let notifications = [];
        await user.dataLoaded().then(() => {
          if (
            Object.keys(user.getData()).length === 0 &&
            user.getData().constructor === Object
          ) {
            notifications.push({
              type: "Error",
              title: "Server not found",
              description: "no reply from server",
            });
            return;
          }
        });
        this.setModel(new JSONModel(notifications), "notifications");
      },
    });
  }
);
