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
      //variables
      Formatter: Formatter,
      focusedEntryId: [],

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
          this.getModelData("timers").some((oTimer) => oTimer.times.startDate)
        ) {
          this.currTimer = setInterval(() => {
            let oTimer = this.getModelData("timers").find(
              (timer) => timer.times.startDate
            );
            if (!oTimer) return;
            oTimer.displayDuration = Math.round(
              Date.now() - oTimer.times.startDate + oTimer.times.duration
            );

            this.getModel("timers").refresh();
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
            if (!aEntries[0].isIntersecting) return;

            const aItems = this.getView().byId("scrollGrid").getItems();
            const aDates = this.getModelData("dates");
            const bLoadtype = aEntries[0].target === aItems[0].getDomRef();

            this.createDates(aDates, bLoadtype, 30);
            this.getModel("dates").refresh();

            if (bLoadtype) {
              // 30 * 50px is the height of the newly created elements
              // i dont know why +49
              this.byId("idScrollContainer").scrollTo(0, 30 * 50 + 49);
            } else {
              const iHeight = $(
                this.byId("idScrollContainer2").getDomRef()
              ).height();
              // 61 * 50px is the height of all elements in the scrollcontainer
              // 30 * 50px is the height of the newly created elements
              // i dont know why +20
              this.byId("idScrollContainer").scrollTo(
                0,
                61 * 50 - 30 * 50 - iHeight + 20
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
      async refreshEntrie(aRefreshDates, sRes = undefined) {
        await this.refresh(sRes);
        const dates = this.getModelData("dates");
        aRefreshDates.forEach((iDate) => {
          let mIndex = dates.map((d) => d.date).indexOf(iDate);
          dates[mIndex].entries = this.getTimes(iDate);
        });
        this.getModel("dates").refresh();
      },

      saveLocalStorage() {
        localStorage.setItem(
          "timers",
          JSON.stringify(this.getModelData("timers"))
        );
      },

      //Dates
      //redo
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
        const oUserObject = this.getOwnerComponent().getModel("user").getData();
        let aTimes = [];
        let aEntries;

        if (this.focusedEntryId.length === 0) {
          aEntries = oUserObject?.entries;
        } else {
          aEntries = oUserObject?.entries?.filter((entry) =>
            this.focusedEntryId.includes(entry.id)
          );
        }

        aEntries?.forEach((oEntry) => {
          oEntry.times
            .filter((oTime) => oTime.date === iDate)
            .forEach((time) => {
              aTimes.push({
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

        if (aTimes.length === 0) {
          return null;
        }

        aTimes.sort((a, b) => a.changed - b.changed);
        return aTimes;
      },

      //Entry
      async deleteTime(oModel, iDate) {
        const sRes = await this.deleteFetch(oModel);
        this.refreshEntrie([iDate], sRes);
      },

      //Press
      onPressDateDelete(oEvent) {
        const oModel = oEvent.getSource().getBindingContext("dates");
        //rename
        this.deleteTime(
          {
            entryId: oModel.getProperty("entryId"),
            timeId: oModel.getProperty("timeId"),
          },
          oModel.getProperty("date")
        );
      },

      //createUpdateEntryDialog
      openCreateUpdateEntryDialog(oEvent) {
        if (!this.pCreateUpdateEntryDialog) {
          this.pCreateUpdateEntryDialog = this.loadFragment({
            name: "sap.ui.agi.timeRecording.view.CreateUpdateEntryDialog",
          });
        }
        this.pCreateUpdateEntryDialog
          .then(function (oDialog) {
            oDialog.open();
          })
          .then(() => {
            let dDate = new Date();
            dDate.setHours(0, 0, 0, 0);

            let oCalendar = this.getView().byId(
              "createUpdateEntryDialogCalendar"
            );
            oCalendar.removeAllSelectedDates();
            oCalendar.addSelectedDate(
              new sap.ui.unified.DateRange({
                startDate: new Date(dDate),
                endDate: new Date(dDate),
              })
            );
            this.getView().setModel(
              new JSONModel({
                description: "",
                tag: "",
                favorite: false,
                times: {
                  startDate: dDate,
                  endDate: dDate,
                  duration: 0,
                  status: "in-progress",
                },
              }),
              "createUpdateEntryDialogModel"
            );
          });
      },
      async saveCreateUpdateEntryDialog() {
        if (oObject.description === "" || oObject.duration === "00:00") {
          MessageToast.show(
            "Pleas write a description and select a time and tag."
          );
          return;
        }

        const oCalendar = this.getView()
          .byId("createUpdateEntryDialogCalendar")
          .getSelectedDates()[0];
        let oObject = this.getModelData("createUpdateEntryDialogModel");

        const [sHours, sMins] = this.getView()
          .byId("createUpdateEntryDialogTimePicker")
          .getValue()
          .split(":");

        oObject.times.startDate = oCalendar.getStartDate().getTime();
        oObject.times.endDate = oCalendar.getEndDate().getTime();
        oObject.times.duration = sHours * 60 + sMins * 1;
        oObject.times.status = "in-progress";

        const sRes = await this.postFetch(oObject);
        let aRefreshDates = [];
        const iChangedDatesCount =
          ((oObject.times.endDate || oObject.times.startDate) -
            oObject.times.startDate) /
          1000 /
          60 /
          60 /
          24;
        for (let i = 0; i <= iChangedDatesCount; i++) {
          const dRefreshDate = new Date(
            oObject.times.startDate + i * 1000 * 60 * 60 * 24
          );
          aRefreshDates.push(dRefreshDate.getTime());
        }
        this.refreshEntrie(aRefreshDates, sRes);
        this.closeCreateUpdateEntryDialog();
      },
      closeCreateUpdateEntryDialog() {
        this.byId("createUpdateEntryDialog").close();
      },

      //createUpdateTimeDialog
      openCreateUpdateTimeDialog(oEvent, oObject) {
        if (!this.pCreateUpdateTimeDialog) {
          this.pCreateUpdateTimeDialog = this.loadFragment({
            name: "sap.ui.agi.timeRecording.view.CreateUpdateTimeDialog",
          });
        }
        this.pCreateUpdateTimeDialog
          .then(function (oDialog) {
            oDialog.open();
          })
          .then(() => {
            const oDate = oEvent
              .getSource()
              .getBindingContext("dates")
              .getObject();
            let dDate = new Date();
            dDate.setHours(0, 0, 0, 0);
            let oCalendar = this.getView().byId(
              "createUpdateTimeDialogCalendar"
            );
            oCalendar.removeAllSelectedDates();
            oCalendar.addSelectedDate(
              new sap.ui.unified.DateRange({
                startDate: new Date(
                  oObject?.times.startDate || oDate.date || dDate
                ),
                endDate: new Date(
                  oObject?.times.endDate || oDate.date || dDate
                ),
              })
            );
            this.getView()
              .byId("createUpdateTimeDialog")
              .setInitialFocus(
                this.getView().byId("createUpdateTimeDialogSaveButton")
              );
            this.getView().setModel(
              new JSONModel(
                (oObject ??= {
                  timeId: oDate.timeId,
                  entryId: oDate.entryId,
                  description: oDate.description,
                  tag: oDate.tag,
                  times: {
                    startDate: oDate.date,
                    endDate: oDate.date,
                    duration: oDate.duration,
                    status: "in-progress",
                  },
                })
              ),
              "createUpdateTimeDialogModel"
            );
          });
      },
      async saveCreateUpdateTimeDialog() {
        const oCalendar = this.getView()
          .byId("createUpdateTimeDialogCalendar")
          .getSelectedDates()[0];
        let oObject = this.getModelData("createUpdateTimeDialogModel");
        if (oObject.description === "" || oObject.duration === "00:00") {
          MessageToast.show(
            "Pleas write a description and select a time and tag."
          );
          return;
        }
        const [sHours, sMins] = this.getView()
          .byId("createUpdateTimeDialogTimePicker")
          .getValue()
          .split(":");
        oObject.description = undefined;
        oObject.tag = undefined;
        oObject.favorite = undefined;
        oObject.times.startDate = oCalendar.getStartDate().getTime();
        oObject.times.endDate = oCalendar.getEndDate().getTime();
        oObject.times.duration = sHours * 60 + sMins * 1;
        oObject.times.status = "in-progress";
        let sRes;
        if (oObject.timeId) {
          sRes = await this.patchFetch(oObject);
        } else {
          sRes = await this.postFetch(oObject);
        }
        // change that it only refreshes effected dates
        let aDates = [];
        this.getModelData("dates").forEach((oDate) => {
          aDates.push(oDate.date);
        });
        this.refreshEntrie(aDates, sRes);
        this.closeCreateUpdateTimeDialog();
      },
      closeCreateUpdateTimeDialog() {
        this.byId("createUpdateTimeDialog").close();
      },

      //deleteEntry
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
        const model = this.getModelData("deleteEntryModel");
        if (model.text !== "DELETE") {
          MessageToast.show("Please Write: 'DELETE'");
          return;
        }
        const entryId = model.entryId;
        const res = await this.deleteFetch({ entryId: entryId });
        let dates = [];
        this.getModelData("dates").forEach((date) => {
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
        let aTimers = this.getModelData("timers");
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
        this.getModel("timers").refresh();
        this.saveLocalStorage();
      },
      continueTimer(oEvent) {
        let oTimer = oEvent.getSource().getBindingContext("timers");
        if (
          oTimer.getProperty("tag") === null ||
          oTimer.getProperty("description") === null
        ) {
          return;
        }
        let oRunningTimer = this.getModelData("timers").find(
          (oTimer) => oTimer.times.startDate
        );
        if (oRunningTimer) {
          oRunningTimer.duration += Date.now() - oRunningTimer.times.startDate;
          oRunningTimer.date = undefined;
        }
        oTimer.getObject().times.startDate = Date.now();

        this.getModel("timers").refresh();
        this.saveLocalStorage();
        this.currTimer = setInterval(() => {
          let oTimer = this.getModelData("timers").find(
            (oTimer) => oTimer.times.startDate
          );
          if (!oTimer) return;
          oTimer.displayDuration = Math.round(
            Date.now() - oTimer.times.startDate + oTimer.times.duration
          );

          this.getModel("timers").refresh();
        }, 1000);
      },
      pauseTimer(oEvent) {
        let oTimer = oEvent.getSource().getBindingContext("timers").getObject();
        if (!oTimer.times.startDate) return;
        oTimer.times.duration += Date.now() - oTimer.times.startDate;
        oTimer.times.startDate = undefined;
        this.getModel("timers").refresh();
        this.saveLocalStorage();
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
        const oObject = {
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
        const sRes = await this.postFetch(oObject);
        await this.refreshEntrie([dDate.getTime()], sRes);
        this.deleteTimer(oEvent, oTimer);
      },
      deleteTimer(oEvent, oRunningTimer) {
        const aTimers = this.getModelData("timers");
        oRunningTimer ??=
          oEvent.getSource().getBindingContext("timers").getObject() ||
          aTimers.find((oTimer) => oTimer.times.startDate);
        let iIndex = aTimers.indexOf(oRunningTimer);
        if (iIndex !== -1) {
          aTimers.splice(iIndex, 1);
        }
        this.getModel("timers").refresh();
        this.saveLocalStorage();
      },
      changeTimerTime(oEvent) {
        const [sHours, sMins, sSecs] = oEvent
          .getSource()
          .getProperty("value")
          .split(":");
        const time = (sHours * 60 * 60 + sMins * 60 + parseInt(sSecs)) * 1000;
        const oObject = oEvent
          .getSource()
          .getBindingContext("timers")
          .getObject();
        oObject.times.duration = time;
        oObject.displayDuration = time;
        this.getModel("timers").refresh();
        this.saveLocalStorage();
      },

      //Side
      sortEntrie(oEvent) {
        const oSource = oEvent.getSource();
        const iId = oSource.getBindingContext("user").getProperty("id");
        const iIndex = this.focusedEntryId.indexOf(iId);
        if (iIndex === -1) {
          this.focusedEntryId.push(iId);
          oSource.setSrc(`sap-icon://hide`);
        } else {
          this.focusedEntryId.splice(iIndex, 1);
          oSource.setSrc(`sap-icon://show`);
        }
        let aDates = [];
        this.getModelData("dates").forEach((oDate) => {
          aDates.push(oDate.date);
        });
        this.refreshEntrie(aDates, undefined);
      },
      async editEntry(oEvent) {
        const [sHours, sMins] = oEvent
          .getSource()
          .getProperty("value")
          .split(":");
        let oObject = oEvent.getSource().getBindingContext("user").getObject();
        oObject.defaultDuration = sHours * 60 + sMins * 1;
        oObject.entryId = oObject.id;
        oObject.id = undefined;
        oObject.durationAll = undefined;
        oObject.times = undefined;

        const sRes = await this.patchFetch(oObject);
        let aDates = [];
        this.getModelData("dates").forEach((oDate) => {
          aDates.push(oDate.date);
        });
        this.refreshEntrie(aDates, sRes);
      },
      async changeFavorite(oEvent) {
        const oObject = oEvent
          .getSource()
          .getBindingContext("user")
          .getObject();
        const oModel = {
          entryId: oObject.id,
          favorite: !oObject.favorite,
        };

        const sRes = await this.patchFetch(oModel);
        this.refreshEntrie([], sRes);
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

        const oObject = {
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

        const sRes = await this.postFetch(oObject);
        await this.refreshEntrie([iDate], sRes);
        this.deleteTimer(oEvent, oTimer);
      },
      async onDropWeekToTable(oEvent) {
        const oDate = oEvent
          .getParameter("draggedControl")
          .getBindingContext("dates")
          .getObject();
        this.getModelData("timers").push({
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

        const oObject = {
          entryId: oDate.entryId,
          timeId: oDate.timeId,
        };
        const sRes = await this.deleteFetch(oObject);
        this.refreshEntrie(
          [
            oEvent
              .getParameter("draggedControl")
              .getBindingContext("dates")
              .getProperty("date"),
          ],
          sRes
        );
        this.getModel("timers").refresh();
        this.saveLocalStorage();
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
        const oObject = {
          entryId: oEntry.entryId,
          timeId: oEntry.timeId,
          times: {
            startDate: iDate,
            endDate: iDate,
          },
        };

        const sRes = await this.patchFetch(oObject);

        await this.refreshEntrie(
          [
            iDate,
            oEvent
              .getParameter("draggedControl")
              .getBindingContext("dates")
              .getProperty("date"),
          ],
          sRes
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
        this.openCreateUpdateTimeDialog(oEvent, oModel);
      },
      async onDropSideToTable(oEvent) {
        const oEntry = oEvent
          .getParameter("draggedControl")
          .getBindingContext("user")
          .getObject();
        const iId = Date.now();
        this.getModelData("timers").push({
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
        this.getModel("timers").refresh();
        this.saveLocalStorage();
      },

      //Routing
      async onRouteStatistics() {
        return;
        const oRouter = this.getOwnerComponent().getRouter();
        oRouter.navTo("statistics");
        //let arr = [];
        //for (let i = 0; i < 10000; i++) {
        //  const date = new Date();
        //  await this.getFetch()
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
        console.log(this.getModelData("dates"));
        return;
      },
      testTable() {
        console.log(this.getModelData("timers"));
        return;
      },
      testSide() {
        console.log(this.getModelData("user"));
        return;
      },
    });
  }
);
