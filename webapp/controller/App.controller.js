sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessagePopover",
    "sap/m/MessageItem",
    "../model/Formatter",
  ],
  function (BaseController, JSONModel, MessagePopover, MessageItem,Formatter) {
    "use strict";
    return BaseController.extend("sap.ui.agi.timeRecording.controller.App", {
      async onInit() {
        //Button
        this.oMessagePopover = new MessagePopover({
          items: {
            path: "notifications>/",
            template: new MessageItem({
              type: "{notifications>type}",
              title: "{notifications>title}",
              description: "{notifications>description}",
              markupDescription: true,
            }),
          },
        });
        this.oMessagePopover.setAsyncDescriptionHandler(function (config) {
          config.promise.resolve({
            allowed: true,
            id: config.id,
          });
        });
      },
      Formatter: Formatter,

      onAfterRendering() {
        this.byId("messagePopoverBtn").addDependent(this.oMessagePopover);
      },
      handleMessagePopoverPress: function (oEvent) {
        this.oMessagePopover.toggle(oEvent.getSource());
      },
    });
  }
);
