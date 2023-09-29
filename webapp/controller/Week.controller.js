sap.ui.define(
  ["./BaseController", "sap/ui/model/json/JSONModel", "sap/m/MessageToast"],
  function (BaseController, JSONModel, MessageToast) {
    "use strict";
    return BaseController.extend("sap.ui.agi.timeRecording.controller.Week", {
      onInit: function () {
        const curdate = new Date();
        let date = new JSONModel([]);
        date = this.loadMonth(
          date,
          new Date(curdate.getFullYear(), curdate.getMonth()),
          true
        );

        this.getView().setModel(date, "date");
        this.getView().getModel("date").setSizeLimit(date.getData().length);
        this.getView().setModel(
          new JSONModel({
            time1: "",
            time2: "",
          })
        );
        this.observer();
        this.byId("idScrollContainer").scrollTo(0, 200);
      },
      loadMonth: function (date, month, type) {
        const lastday = new Date(
          month.getFullYear(),
          month.getMonth() + 1,
          0
        ).getDate();
        if (type) {
          for (let i = 1; i <= lastday; i++) {
            date
              .getData()
              .push([
                new Date(
                  month.getFullYear(),
                  month.getMonth(),
                  i
                ).toLocaleDateString(),
              ]);
          }
        } else {
          for (let i = lastday; i > 0; i--) {
            date
              .getData()
              .unshift([
                new Date(
                  month.getFullYear(),
                  month.getMonth(),
                  i
                ).toLocaleDateString(),
              ]);
          }
        }

        return date;
      },
      onAfterRendering: function () {
        const items = this.getView().byId("scrollGrid").getItems();
        this.allObserver.observe(items[0].getDomRef());
        this.allObserver.observe(items[items.length - 1].getDomRef());
      },
      onPress: function () {
        console.log(this.getView().getModel("date").getData());
      },
      onPressRout: function () {
        this.getOwnerComponent().getRouter().navTo("Overview");
      },
      observer: function () {
        let first, last;
        this.allObserver = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              let items = this.getView().byId("scrollGrid").getItems();
              let date = this.getView().getModel("date");

              if (entries[0].target === items[0].getDomRef()) {
                let month = new Date(date.getData()[0]);
                month = new Date(month.getFullYear(), month.getMonth() - 1);
                date = this.loadMonth(date, month, false);
                this.getView()
                  .getModel("date")
                  .setSizeLimit(date.getData().length);
                this.getView().getModel("date").refresh();
                this.byId("idScrollContainer").scrollTo(0, 1500);
              } else {
                let month = new Date(date.getData()[date.getData().length - 1]);
                month = new Date(month.getFullYear(), month.getMonth() + 1);
                date = this.loadMonth(date, month, true);
                this.getView()
                  .getModel("date")
                  .setSizeLimit(date.getData().length);
                this.getView().getModel("date").refresh();
              }
              this.allObserver.unobserve(items[0].getDomRef());
              this.allObserver.unobserve(items[items.length - 1].getDomRef());
              items = this.getView().byId("scrollGrid").getItems();
              this.delay(1).then(() => {
                this.allObserver.observe(items[0].getDomRef());
                this.allObserver.observe(items[items.length - 1].getDomRef());
              });
            }
          },
          {
            root: this.getView().byId("idScrollContainer").getDomRef(),
            rootMargin: "200px",
          }
        );
      },
      delay: function (time) {
        return new Promise((resolve) => setTimeout(resolve, time));
      },
    });
  }
);
