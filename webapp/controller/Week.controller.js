sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "../model/Formatter",
  ],
  function (BaseController, JSONModel, MessageToast, Fragment, Formatter) {
    "use strict";
    return BaseController.extend("sap.ui.agi.timeRecording.controller.Week", {
      //Lifecycle
      onInit() {
        //Week
        const curdate = new Date();
        let dates = [
          {
            date: curdate,
            entries: this.checkdate(curdate),
          },
        ];
        dates = this.onDateCreate(dates, true, 30);
        dates = this.onDateCreate(dates, false, 30);
        this.getView().setModel(new JSONModel(dates), "dates");
        this.observer();
        //scrolles near middle
        this.byId("idScrollContainer").scrollTo(0, 1400);
        //Table

        window.onbeforeunload = function () {
          localStorage.setItem(
            "timers",
            JSON.stringify(this.getModelData("timers"))
          );
        };
        this.getView().setModel(
          new JSONModel(JSON.parse(localStorage?.getItem("timers")) || []),
          "timers"
        );

        setInterval(() => {
          let timer = this.getView()
            .getModel("timers")
            .getData()
            .find((timer) => timer.date);
          if (!timer) return;
          timer.duration = Math.round((new Date() - timer.date + timer.pastDuration))

          this.getView().getModel("timers").refresh();
        }, 1000);

        //Side
        this.getView().setModel(new JSONModel(), "sideEntries");
        this.refreshSide();
      },

      onAfterRendering() {
        const items = this.getView().byId("scrollGrid").getItems();
        this.allObserver.observe(items[0].getDomRef());
        this.allObserver.observe(items[items.length - 1].getDomRef());
      },
      observer() {
        this.allObserver = new IntersectionObserver(
          async (entries) => {
            if (entries[0].isIntersecting) {
              let items = this.getView().byId("scrollGrid").getItems();
              let dates = this.getModelData("dates");
              let loadtype;
              if (entries[0].target === items[0].getDomRef()) {
                loadtype = true;
              } else {
                loadtype = false;
              }
              dates = this.onDateCreate(dates, loadtype, 30);
              this.getModel("dates").refresh();
              // pixel amount (idk why +50 and -520.5 but it works)
              if (loadtype)
                this.byId("idScrollContainer").scrollTo(0, 30 * 50 + 50);
              if (!loadtype)
                this.byId("idScrollContainer").scrollTo(
                  0,
                  61 * 50 - 30 * 50 - 520.5
                );
            }
          },
          {
            root: this.getView().byId("idScrollContainer").getDomRef(),
            threshold: 0,
            rootMargin: "200px",
          }
        );
      },
      async refreshEntrie(refreshDates) {
        await this.refresh();
        const dates = this.getModelData("dates");
        refreshDates.forEach((date) => {
          let index = dates
            .map((d) => d.date.toString())
            .indexOf(date.toString());
          dates[index].entries = this.checkdate(date);
        });
        this.getView().getModel("dates").refresh();
        this.refreshSide();
      },

      //letiables
      Formatter: Formatter,
      focusedEntryId: [],
      favSort: true,

      //Dates
      onDateCreate(dates, type, count) {
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
            if (dates.length > 61) dates.pop();
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
            if (dates.length > 61) dates.shift();
          }
        }
        return dates;
      },
      checkdate(date) {
        date.setHours(0, 0, 0, 0);
        const model = this.getOwnerComponent().getModel("user").getData();
        let arrayEntries = [];
        let entries;
        if (this.focusedEntryId.length === 0) {
          entries = model?.entries;
        } else {
          entries = model?.entries?.filter((entry) =>
            this.focusedEntryId.includes(entry.id)
          );
        }
        entries?.forEach((entry) => {
          entry.times
            .filter((time) => time.date.toString() == date.toString())
            .forEach((time) => {
              arrayEntries.push({
                date: new Date(time.date),
                duration: time.duration,
                tag: entry.tag,
                description: entry.description,
                entryId: entry.id,
                timeId: time.id,
                status: time.status,
                changed: time.changed,
              });
            });
        });
        if (arrayEntries.length === 0) {
          return null;
        }
        arrayEntries.sort((a, b) => a.changed - b.changed);
        return arrayEntries;
      },

      //Entry
      async onDateDelete(model) {
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
      async onPressDateDelete(oEvent) {
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
        this.refreshEntrie([
          oEvent.getSource().getBindingContext("dates").getProperty("date"),
        ]);
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
                description: "",
                date: "",
                duration: "",
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
                .setInitialFocus(this.getView().byId("createDialogSaveButon"));
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
          model.getData().description === "" ||
          model.getData().duration === "00:00"
        ) {
          MessageToast.show(
            "Pleas write a description and select a time and tag."
          );
          return;
        }
        model.getData().date = {
          startDate: calendar.getStartDate(),
          endDate: calendar.getEndDate() || undefined,
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
          body: JSON.stringify(model.getData()),
        });
        this.byId("createDialog").close();
        let dates = [];
        if (model.getData().date.startDate) {
          const startDate = new Date(model.getData().date.startDate);
          //from milisecountds to days also i duno why i need the +1 but it works
          const duration =
            (new Date(model.getData().date.endDate) - startDate) / 86400000 + 1;
          for (let i = 0; i < duration; i++) {
            dates.push(
              new Date(
                startDate.getFullYear(),
                startDate.getMonth(),
                startDate.getDate() + i
              )
            );
          }
        } else dates = [model.getData().date];
        this.refreshEntrie(dates);
      },
      onCreateDialogCancleButton: function () {
        this.byId("createDialog").close();
      },
      onDeleteAllDialog: function (oEvent) {
        if (!this.pDialog) {
          this.pDialog = this.loadFragment({
            name: "sap.ui.agi.timeRecording.view.DeleteAll",
          });
        }
        this.pDialog
          .then(function (oDialog) {
            oDialog.open();
          })
          .then(() => {
            this.getView().setModel(
              new JSONModel({
                text: "",
                id: oEvent
                  .getSource()
                  .getBindingContext("sideEntries")
                  .getProperty("id"),
                times: this.getModelData("sideEntries")[0].times,
              }),
              "deleteAllModel"
            );
          });
      },
      deleteAllDelete: async function () {
        const model = this.getModel("deleteAllModel");
        if (model.getData().text !== "DELETE") {
          MessageToast.show("Please Write: 'DELETE'");
          return;
        }
        const id = model.getData().id;
        await fetch("http://localhost:3000/deleteEntry", {
          method: "POST",
          mode: "cors",
          cache: "no-cache",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          redirect: "follow",
          body: JSON.stringify({ id: id }),
        });
        let dates = [];
        this.getModelData("dates").forEach((date) => {
          dates.push(date.date);
        });
        this.refreshEntrie(dates);
        this.deleteAllCancle();
      },
      deleteAllCancle: function () {
        this.byId("DeleteAllDialog").close();
      },
      //Table

      onAddTimer() {
        let timers = this.getView().getModel("timers").getData();
        timers.push({
          id: Date.now(),
          date: null,
          pastDuration: 0,
          duration: 0,
          description: null,
          tag: null,
        });
        this.getView().getModel("timers").refresh();
        localStorage.setItem(
          "timers",
          JSON.stringify(this.getModelData("timers"))
        );
      },
      onContinueTimer(oEvent) {
        let timer = oEvent.getSource().getBindingContext("timers");
        if (
          timer.getProperty("tag") === null ||
          timer.getProperty("description") === null
        ) {
          return;
        }
        let runningTimer = this.getView()
          .getModel("timers")
          .getData()
          .find((rTimer) => rTimer.date);
        if (runningTimer) {
          runningTimer.pastDuration += new Date().getTime() - runningTimer.time;
          runningTimer.date = undefined;
        }
        timer.getObject().date = new Date().getTime();

        this.getView().getModel("timers").refresh();
        localStorage.setItem(
          "timers",
          JSON.stringify(this.getModelData("timers"))
        );
      },
      onPauseTimer(oEvent) {
        let timer = oEvent.getSource().getBindingContext("timers").getObject();
        if (!timer.date) return
        timer.pastDuration += new Date().getTime() - timer.date;
        timer.date = null;
        this.getModel("timers").refresh();
        localStorage.setItem(
          "timers",
          JSON.stringify(this.getModelData("timers"))
        );
      },
      async onSaveTimer(oEvent) {
        return
        const row = oEvent.getSource().getBindingContext("timers");
        if (row.getProperty("duration") === 0) return;
        const model = new JSONModel({
          date: row.getProperty("startDate"),
          description: row.getProperty("description"),
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
        await this.refreshEntrie([row.getProperty("startDate")]);
        this.onDeleteTimer(oEvent);
      },
      onDeleteTimer(oEvent) {
        const timers = this.getView().getModel("timers").getData();
        let runningtimer = oEvent
          .getSource()
          .getBindingContext("timers")
          .getObject();

        let index = timers.indexOf(runningtimer);
        if (index !== -1) {
          timers.splice(index, 1);
        }
        this.getView().getModel("timers").refresh();
        localStorage.setItem(
          "timers",
          JSON.stringify(this.getModelData("timers"))
        );
      },
      tableTimePickerChange(oEvent) {
        const split = oEvent.getSource().getProperty("value").split(":");
        oEvent.getSource().getBindingContext("timers").getObject().pastDuration = (split[0] * 60 * 60 + split[1] * 60 + parseInt(split[2]))*1000;
        this.getView().getModel("timers").refresh();
        localStorage.setItem(
          "timers",
          JSON.stringify(this.getModelData("timers"))
        );
      },

      //Side
      refreshSide() {
        const entries = this.getOwnerComponent()
          .getModel("user")
          .getData()
          .entries?.filter((entry) => entry.favorite === this.favSort);
        entries?.forEach((entry) => {
          entry.duration = 0;
          entry.times.forEach((time) => {
            entry.duration += time.duration;
          });
        });
        this.getModel("sideEntries").setData(entries);
      },
      onPressSort(oEvent) {
        const id = oEvent
          .getSource()
          .getBindingContext("sideEntries")
          .getProperty("id");
        const index = this.focusedEntryId.indexOf(id);
        if (index === -1) {
          this.focusedEntryId.push(id);
          oEvent.getSource().setSrc(`sap-icon://hide`);
        } else {
          this.focusedEntryId.splice(index, 1);
          oEvent.getSource().setSrc(`sap-icon://show`);
        }
        let dates = [];
        this.getModelData("dates").forEach((date) => {
          dates.push(date.date);
        });
        this.refreshEntrie(dates);
      },
      async onSideChange(oEvent) {
        const split = oEvent.getSource().getProperty("value").split(":");
        this.getModel("sideEntries")
          .getData()
          .find(
            (timer) =>
              timer.id ===
              oEvent
                .getSource()
                .getBindingContext("sideEntries")
                .getProperty("id")
          ).defaultDuration = split[0] * 60 + split[1] * 1;
        await fetch("http://localhost:3000/updateEntry", {
          method: "POST",
          mode: "cors",
          cache: "no-cache",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          redirect: "follow",
          body: JSON.stringify(
            oEvent.getSource().getBindingContext("sideEntries").getObject()
          ),
        });
        let dates = [];
        this.getModelData("dates").forEach((date) => {
          dates.push(date.date);
        });
        this.refreshEntrie(dates);
      },
      async onPressRemoveFav(oEvent) {
        oEvent
          .getSource()
          .getBindingContext("sideEntries")
          .getObject().favorite = false;
        await fetch("http://localhost:3000/updateEntry", {
          method: "POST",
          mode: "cors",
          cache: "no-cache",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          redirect: "follow",
          body: JSON.stringify(
            oEvent.getSource().getBindingContext("sideEntries").getObject()
          ),
        });
        this.refreshEntrie([]);
      },
      async onPressAddFav(oEvent) {
        oEvent
          .getSource()
          .getBindingContext("sideEntries")
          .getObject().favorite = true;
        await fetch("http://localhost:3000/updateEntry", {
          method: "POST",
          mode: "cors",
          cache: "no-cache",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          redirect: "follow",
          body: JSON.stringify(
            oEvent.getSource().getBindingContext("sideEntries").getObject()
          ),
        });
        this.refreshEntrie([]);
      },
      onChangeSideFilter() {
        this.favSort = !this.favSort;
        this.refreshSide();
      },

      //Drag
      async onDropTableToWeek(oEvent) {
        const date = oEvent
          .getSource()
          .getBindingContext("dates")
          .getProperty("date");
        const timer = oEvent
          .getParameter("draggedControl")
          .getBindingContext("timers");
        const model = {
          date: date,
          description: timer.getProperty("description"),
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
        await this.refreshEntrie([date]);

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

      async onDropWeekToTable(oEvent) {
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
            description: date.getProperty("description"),
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
        this.refreshEntrie([
          oEvent
            .getParameter("draggedControl")
            .getBindingContext("dates")
            .getProperty("date"),
        ]);
        this.getView().getModel("timers").refresh();
      },

      async onDropWeekToWeek(oEvent) {
        const date = oEvent
          .getSource()
          .getBindingContext("dates")
          .getProperty("date");
        const entry = oEvent
          .getParameter("draggedControl")
          .getBindingContext("dates");
        const model = {
          date: date,
          description: entry.getProperty("description"),
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

        await this.refreshEntrie([
          date,
          oEvent
            .getParameter("draggedControl")
            .getBindingContext("dates")
            .getProperty("date"),
        ]);
      },

      async onDropSideToWeek(oEvent) {
        const date = oEvent
          .getSource()
          .getBindingContext("dates")
          .getProperty("date");
        const entry = oEvent
          .getParameter("draggedControl")
          .getBindingContext("sideEntries");
        const model = {
          entryId: entry.getProperty("id"),
          description: entry.getProperty("description"),
          date: date,
          duration: entry.getProperty("defaultDuration") || "",
          tag: entry.getProperty("tag"),
          status: "in-progress",
        };
        this.onCreateDialog(oEvent, model);
      },

      async onDropSideToTable(oEvent) {
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
            description: entry.getProperty("description"),
            tag: entry.getProperty("tag"),
          });
        this.getView().getModel("timers").refresh();
      },

      //Test
      testWeek() {
        return;
      },
      testSide() {
        return;
      },
    });
  }
);
