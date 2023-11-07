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
      onInit() {
        //Week
        let dCurrentDate = new Date();
        dCurrentDate.setHours(0, 0, 0, 0);
        let oDates = [
          {
            date: dCurrentDate.getTime(),
            entries: this.getTimes(dCurrentDate.getTime()),
          },
        ];
        oDates = this.createDates(oDates, true, 30);
        oDates = this.createDates(oDates, false, 30);
        this.getView().setModel(new JSONModel(oDates), "dates");
        this.observer();
        //scrolles near middle
        this.byId("idScrollContainer").scrollTo(0, 1400);
        //Table
        this.getView().setModel(
          new JSONModel(JSON.parse(localStorage?.getItem("timers")) || []),
          "timers"
        );
        if (
          this.getView()
            .getModel("timers")
            .getData()
            .some((oTimer) => oTimer.times.startDate)
        ) {
          this.currTimer = setInterval(() => {
            let oTimer = this.getView()
              .getModel("timers")
              .getData()
              .find((timer) => timer.times.startDate);
            if (!oTimer) return;
            oTimer.displayDuration = Math.round(
              Date.now() - oTimer.times.startDate + oTimer.times.duration
            );

            this.getView().getModel("timers").refresh();
          }, 1000);
        }
      },
      onAfterRendering() {
        const aItems = this.getView().byId("scrollGrid").getItems();
        this.allObserver.observe(aItems[0].getDomRef());
        this.allObserver.observe(aItems[aItems.length - 1].getDomRef());
      },
      observer() {
        this.allObserver = new IntersectionObserver(
          async (aEntries) => {
            if (aEntries[0].isIntersecting) {
              let aItems = this.getView().byId("scrollGrid").getItems();
              let aDates = this.getView().getModel("dates").getData();
              let bLoadtype;
              if (aEntries[0].target === aItems[0].getDomRef()) {
                bLoadtype = true;
              } else {
                bLoadtype = false;
              }
              aDates = this.createDates(aDates, bLoadtype, 30);
              this.getView().getModel("dates").refresh();
              // pixel amount (idk why +50 and -520.5 but it works)
              if (bLoadtype)
                this.byId("idScrollContainer").scrollTo(0, 30 * 50 + 50);
              if (!bLoadtype)
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
      async refreshEntrie(aRefreshDates, oRes = undefined) {
        await this.refresh(oRes);
        const dates = this.getView().getModel("dates").getData();
        aRefreshDates.forEach((iDate) => {
          let mIndex = dates.map((d) => d.date).indexOf(iDate);
          dates[mIndex].entries = this.getTimes(iDate);
        });
        this.getView().getModel("dates").refresh();
      },

      //variables
      Formatter: Formatter,
      focusedEntryId: [],

      //Dates
      createDates(aDates, bType, iCount) {
        if (bType) {
          const date = new Date(aDates[0].date);
          for (let i = 1; i <= iCount; i++) {
            let dNewDate = new Date(
              date.getFullYear(),
              date.getMonth(),
              date.getDate() - i
            );
            dNewDate.setHours(0, 0, 0, 0);
            const iNewDate = dNewDate.getTime();
            aDates.unshift({
              date: iNewDate,
              entries: this.getTimes(iNewDate),
            });
            if (aDates.length > 61) aDates.pop();
          }
        } else {
          const date = new Date(aDates[aDates.length - 1].date);
          for (let i = 1; i <= iCount; i++) {
            let dNewDate = new Date(
              date.getFullYear(),
              date.getMonth(),
              date.getDate() + i
            );
            dNewDate.setHours(0, 0, 0, 0);
            const iNewDate = dNewDate.getTime();
            aDates.push({
              date: iNewDate,
              entries: this.getTimes(iNewDate),
            });
            if (aDates.length > 61) aDates.shift();
          }
        }
        return aDates;
      },
      getTimes(iDate) {
        const model = this.getOwnerComponent().getModel("user").getData();
        let aEntries = [];
        let oEntries;
        if (this.focusedEntryId.length === 0) {
          oEntries = model?.entries;
        } else {
          oEntries = model?.entries?.filter((entry) =>
            this.focusedEntryId.includes(entry.id)
          );
        }
        oEntries?.forEach((oEntry) => {
          oEntry.times
            .filter((oTime) => oTime.date === iDate)
            .forEach((time) => {
              aEntries.push({
                date: time.date,
                duration: time.duration,
                tag: oEntry.tag,
                description: oEntry.description,
                entryId: oEntry.id,
                timeId: time.id,
                status: time.status,
                changed: time.changed,
              });
            });
        });
        if (aEntries.length === 0) {
          return null;
        }
        aEntries.sort((a, b) => a.changed - b.changed);
        return aEntries;
      },

      //Entry
      async deleteTime(oModel, iDate) {
        if (oModel.entryId === undefined || oModel.timeId === undefined) {
          MessageToast.show("either entryId or timeId is undefined");
          return;
        }
        const res = await fetch("http://localhost:3000/delete", {
          method: "DELETE",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(oModel),
        });
        this.refreshEntrie([iDate], res);
      },

      //Press
      onPressDateDelete(oEvent) {
        //rename
        this.deleteTime(
          {
            entryId: oEvent
              .getSource()
              .getBindingContext("dates")
              .getProperty("entryId"),
            timeId: oEvent
              .getSource()
              .getBindingContext("dates")
              .getProperty("timeId"),
          },
          oEvent.getSource().getBindingContext("dates").getProperty("date")
        );
      },
      openEditDialog(oEvent) {
        const oEntry = oEvent
          .getSource()
          .getBindingContext("dates")
          .getObject();
        const oModel = {
          entryId: oEntry.entryId,
          timeId: oEntry.timeId,
          description: oEntry.description,
          tag: oEntry.tag,
          favorite: oEntry.favorite,
          times: {
            startDate: oEntry.date,
            endDate: oEntry.date,
            duration: oEntry.duration,
            status: "in-progress",
          },
        };
        this.openCreateEditDialog(oEvent, oModel);
      },

      //Dialog
      openCreateEditDialog(oEvent, oModel) {
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
            let dDate = new Date();
            dDate.setHours(0, 0, 0, 0);
            let oCalendar = this.getView().byId("createDialogCalendar");
            oCalendar.removeAllSelectedDates();
            oCalendar.addSelectedDate(
              new sap.ui.unified.DateRange({
                startDate: new Date(oModel?.times.startDate || dDate),
                endDate: new Date(oModel?.times.endDate || dDate),
              })
            );
            if (!oModel) {
              oModel = {
                description: "",
                tag: "",
                favorite: false,
                times: {
                  startDate: dDate,
                  endDate: dDate,
                  duration: 0,
                  status: "in-progress",
                },
              };
              this.getView()
                .byId("createDialog")
                .setInitialFocus(
                  this.getView().byId("createDialogTagsComboBox")
                );
            } else {
              this.getView()
                .byId("createDialog")
                .setInitialFocus(this.getView().byId("createDialogSaveButon"));
            }
            this.getView().setModel(new JSONModel(oModel), "createDialogModel");
          });
      },
      async saveCreateEditDialog() {
        const oView = this.getView();
        const oCalendar = oView
          .byId("createDialogCalendar")
          .getSelectedDates()[0];
        let oModel = oView.getModel("createDialogModel").getData();
        if (oModel.description === "" || oModel.duration === "00:00") {
          MessageToast.show(
            "Pleas write a description and select a time and tag."
          );
          return;
        }
        const [sHours, sMins] = this.getView()
          .byId("createDialogTimePicker")
          .getValue()
          .split(":");
        oModel.duration = sHours * 60 + sMins * 1;
        oModel = {
          entryId: oModel.entryId,
          timeId: oModel.timeId,
          description: oModel.description,
          tag: oModel.tag,
          favorite: false,
          times: {
            startDate: oCalendar.getStartDate().getTime(),
            endDate: oCalendar.getEndDate().getTime(),
            duration: oModel.duration,
            status: "in-progress",
          },
        };
        let oRes;
        if (oModel.timeId) {
          oRes = await fetch("http://localhost:3000/post", {
            method: "POST",
            mode: "cors",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(oModel),
          });
        } else {
          oRes = await fetch("http://localhost:3000/post", {
            method: "POST",
            mode: "cors",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(oModel),
          });
        }

        this.byId("createDialog").close();
        let aDates = [];
        const length =
          ((oModel.times.endDate || oModel.times.startDate) -
            oModel.times.startDate) /
          1000 /
          60 /
          60 /
          24;
        for (let i = 0; i <= length; i++) {
          const date = new Date(
            oModel.times.startDate + i * 1000 * 60 * 60 * 24
          );
          aDates.push(date.getTime());
        }
        this.refreshEntrie(aDates, oRes);
      },
      closeCreateEditDialog() {
        this.byId("createDialog").close();
      },
       openDeleteEntryDialog(oEvent) {
        if (!this.pDeleteDialog) {
          this.pDeleteDialog = this.loadFragment({
            name: "sap.ui.agi.timeRecording.view.DeleteAll",
          });
        }
        this.pDeleteDialog
          .then(function (oDialog) {
            oDialog.open();
          })
          .then(() => {
            this.getView().setModel(
              new JSONModel({
                text: "",
                entryId: oEvent
                  .getSource()
                  .getBindingContext("user")
                  .getProperty("id"),
              }),
              "deleteEntryModel"
            );
          });
      },
      async deleteEntry() {
        const model = this.getView().getModel("deleteEntryModel").getData();
        if (model.text !== "DELETE") {
          MessageToast.show("Please Write: 'DELETE'");
          return;
        }
        const entryId = model.entryId;
        const res = await fetch("http://localhost:3000/delete", {
          method: "DELETE",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ entryId: entryId }),
        });
        let dates = [];
        this.getView()
          .getModel("dates")
          .getData()
          .forEach((date) => {
            dates.push(date.date);
          });
        this.refreshEntrie(dates, res);
        this.closeDeleteEntryDialog();
      },
      closeDeleteEntryDialog() {
        this.byId("DeleteAllDialog").close();
      },

      //Table
      addTimer() {
        let aTimers = this.getView().getModel("timers").getData();
        aTimers.push({
          id: Date.now(),
          description: null,
          tag: null,
          favorite: false,
          times: {
            startDate: undefined,
            endDate: undefined,
            duration: 0,
            status: "in-progress",
          },
          displayDuration: 0,
        });
        this.getView().getModel("timers").refresh();
        localStorage.setItem(
          "timers",
          JSON.stringify(this.getView().getModel("timers").getData())
        );
      },
      continueTimer(oEvent) {
        let oTimer = oEvent.getSource().getBindingContext("timers");
        if (
          oTimer.getProperty("tag") === null ||
          oTimer.getProperty("description") === null
        ) {
          return;
        }
        let oRunningTimer = this.getView()
          .getModel("timers")
          .getData()
          .find((oTimer) => oTimer.times.startDate);
        if (oRunningTimer) {
          oRunningTimer.duration += Date.now() - oRunningTimer.times.startDate;
          oRunningTimer.date = undefined;
        }
        oTimer.getObject().times.startDate = Date.now();

        this.getView().getModel("timers").refresh();
        localStorage.setItem(
          "timers",
          JSON.stringify(this.getView().getModel("timers").getData())
        );
        this.currTimer = setInterval(() => {
          let oTimer = this.getView()
            .getModel("timers")
            .getData()
            .find((oTimer) => oTimer.times.startDate);
          if (!oTimer) return;
          oTimer.displayDuration = Math.round(
            Date.now() - oTimer.times.startDate + oTimer.times.duration
          );

          this.getView().getModel("timers").refresh();
        }, 1000);
      },
      pauseTimer(oEvent) {
        let oTimer = oEvent.getSource().getBindingContext("timers").getObject();
        if (!oTimer.times.startDate) return;
        oTimer.times.duration += Date.now() - oTimer.times.startDate;
        oTimer.times.startDate = undefined;
        this.getView().getModel("timers").refresh();
        localStorage.setItem(
          "timers",
          JSON.stringify(this.getView().getModel("timers").getData())
        );
        clearInterval(this.currTimer);
      },
      async saveTimer(oEvent) {
        let dDate = new Date();
        dDate.setHours(0, 0, 0, 0);
        const oTimer = oEvent
          .getSource()
          .getBindingContext("timers")
          .getObject();
        if (oTimer.times.startDate) {
          oTimer.times.duration += Date.now() - oTimer.times.startDate;
          oTimer.times.startDate = undefined;
        }
        const oModel = {
          entryId: oTimer.entryId,
          description: oTimer.description,
          tag: oTimer.tag,
          favorite: oTimer.entryId || false,
          times: {
            startDate: dDate.getTime(),
            endDate: dDate.getTime(),
            duration: Math.round(oTimer.times.duration / 60 / 1000),
            status: "in-progress",
          },
        };
        const oRes = await fetch("http://localhost:3000/post", {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(oModel),
        });
        await this.refreshEntrie([dDate.getTime()], oRes);
        this.deleteTimer(oEvent, oTimer);
      },
      deleteTimer(oEvent, oRunningTimer) {
        const aTimers = this.getView().getModel("timers").getData();
        oRunningTimer ??=
          oEvent.getSource().getBindingContext("timers").getObject() ||
          aTimers.find((oTimer) => oTimer.times.startDate);
        let iIndex = aTimers.indexOf(oRunningTimer);
        if (iIndex !== -1) {
          aTimers.splice(iIndex, 1);
        }
        this.getView().getModel("timers").refresh();
        localStorage.setItem(
          "timers",
          JSON.stringify(this.getView().getModel("timers").getData())
        );
      },
      changeTimerTime(oEvent) {
        const split = oEvent.getSource().getProperty("value").split(":");
        const time =
          (split[0] * 60 * 60 + split[1] * 60 + parseInt(split[2])) * 1000;
        oEvent
          .getSource()
          .getBindingContext("timers")
          .getObject().times.duration = time;
        oEvent
          .getSource()
          .getBindingContext("timers")
          .getObject().displayDuration = time;
        this.getView().getModel("timers").refresh();
        localStorage.setItem(
          "timers",
          JSON.stringify(this.getView().getModel("timers").getData())
        );
      },

      //Side

      sortEntrie(oEvent) {
        const iId = oEvent
          .getSource()
          .getBindingContext("user")
          .getProperty("id");
        const iIndex = this.focusedEntryId.indexOf(iId);
        if (iIndex === -1) {
          this.focusedEntryId.push(iId);
          oEvent.getSource().setSrc(`sap-icon://hide`);
        } else {
          this.focusedEntryId.splice(iIndex, 1);
          oEvent.getSource().setSrc(`sap-icon://show`);
        }
        let aDates = [];
        this.getView()
          .getModel("dates")
          .getData()
          .forEach((oDate) => {
            aDates.push(oDate.date);
          });
        this.refreshEntrie(aDates, undefined);
      },
      async editEntry(oEvent) {
        const [iHours, iMins] = oEvent
          .getSource()
          .getProperty("value")
          .split(":");
        oEvent
          .getSource()
          .getBindingContext("user")
          .getObject().defaultDuration = iHours * 60 + iMins * 1;
        let oModel = oEvent.getSource().getBindingContext("user").getObject();
        oModel.entryId = oModel.id;
        oModel.id = undefined;
        oModel.durationAll = undefined;
        oModel.times = undefined;

        const oRes = await fetch("http://localhost:3000/patch", {
          method: "PATCH",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(oModel),
        });
        let aDates = [];
        this.getView()
          .getModel("dates")
          .getData()
          .forEach((oDate) => {
            aDates.push(oDate.date);
          });
        this.refreshEntrie(aDates, oRes);
      },
      async removeFavorite(oEvent) {
        const oModel = {
          entryId: oEvent.getSource().getBindingContext("user").getObject().id,
          favorite: false,
        };

        const oRes = await fetch("http://localhost:3000/patch", {
          method: "PATCH",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(oModel),
        });
        this.refreshEntrie([], oRes);
      },
      async addFavorite(oEvent) {
        const oModel = {
          entryId: oEvent.getSource().getBindingContext("user").getObject().id,
          favorite: true,
        };

        const oRes = await fetch("http://localhost:3000/patch", {
          method: "PATCH",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(oModel),
        });
        this.refreshEntrie([], oRes);
      },
      filterEntries() {
        this.favSort = !this.favSort;
      },

      //Drag
      async onDropTableToWeek(oEvent) {
        const iDate = oEvent
          .getSource()
          .getBindingContext("dates")
          .getProperty("date");
        const oTimer = oEvent
          .getParameter("draggedControl")
          .getBindingContext("timers")
          .getObject();
        if (oTimer.times.startDate) {
          oTimer.times.duration += Date.now() - oTimer.times.startDate;
          oTimer.times.startDate = undefined;
        }

        const oModel = {
          entryId: oTimer.entryId,
          description: oTimer.description,
          tag: oTimer.tag,
          favorite: oTimer.favorite || false,
          times: {
            startDate: iDate,
            endDate: iDate,
            duration: Math.round(oTimer.times.duration / 60 / 1000),
            status: "in-progress",
          },
        };
        const oRes = await fetch("http://localhost:3000/post", {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(oModel),
        });
        await this.refreshEntrie([iDate], oRes);
        this.deleteTimer(oEvent, oTimer);
      },
      async onDropWeekToTable(oEvent) {
        const oDate = oEvent
          .getParameter("draggedControl")
          .getBindingContext("dates")
          .getObject();
        this.getView()
          .getModel("timers")
          .getData()
          .push({
            id: Date.now(),
            entryId: oDate.entryId,
            description: oDate.description,
            tag: oDate.tag,
            favorite: oDate.favorite,
            times: {
              startDate: undefined,
              endDate: undefined,
              duration: oDate.duration * 60 * 1000,
              status: "in-progress",
            },
            displayDuration: oDate.duration * 60 * 1000,
          });

        const oModel = {
          entryId: oEvent
            .getParameter("draggedControl")
            .getBindingContext("dates")
            .getProperty("entryId"),
          timeId: oEvent
            .getParameter("draggedControl")
            .getBindingContext("dates")
            .getProperty("timeId"),
        };
        const res = await fetch("http://localhost:3000/delete", {
          method: "DELETE",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(oModel),
        });
        this.refreshEntrie(
          [
            oEvent
              .getParameter("draggedControl")
              .getBindingContext("dates")
              .getProperty("date"),
          ],
          res
        );
        this.getView().getModel("timers").refresh();
        localStorage.setItem(
          "timers",
          JSON.stringify(this.getView().getModel("timers").getData())
        );
      },
      async onDropWeekToWeek(oEvent) {
        const iDate = oEvent
          .getSource()
          .getBindingContext("dates")
          .getProperty("date");
        const oEntry = oEvent
          .getParameter("draggedControl")
          .getBindingContext("dates")
          .getObject();
        const oModel = {
          entryId: oEntry.entryId,
          times: {
            startDate: iDate,
            endDate: iDate,
            duration: oEntry.duration,
            status: "in-progress",
          },
        };
        await fetch("http://localhost:3000/post", {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          redirect: "follow",
          body: JSON.stringify(oModel),
        });

        const oDeleteModel = {
          entryId: oEvent
            .getParameter("draggedControl")
            .getBindingContext("dates")
            .getProperty("entryId"),
          timeId: oEvent
            .getParameter("draggedControl")
            .getBindingContext("dates")
            .getProperty("timeId"),
        };
        const oRes = await fetch("http://localhost:3000/delete", {
          method: "DELETE",
          mode: "cors",
          cache: "no-cache",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          redirect: "follow",
          body: JSON.stringify(oDeleteModel),
        });

        await this.refreshEntrie(
          [
            iDate,
            oEvent
              .getParameter("draggedControl")
              .getBindingContext("dates")
              .getProperty("date"),
          ],
          oRes
        );
      },
      async onDropSideToWeek(oEvent) {
        const iDate = oEvent
          .getSource()
          .getBindingContext("dates")
          .getProperty("date");
        const oEntry = oEvent
          .getParameter("draggedControl")
          .getBindingContext("user")
          .getObject();
        console.log(oEntry);
        const oModel = {
          entryId: oEntry.id,
          description: oEntry.description,
          tag: oEntry.tag,
          favorite: oEntry.favorite,
          times: {
            startDate: iDate,
            endDate: iDate,
            duration: oEntry.defaultDuration || 0,
            status: "in-progress",
          },
        };
        this.openCreateEditDialog(oEvent, oModel);
      },
      async onDropSideToTable(oEvent) {
        const oEntry = oEvent
          .getParameter("draggedControl")
          .getBindingContext("user")
          .getObject();
        const iId = Date.now();
        this.getView()
          .getModel("timers")
          .getData()
          .push({
            id: Date.now(),
            entryId: oEntry.id,
            description: oEntry.description,
            tag: oEntry.tag,
            favorite: oEntry.favorite,
            times: {
              startDate: undefined,
              endDate: undefined,
              duration: 0,
              status: "in-progress",
            },
            displayDuration: 0,
          });
        this.getView().getModel("timers").refresh();
        localStorage.setItem(
          "timers",
          JSON.stringify(this.getView().getModel("timers").getData())
        );
      },

      //Routing
      async onRouteStatistics() {
        return;
        const oRouter = this.getOwnerComponent().getRouter();
        oRouter.navTo("statistics");
        //let arr = [];
        //for (let i = 0; i < 10000; i++) {
        //  const date = new Date();
        //  await fetch("http://localhost:3000/getUser", {
        //    method: "GET",
        //  });
        //  arr.push(new Date() - date);
        //}
        //let sum = 0;
        //for (var number of arr) {
        //  sum += number;
        //}
        //const average = sum / arr.length;
        //console.log(average);
      },

      //Test
      testWeek() {
        console.log(this.getView().getModel("dates").getData());
        return;
      },
      testTable() {
        console.log(this.getView().getModel("timers").getData());
        return;
      },
      testSide() {
        console.log(this.getView().getModel("user").getData());
        return;
      },
    });
  }
);
