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

      oMessagePopover,

      async onInit() {

        // Super aufrufen!

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
        // onInit???
        this.byId("messagePopoverBtn").addDependent(this.oMessagePopover);
      },

      onPressMessagePopoverToggle: function (oEvent) {
        this.oMessagePopover.toggle(oEvent.getSource());
      },
    });
  }
);
