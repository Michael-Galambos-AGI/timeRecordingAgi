sap.ui.define(
  [
    "./BaseController",
    "sap/m/MessagePopover",
    "sap/m/MessageItem",
    "../model/Formatter",
  ],
  function (BaseController, MessagePopover, MessageItem,Formatter) {
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
      onPressMessagePopover: function (oEvent) {
        this.oMessagePopover.toggle(oEvent.getSource());
      },
    });
  }
);
