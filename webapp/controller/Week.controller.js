sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
  ],
  function (BaseController, JSONModel, MessageToast, Fragment) {
    "use strict";
    return BaseController.extend("sap.ui.agi.timeRecording.controller.Week", {
      onInit: async function () {
        const curdate = new Date();
        let date = new JSONModel([]);
        date = await this.loadMonth(
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
      loadMonth: async function (date, month, type) {
        const lastday = new Date(
          month.getFullYear(),
          month.getMonth() + 1,
          0
        ).getDate();
        if (type) {
          for (let i = 1; i <= lastday; i++) {
            const ndate = new Date(
              month.getFullYear(),
              month.getMonth(),
              i
            ).toLocaleDateString();
            date.getData().push([ndate, await this.checkdates(ndate)]);
          }
        } else {
          for (let i = lastday; i > 0; i--) {
            const ndate = new Date(
              month.getFullYear(),
              month.getMonth(),
              i
            ).toLocaleDateString();
            date.getData().unshift([ndate, await this.checkdates(ndate)]);
          }
        }
        console.log(date.getData())
        return date;
      },

      checkdates: async function (date) {
        const model = await this.getOwnerComponent().getModel("time").getData();
        let entrie = [];
        model[0].entry.forEach((element) => {
          let i = 0;
          element.time.forEach((time) => {
            const ndate = new Date(time.date).toLocaleDateString();
            if (ndate === date) {
              entrie.push([ndate, element.time[i].time]);
            }
            i++
          });
        });
        return entrie;
      },
      onAfterRendering: async function () {
        const items = this.getView().byId("scrollGrid").getItems();
        this.allObserver.observe(items[0].getDomRef());
        this.allObserver.observe(items[items.length - 1].getDomRef());
      },
      observer: function () {
        this.allObserver = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              let items = this.getView().byId("scrollGrid").getItems();
              let date = this.getView().getModel("date");

              if (entries[0].target === items[0].getDomRef()) {
                let month = new Date(date.getData()[0][0]);
                month = new Date(month.getFullYear(), month.getMonth() - 1);
                this.loadMonth(date, month, false).then((date) => {
                  this.getView()
                  .getModel("date")
                  .setSizeLimit(date.getData().length);
                this.getView().getModel("date").refresh();
                this.byId("idScrollContainer").scrollTo(0, 1500);
                })
              } else {
                let month = new Date(date.getData()[date.getData().length - 1]);
                month = new Date(month.getFullYear(), month.getMonth() + 1);
                this.loadMonth(date, month, true).then((date)=> {
                  this.getView()
                  .getModel("date")
                  .setSizeLimit(date.getData().length);
                this.getView().getModel("date").refresh();
                })
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
      onCreateDialog: function () {
        if (!this.pDialog) {
          this.pDialog = this.loadFragment({
            name: "sap.ui.agi.timeRecording.view.CreateDialog",
          });
        }
        this.pDialog
          .then(function (oDialog) {
            oDialog.open();
          })
          .then(() => {
            let calendar = this.getView().byId("createDialogCalendar");
            calendar.removeAllSelectedDates();
            calendar.addSelectedDate(
              new sap.ui.unified.DateRange({ startDate: new Date() })
            );
            calendar.focusDate(new Date());
            this.getView().byId("createDialogTimeSlider").setValue("00:00");
            this.getView().setModel(new JSONModel({
              description: "",
              date: "",
              duration: "",
              tag: ""
            }),"createDialogModel")
          });
      },
      onCreateDialogSaveButton: function() {
        const view = this.getView()
        let model = view.getModel("createDialogModel")
        if (model.getData().description === "" || view.byId("createDialogTimeSlider").getValue() === "00:00") {
          MessageToast.show("Pleas write a description and select a time.")
          return
        }
        model.getData().date = view.byId("createDialogCalendar").getSelectedDates()[0].getStartDate()
        model.getData().duration = view.byId("createDialogTimeSlider").getValue()

        console.log(model.getData())
        this.byId("createDialog").close();

      },
      onCreateDialogCancleButton: function () {
        this.byId("createDialog").close();
      },
    });
  }
);
