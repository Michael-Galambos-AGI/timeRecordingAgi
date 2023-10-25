sap.ui.define([], function () {
  "use strict";
  return {
    weekdayText (sStatus) {
      var resourceBundle = this.getOwnerComponent()
        .getModel("i18n")
        .getResourceBundle();
        sStatus = sStatus.getDay()
      switch (sStatus) {
        case 0:
          return resourceBundle.getText("sun");
        case 1:
          return resourceBundle.getText("mon");
        case 2:
          return resourceBundle.getText("tue");
        case 3:
          return resourceBundle.getText("wed");
        case 4:
          return resourceBundle.getText("thu");
        case 5:
          return resourceBundle.getText("fri");
        case 6:
          return resourceBundle.getText("sat");
        default:
          return resourceBundle.getText("bro you did some susy shit");
      }
    },
    secToLocalTimeString (sStatus) {
        const date = new Date()
        date.setHours(0,0,sStatus,0)
        return date.toTimeString().slice(0,8)
    },
    minToLocalTimeString (sStatus) {
      const date = new Date()
      date.setHours(0,sStatus,0,0)
      return date.toTimeString().slice(0,5)
  }
  };
});
