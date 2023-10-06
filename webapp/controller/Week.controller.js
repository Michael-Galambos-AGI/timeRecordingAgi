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
        let dates = new JSONModel([]);
        dates = await this.loadMonth(
          dates,
          new Date(curdate.getFullYear(), curdate.getMonth()),
          true
        );
        this.getView().setModel(dates, "dates");
        this.getView().getModel("dates").setSizeLimit(dates.getData().length);
        this.observer();
        this.byId("idScrollContainer").scrollTo(0, 200);
      },
      loadMonth: async function (dates, month, type) {
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
            dates
              .getData()
              .push({ date: ndate, entries: await this.checkdates(ndate) });
          }
        } else {
          for (let i = lastday; i > 0; i--) {
            const ndate = new Date(
              month.getFullYear(),
              month.getMonth(),
              i
            ).toLocaleDateString();
            dates.getData().unshift({
              date: ndate,
              entries: await this.checkdates(ndate),
            });
          }
        }
        return dates;
      },
      checkdates: async function (dates) {
        const model = await this.getOwnerComponent().getModel("user").getData();
        let arrayEntries = [];
        model.entries.forEach((entry) => {
          let i = 0;
          entry.times.forEach((time) => {
            const ndate = new Date(time.date).toLocaleDateString();
            if (ndate === dates) {
              arrayEntries.push({
                date: ndate,
                duration: time.duration,
                tag: entry.tag,
                discription: entry.discription,
                entryId: entry.id,
                timeId: time.id,
              });
            }
            i++;
          });
        });
        if (arrayEntries.length === 0) {
          return null;
        }
        return arrayEntries;
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
              let dates = this.getView().getModel("dates");
              let monthnumerator = -1;
              let loadtype = false;
              let month = new Date(dates.getData()[0].date);

              if (!(entries[0].target === items[0].getDomRef())) {
                monthnumerator = 1;
                loadtype = true;
                month = new Date(
                  dates.getData()[dates.getData().length - 1].date
                );
              }
              month = new Date(
                month.getFullYear(),
                month.getMonth() + monthnumerator
              );
              this.loadMonth(dates, month, loadtype).then((dates) => {
                this.getView()
                  .getModel("dates")
                  .setSizeLimit(dates.getData().length);
                this.getView().getModel("dates").refresh();
                if (!loadtype) this.byId("idScrollContainer").scrollTo(0, 1500);
              });
              this.delay(1).then(() => {
                this.allObserver.unobserve(items[0].getDomRef());
                this.allObserver.unobserve(items[items.length - 1].getDomRef());
                items = this.getView().byId("scrollGrid").getItems();
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
            this.getView().setModel(
              new JSONModel({
                discription: "",
                date: "",
                duration: "",
                tag: "",
              }),
              "createDialogModel"
            );
          });
      },
      onCreateDialogSaveButton: function () {
        const view = this.getView();
        let model = view.getModel("createDialogModel");
        if (
          model.getData().discription === "" ||
          view.byId("createDialogTimeSlider").getValue() === "00:00"
        ) {
          MessageToast.show("Pleas write a discription and select a time.");
          return;
        }
        model.getData().date = view
          .byId("createDialogCalendar")
          .getSelectedDates()[0]
          .getStartDate();
        model.getData().duration = view
          .byId("createDialogTimeSlider")
          .getValue();
        this.byId("createDialog").close();
      },
      onCreateDialogCancleButton: function () {
        this.byId("createDialog").close();
      },
      onDeleteEntry: async function (oEvent) {
        const model = new JSONModel({
          entryId: oEvent
            .getSource()
            .getBindingContext("dates")
            .getProperty("entryId"),
          timeId: oEvent
            .getSource()
            .getBindingContext("dates")
            .getProperty("timeId"),
        });
        console.log(model.getData());
        await fetch("http://localhost:3000/delete", {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        redirect: "follow",
        body: JSON.stringify(model.getData())
      })
      },
      onDropTableToWeek: async function (oEvent) {
        const date = oEvent
          .getSource()
          .getBindingContext("dates")
          .getProperty("date");
        const timer = oEvent
          .getParameter("draggedControl")
          .getBindingContext("timers");

        const model = new JSONModel({
          date: date,
          discription: timer.getProperty("discription"),
          duration: Math.round(timer.getProperty("duration") / 60),
          tag: timer.getProperty("tag"),
        });
        await fetch("http://localhost:3000/entry", {
          method: "POST",
          mode: "cors",
          cache: "no-cache",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          redirect: "follow",
          body: JSON.stringify(model.getData()),
        }).then((resp) =>{
          this.getOwnerComponent().getModel("user").setData(resp);
          console.log(this.getOwnerComponent().getModel("user"))
          this.getOwnerComponent().getModel("user").refresh();
          console.log("sus");

        })
      },
    });
  }
);
