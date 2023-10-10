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

        //table
        this.getView().setModel(new JSONModel([]), "timers");
        setInterval(() => {
          let timers = this.getView().getModel("timers").getData();
          timers.forEach((timer) => {
            if (timer.running) {
              timer.duration = +Math.round(
                timer.pastDuration + (new Date() - timer.lastDate) / 1000
              );
              this.getView().getModel("timers").refresh();
              return;
            }
          });
        }, 500);
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
      checkdates: async function (date) {
        const model = await this.getOwnerComponent().getModel("user").getData();
        let arrayEntries = [];
        model.entries.forEach((entry) => {
          let i = 0;
          entry.times.forEach((time) => {
            const ndate = new Date(time.date).toLocaleDateString();
            if (ndate === date) {
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
        await fetch("http://localhost:3000/delete", {
          method: "POST",
          mode: "cors",
          cache: "no-cache",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          redirect: "follow",
          body: JSON.stringify(model.getData()),
        });
        await this.refresh();
        await this.refreshEntrie(
          oEvent.getSource().getBindingContext("dates").getProperty("date")
        );
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
        });
        await this.refresh();
        await this.refreshEntrie(date);

        const timers = this.getView().getModel("timers").getData();
        timers.forEach((timer) => {
          if (
            timer ===
            oEvent
              .getParameter("draggedControl")
              .getBindingContext("timers")
              .getObject()
          ) {
            timers.splice(timers.indexOf(timer), 1);
          }
        });
        this.getView().getModel("timers").refresh();
      },
      refreshEntrie: async function (date) {
        const dates = this.getView().getModel("dates").getData();
        let index = dates.map((date) => date.date).indexOf(date);
        dates[index].entries = await this.checkdates(date);
        this.getView().getModel("dates").refresh();
      },
      onDropWeekToWeek: async function (oEvent) {
        const date = oEvent
          .getSource()
          .getBindingContext("dates")
          .getProperty("date");
        const entry = oEvent
          .getParameter("draggedControl")
          .getBindingContext("dates");
        const model = new JSONModel({
          date: date,
          discription: entry.getProperty("discription"),
          duration: Math.round(entry.getProperty("duration")),
          tag: entry.getProperty("tag"),
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
        });

        await this.refresh();
        await this.refreshEntrie(date);

        const dmodel = new JSONModel({
          entryId: oEvent
            .getParameter("draggedControl")
            .getBindingContext("dates")
            .getProperty("entryId"),
          timeId: oEvent
            .getParameter("draggedControl")
            .getBindingContext("dates")
            .getProperty("timeId"),
        });
        console.log(dmodel.getData());
        await fetch("http://localhost:3000/delete", {
          method: "POST",
          mode: "cors",
          cache: "no-cache",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          redirect: "follow",
          body: JSON.stringify(dmodel.getData()),
        });
        await this.refresh();
        await this.refreshEntrie(
          oEvent
            .getParameter("draggedControl")
            .getBindingContext("dates")
            .getProperty("date")
        );
      },

      //table
      onAddTimer: function () {
        let timers = this.getView().getModel("timers").getData();
        const startDate = new Date();
        const id = Date.now();
        timers.push({
          id: id,
          startDate: startDate,
          lastDate: startDate,
          duration: 0,
          pastDuration: 0,
          running: false,
          discription: null,
          tag: null,
        });
        this.getView().getModel("timers").refresh();
      },
      onContinueTimer: function (oEvent) {
        const row = oEvent.getSource().getBindingContext("timers");
        if (
          row.getProperty("tag") === null ||
          row.getProperty("discription") === null
        ) {
          return;
        }
        this.getView()
          .getModel("timers")
          .getData()
          .forEach((timer) => {
            if (timer.id === row.getProperty("id")) {
              timer.running = true;
              timer.lastDate = new Date();
            } else if (timer.running) {
              timer.running = false;
              timer.pastDuration += (new Date() - timer.lastDate) / 1000;
            } else {
              timer.running = false;
            }
          });
        this.getView().getModel("timers").refresh();
      },
      onPauseTimer: function (oEvent) {
        this.getView()
          .getModel("timers")
          .getData()
          .forEach((timer) => {
            if (
              timer.id ===
              oEvent.getSource().getBindingContext("timers").getProperty("id")
            ) {
              timer.pastDuration += (new Date() - timer.lastDate) / 1000;
              timer.lastDate = null;
              timer.running = false;
            }
          });
        this.getView().getModel("timers").refresh();
      },
      onSaveTimer: async function (oEvent) {
        const row = oEvent.getSource().getBindingContext("timers");
        if (row.getProperty("duration") === 0) return;
        const model = new JSONModel({
          date: row.getProperty("startDate"),
          discription: row.getProperty("discription"),
          duration: Math.round(row.getProperty("duration") / 60),
          tag: row.getProperty("tag"),
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
        });
        await this.refresh();
        await this.refreshEntrie(row.getProperty("startDate"));
        this.onDeleteTimer(oEvent);
      },
      onDeleteTimer: function (oEvent) {
        const timers = this.getView().getModel("timers").getData();
        timers.forEach((timer) => {
          if (
            timer === oEvent.getSource().getBindingContext("timers").getObject()
          ) {
            timers.splice(timers.indexOf(timer), 1);
          }
        });
        this.getView().getModel("timers").refresh();
      },
      onDropWeekToTable: async function (oEvent) {
        const date = oEvent
          .getParameter("draggedControl")
          .getBindingContext("dates");
        const id = Date.now();
        this.getView()
          .getModel("timers")
          .getData()
          .push({
            id: id,
            startDate: date.getProperty("date"),
            lastDate: date.getProperty("date"),
            duration: date.getProperty("duration") * 60,
            pastDuration: date.getProperty("duration") * 60,
            running: false,
            discription: date.getProperty("discription"),
            tag: date.getProperty("tag"),
          });

        const model = new JSONModel({
          entryId: oEvent
            .getParameter("draggedControl")
            .getBindingContext("dates")
            .getProperty("entryId"),
          timeId: oEvent
            .getParameter("draggedControl")
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
          body: JSON.stringify(model.getData()),
        });
        await this.refresh();
        await this.refreshEntrie(
          oEvent
            .getParameter("draggedControl")
            .getBindingContext("dates")
            .getProperty("date")
        );
        this.getView().getModel("timers").refresh();
      },
    });
  }
);
