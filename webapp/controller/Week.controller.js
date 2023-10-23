sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "../model/weekdayFormatter",
  ],
  function (BaseController, JSONModel, MessageToast, Fragment, dayFormatter) {
    "use strict";
    return BaseController.extend("sap.ui.agi.timeRecording.controller.Week", {
      //Dates
      //CRUD
      onDateCreate: function (dates, type, count) {
        if (type) {
          const date = dates[0].date;
          for (let i = 1; i <= count; i++) {
            const ndate = new Date(
              date.getFullYear(),
              date.getMonth(),
              date.getDate() - i
            );
            ndate.setHours(0, 0, 0, 0);
            dates.unshift({
              date: ndate,
              entries: this.checkdate(ndate),
            });
            if (dates.length > 61) dates.pop()
            
          }
        } else {
          const date = dates[dates.length - 1].date;
          for (let i = 1; i <= count; i++) {
            const ndate = new Date(
              date.getFullYear(),
              date.getMonth(),
              date.getDate() + i
            );
            ndate.setHours(0, 0, 0, 0);
            dates.push({
              date: ndate,
              entries: this.checkdate(ndate),
            });
            if (dates.length > 61) dates.shift()
          }
        }
        return dates;
      },
      onDateRead: function () {},
      onDateUpdate: function () {},
      onDateDelete: async function (model) {
        if (model.entryId === undefined || model.timeId === undefined) {
          MessageToast.show("either entryId or timeId is undefined");
          return;
        }
        await fetch("http://localhost:3000/delete", {
          method: "POST",
          mode: "cors",
          cache: "no-cache",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          redirect: "follow",
          body: JSON.stringify(model),
        });
      },
      //Press
      onPressDateDelete: async function (oEvent) {
        await this.onDateDelete({
          entryId: oEvent
            .getSource()
            .getBindingContext("dates")
            .getProperty("entryId"),
          timeId: oEvent
            .getSource()
            .getBindingContext("dates")
            .getProperty("timeId"),
        });
        await this.refresh();
        await this.refreshEntrie(
          oEvent.getSource().getBindingContext("dates").getProperty("date")
        );
      },
      weekdayFormatter: dayFormatter,
      onInit: async function () {
        const curdate = new Date();
        let dates = [
          {
            date: curdate,
            entries: this.checkdate(curdate),
          },
        ];
        dates = await this.onDateCreate(dates, true, 30);
        dates = await this.onDateCreate(dates, false, 30);
        this.getView().setModel(new JSONModel(dates), "dates");
        this.observer();
        this.byId("idScrollContainer").scrollTo(0, 1250);

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

        //side
        const entries = this.getOwnerComponent().getModel("user").getData()
          .entries;
        entries.forEach((entry) => {
          entry.duration = 0;
          entry.times.forEach((time) => {
            entry.duration += time.duration;
          });
        });
        this.getView().setModel(new JSONModel(entries), "sideEntries");
      },
      focusedEntryId: undefined,
      checkdate: function (date) {
        date.setHours(0, 0, 0, 0);
        const model = this.getOwnerComponent().getModel("user").getData();
        let arrayEntries = [];
        if (!this.focusedEntryId) {
          model.entries.forEach((entry) => {
            entry.times
              .filter((time) => time.date.toString() == date.toString())
              .forEach((time) => {
                arrayEntries.push({
                  date: new Date(time.date),
                  duration: time.duration,
                  tag: entry.tag,
                  discription: entry.discription,
                  entryId: entry.id,
                  timeId: time.id,
                  status: time.status,
                  changed: time.changed,
                });
              });
          });
        } else {
          const entry = model.entries.find(
            (entry) => entry.id === this.focusedEntryId
          );
          entry.times
            .filter((time) => time.date.toString() == date.toString())
            .forEach((time) => {
              arrayEntries.push({
                date: new Date(time.date),
                duration: time.duration,
                tag: entry.tag,
                discription: entry.discription,
                entryId: entry.id,
                timeId: time.id,
                status: time.status,
                changed: time.changed,
              });
            });
        }
        if (arrayEntries.length === 0) {
          return null;
        }
        arrayEntries.sort((a, b) => a.changed - b.changed);
        return arrayEntries;
      },
      onAfterRendering: async function () {
        const items = this.getView().byId("scrollGrid").getItems();
        this.allObserver.observe(items[0].getDomRef());
        this.allObserver.observe(items[items.length - 1].getDomRef());
        console.log(items[0].getDomRef())
        console.log(items[items.length - 1].getDomRef())
      },
      observer: async function () {
        this.allObserver = new IntersectionObserver(
          async (entries) => {
            if (entries[0].isIntersecting) {
              console.log("suzs")
              let items = this.getView().byId("scrollGrid").getItems();
              let dates = this.getModelData("dates");
              let loadtype;
              if (entries[0].target === items[0].getDomRef()) {
                loadtype = true;
              } else {
                loadtype = false;
              }
              dates = this.onDateCreate(dates, loadtype, 30);
              this.getModel("dates").refresh()
              // pixel amount + 100 because of rootMargin
              if (loadtype) this.byId("idScrollContainer").scrollTo(0, (30*50)+50);
              if (!loadtype) this.byId("idScrollContainer").scrollTo(0, (61*50)-(30*50)-520.5);
            }
          },
          {
            root: this.getView().byId("idScrollContainer").getDomRef(),
            threshold: 0,
            rootMargin: "200px",
          }
        );
      },
      refreshEntrie: async function (date) {
        const dates = this.getModelData("dates");
        let index = dates
          .map((d) => d.date.toString())
          .indexOf(date.toString());
        dates[index].entries = await this.checkdate(date);
        this.getView().getModel("dates").refresh();
        this.refreshSide();
      },
      //Dialog
      onCreateDialog: function (oEvent, model) {
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
            let date = new Date();
            date.setHours(0, 0, 0, 0);
            let calendar = this.getView().byId("createDialogCalendar");
            calendar.removeAllSelectedDates();

            calendar.addSelectedDate(
              new sap.ui.unified.DateRange({
                startDate: model?.date || date,
                endDate: model?.date || date,
              })
            );
            if (!model) {
              model = {
                discription: "",
                date: "",
                duration: "00:00",
                tag: "",
                status: "in-progress",
              };
              this.getView()
                .byId("createDialog")
                .setInitialFocus(
                  this.getView().byId("createDialogEligibleTagsComboBox")
                );
            } else {
              this.getView()
                .byId("createDialog")
                .setInitialFocus(this.getView().byId("createDialogTimePicker"));
            }
            this.getView().setModel(new JSONModel(model), "createDialogModel");
          });
      },
      onCreateDialogSaveButton: async function () {
        const view = this.getView();
        const calendar = view
          .byId("createDialogCalendar")
          .getSelectedDates()[0];
        let model = view.getModel("createDialogModel");
        if (
          model.getData().discription === "" ||
          model.getData().duration === "00:00"
        ) {
          MessageToast.show(
            "Pleas write a discription and select a time and tag."
          );
          return;
        }
        model.getData().date = {
          startDate: calendar.getStartDate(),
          endDate: calendar.getEndDate() || undefined,
        };
        const arr = model.getData().duration.split(":");
        model.getData().duration = parseInt(arr[0]) * 60 + parseInt(arr[1]);
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
        this.byId("createDialog").close();
        await this.refresh();
        if (model.getData().date.startDate) {
          const startDate = new Date(model.getData().date.startDate);
          //from milisecountds to days also i duno why i need the +1 but it works
          const duration =
            (new Date(model.getData().date.endDate) - startDate) / 86400000 + 1;
          for (let i = 0; i < duration; i++) {
            const date = new Date(
              startDate.getFullYear(),
              startDate.getMonth(),
              startDate.getDate() + i
            );
            await this.refreshEntrie(date);
          }
          return;
        }
        await this.refreshEntrie(model.getData().date);
      },
      onCreateDialogCancleButton: function () {
        this.byId("createDialog").close();
      },

      //Table

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
          status: "in-progress",
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

      //Side

      refreshSide: async function () {
        const entries = this.getOwnerComponent().getModel("user").getData()
          .entries;
        entries.forEach((entry) => {
          entry.duration = 0;
          entry.times.forEach((time) => {
            entry.duration += time.duration;
          });
        });
        this.getModel("sideEntries").setData(entries);
      },
      onPressSort: function (oEvent) {
        const id = oEvent
          .getSource()
          .getBindingContext("sideEntries")
          .getProperty("id");
        if (id === this.focusedEntryId) {
          this.focusedEntryId = undefined;
        } else {
          this.focusedEntryId = id;
        }
        this.getModelData("dates").forEach((date) => {
          this.refreshEntrie(date.date);
        });
      },

      onPressEdit: function (oEvent) {

      },
      //Drag
      onDropTableToWeek: async function (oEvent) {
        const date = oEvent
          .getSource()
          .getBindingContext("dates")
          .getProperty("date");
        const timer = oEvent
          .getParameter("draggedControl")
          .getBindingContext("timers");
        const model = {
          date: date,
          discription: timer.getProperty("discription"),
          duration: Math.round(timer.getProperty("duration") / 60),
          tag: timer.getProperty("tag"),
          status: "in-progress",
        };
        await fetch("http://localhost:3000/entry", {
          method: "POST",
          mode: "cors",
          cache: "no-cache",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          redirect: "follow",
          body: JSON.stringify(model),
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

      onDropWeekToWeek: async function (oEvent) {
        const date = oEvent
          .getSource()
          .getBindingContext("dates")
          .getProperty("date");
        const entry = oEvent
          .getParameter("draggedControl")
          .getBindingContext("dates");
        const model = {
          date: date,
          discription: entry.getProperty("discription"),
          duration: Math.round(entry.getProperty("duration")),
          tag: entry.getProperty("tag"),
          status: "in-progress",
          entryId: entry.getProperty("entryId"),
          timeId: entry.getProperty("timeId"),
        };
        await fetch("http://localhost:3000/entry", {
          method: "POST",
          mode: "cors",
          cache: "no-cache",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          redirect: "follow",
          body: JSON.stringify(model),
        });

        const dmodel = {
          entryId: oEvent
            .getParameter("draggedControl")
            .getBindingContext("dates")
            .getProperty("entryId"),
          timeId: oEvent
            .getParameter("draggedControl")
            .getBindingContext("dates")
            .getProperty("timeId"),
        };
        await fetch("http://localhost:3000/delete", {
          method: "POST",
          mode: "cors",
          cache: "no-cache",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          redirect: "follow",
          body: JSON.stringify(dmodel),
        });

        await this.refresh();
        await this.refreshEntrie(date);
        await this.refreshEntrie(
          oEvent
            .getParameter("draggedControl")
            .getBindingContext("dates")
            .getProperty("date")
        );
      },

      onDropSideToWeek: async function (oEvent) {
        const date = oEvent
          .getSource()
          .getBindingContext("dates")
          .getProperty("date");
        const entry = oEvent
          .getParameter("draggedControl")
          .getBindingContext("sideEntries");
        const model = {
          entryId: entry.getProperty("id"),
          discription: entry.getProperty("discription"),
          date: date,
          duration: "00:00",
          tag: entry.getProperty("tag"),
          status: "in-progress",
        };
        this.onCreateDialog(oEvent, model);
      },

      onDropSideToTable: async function (oEvent) {
        const entry = oEvent
          .getParameter("draggedControl")
          .getBindingContext("sideEntries");
        const id = Date.now();
        this.getView()
          .getModel("timers")
          .getData()
          .push({
            id: id,
            startDate: undefined,
            lastDate: undefined,
            duration: 0,
            pastDuration: 0,
            running: false,
            discription: entry.getProperty("discription"),
            tag: entry.getProperty("tag"),
          });
        this.getView().getModel("timers").refresh();
      },
      testWeek: async function () {
        return;
        const model = {
          discription: "male",
          date: {
            startDate: "2023-10-22T22:00:00.000Z",
            endDate: "2023-10-26T22:00:00.000Z",
          },
          duration: 504,
          tag: "Ferien",
          status: "in-progress",
        };
        await fetch("http://localhost:3000/entry", {
          method: "POST",
          mode: "cors",
          cache: "no-cache",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          redirect: "follow",
          body: JSON.stringify(model),
        });
      },
    });
  }
);
