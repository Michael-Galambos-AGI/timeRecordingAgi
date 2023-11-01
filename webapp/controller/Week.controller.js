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
        let curdate = new Date();
        curdate.setHours(0, 0, 0, 0);
        let dates = [
          {
            date: curdate.getTime(),
            entries: this.checkdate(curdate.getTime()),
          },
        ];
        dates = this.onDateCreate(dates, true, 30);
        dates = this.onDateCreate(dates, false, 30);
        this.getView().setModel(new JSONModel(dates), "dates");
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
            .some((timer) => timer.times.startDate)
        ) {
          this.currTimer = setInterval(() => {
            let timer = this.getView()
              .getModel("timers")
              .getData()
              .find((timer) => timer.times.startDate);
            if (!timer) return;
            timer.displayDuration = Math.round(
              Date.now() - timer.times.startDate + timer.times.duration
            );

            this.getView().getModel("timers").refresh();
          }, 1000);
        }
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
      async refreshEntrie(refreshDates, res = undefined) {
        await this.refresh(res);
        const dates = this.getModelData("dates");
        refreshDates.forEach((date) => {
          let index = dates.map((d) => d.date).indexOf(date);
          dates[index].entries = this.checkdate(date);
        });
        this.getView().getModel("dates").refresh();
      },

      //letiables
      Formatter: Formatter,
      focusedEntryId: [],
      //Dates
      onDateCreate(dates, type, count) {
        if (type) {
          const date = new Date(dates[0].date);
          for (let i = 1; i <= count; i++) {
            let ndate = new Date(
              date.getFullYear(),
              date.getMonth(),
              date.getDate() - i
            );
            ndate.setHours(0, 0, 0, 0);
            ndate = ndate.getTime();
            dates.unshift({
              date: ndate,
              entries: this.checkdate(ndate),
            });
            if (dates.length > 61) dates.pop();
          }
        } else {
          const date = new Date(dates[dates.length - 1].date);
          for (let i = 1; i <= count; i++) {
            let ndate = new Date(
              date.getFullYear(),
              date.getMonth(),
              date.getDate() + i
            );
            ndate.setHours(0, 0, 0, 0);
            ndate = ndate.getTime();
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
            .filter((time) => time.date === date)
            .forEach((time) => {
              arrayEntries.push({
                date: time.date,
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
      async onDateDelete(model, date) {
        if (model.entryId === undefined || model.timeId === undefined) {
          MessageToast.show("either entryId or timeId is undefined");
          return;
        }
        const res = await fetch("http://localhost:3000/delete", {
          method: "DELETE",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(model),
        });
        this.refreshEntrie([date], res);
      },

      //Press
      onPressDateDelete(oEvent) {
        this.onDateDelete(
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

      //Dialog
      onCreateDialog(oEvent, model) {
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
                startDate: new Date(model?.times.startDate || date),
                endDate: new Date(model?.times.endDate || date),
              })
            );
            if (!model) {
              model = {
                description: "",
                tag: "",
                defaultDuration: 0,
                favorite: false,
                times: {
                  startDate: date,
                  endDate: date,
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
              model.defaultDuration ??= 0;
              this.getView()
                .byId("createDialog")
                .setInitialFocus(this.getView().byId("createDialogSaveButon"));
            }
            console.log(model);
            this.getView().setModel(new JSONModel(model), "createDialogModel");
          });
      },
      async onCreateDialogSaveButton() {
        const view = this.getView();
        const calendar = view
          .byId("createDialogCalendar")
          .getSelectedDates()[0];
        let model = view.getModel("createDialogModel").getData();
        if (model.description === "" || model.duration === "00:00") {
          MessageToast.show(
            "Pleas write a description and select a time and tag."
          );
          return;
        }
        const [hours, mins] = this.getView()
          .byId("createDialogTimePicker")
          .getValue()
          .split(":");
        model.duration = hours * 60 + mins * 1;
        model = {
          entryId: model.entryId,
          description: model.description,
          tag: model.tag,
          favorite: false,
          times: {
            startDate: calendar.getStartDate().getTime(),
            endDate: calendar.getEndDate().getTime(),
            duration: model.duration,
            status: "in-progress",
          },
        };
        const res = await fetch("http://localhost:3000/post", {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(model),
        });
        this.byId("createDialog").close();
        let dates = [];
        const length =
          ((model.times.endDate || model.times.startDate) -
            model.times.startDate) /
          1000 /
          60 /
          60 /
          24;
        for (let i = 0; i <= length; i++) {
          const date = new Date(
            model.times.startDate + i * 1000 * 60 * 60 * 24
          );
          dates.push(date.getTime());
        }
        this.refreshEntrie(dates, res);
      },
      onCreateDialogCancleButton() {
        this.byId("createDialog").close();
      },
      onDeleteAllDialog(oEvent) {
        MessageToast.show("some bug with fragments, so function dissabeled");
        return;
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
                  .getBindingContext("user")
                  .getProperty("id"),
                times: this.getModelData("user")[0].times,
              }),
              "deleteAllModel"
            );
          });
      },
      async deleteAllDelete() {
        return;
        const model = this.getModel("deleteAllModel");
        if (model.getData().text !== "DELETE") {
          MessageToast.show("Please Write: 'DELETE'");
          return;
        }
        const id = model.getData().id;
        const res = await fetch("http://localhost:3000/delete", {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: id }),
        });
        let dates = [];
        this.getModelData("dates").forEach((date) => {
          dates.push(date.date);
        });
        this.refreshEntrie(dates, res);
        this.deleteAllCancle();
      },
      deleteAllCancle() {
        this.byId("DeleteAllDialog").close();
      },

      //Table
      onAddTimer() {
        /*
          template
          {
            description: string
            tag: int
            ?defaultDuration: int
            favorite: bool
            times:{
              startDate: int
              endDate: int
              duration: int
              status: string
            }
          }
          */
        let timers = this.getView().getModel("timers").getData();
        timers.push({
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
          .find((rTimer) => rTimer.times.startDate);
        if (runningTimer) {
          runningTimer.duration += Date.now() - runningTimer.times.startDate;
          runningTimer.date = undefined;
        }
        timer.getObject().times.startDate = Date.now();

        this.getView().getModel("timers").refresh();
        localStorage.setItem(
          "timers",
          JSON.stringify(this.getModelData("timers"))
        );
        this.currTimer = setInterval(() => {
          let timer = this.getView()
            .getModel("timers")
            .getData()
            .find((timer) => timer.times.startDate);
          if (!timer) return;
          timer.displayDuration = Math.round(
            Date.now() - timer.times.startDate + timer.times.duration
          );

          this.getView().getModel("timers").refresh();
        }, 1000);
      },
      onPauseTimer(oEvent) {
        let timer = oEvent.getSource().getBindingContext("timers").getObject();
        if (!timer.times.startDate) return;
        timer.times.duration += Date.now() - timer.times.startDate;
        timer.times.startDate = undefined;
        this.getModel("timers").refresh();
        localStorage.setItem(
          "timers",
          JSON.stringify(this.getModelData("timers"))
        );
        clearInterval(this.currTimer);
      },
      async onSaveTimer(oEvent) {
        let date = new Date();
        date.setHours(0, 0, 0, 0);
        const timer = oEvent
          .getSource()
          .getBindingContext("timers")
          .getObject();
        if (timer.times.startDate) {
          timer.times.duration += Date.now() - timer.times.startDate;
          timer.times.startDate = undefined;
        }
        const model = {
          entryId: timer.entryId,
          description: timer.description,
          tag: timer.tag,
          favorite: timer.entryId || false,
          times: {
            startDate: date.getTime(),
            endDate: date.getTime(),
            duration: Math.round(timer.times.duration / 60 / 1000),
            status: "in-progress",
          },
        };
        const res = await fetch("http://localhost:3000/post", {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(model),
        });
        await this.refreshEntrie([date.getTime()], res);
        this.onDeleteTimer(oEvent, timer);
      },
      onDeleteTimer(oEvent, runningTimer) {
        const timers = this.getView().getModel("timers").getData();
        runningTimer ??=
          oEvent.getSource().getBindingContext("timers").getObject() ||
          timers.find((timer) => timer.times.startDate);
        let index = timers.indexOf(runningTimer);
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
          JSON.stringify(this.getModelData("timers"))
        );
      },

      //Side

      onPressSort(oEvent) {
        const id = oEvent
          .getSource()
          .getBindingContext("user")
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
        this.refreshEntrie(dates, undefined);
      },
      async onSideChange(oEvent) {
        const split = oEvent.getSource().getProperty("value").split(":");
        this.getModel("user")
          .getData()
          .find(
            (timer) =>
              timer.id ===
              oEvent.getSource().getBindingContext("user").getProperty("id")
          ).defaultDuration = split[0] * 60 + split[1] * 1;
        let model = oEvent.getSource().getBindingContext("user").getObject();
        model.entryId = model.id;
        model.id = undefined;
        model.durationAll = undefined;
        model.times = undefined;

        const res = await fetch("http://localhost:3000/patch", {
          method: "PATCH",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(model),
        });
        let dates = [];
        this.getModelData("dates").forEach((date) => {
          dates.push(date.date);
        });
        this.refreshEntrie(dates, res);
      },
      async onPressRemoveFav(oEvent) {
        const model = {
          entryId: oEvent.getSource().getBindingContext("user").getObject().id,
          favorite: false,
        };

        const res = await fetch("http://localhost:3000/patch", {
          method: "PATCH",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(model),
        });
        this.refreshEntrie([], res);
      },
      async onPressAddFav(oEvent) {
        const model = {
          entryId: oEvent.getSource().getBindingContext("user").getObject().id,
          favorite: true,
        };

        const res = await fetch("http://localhost:3000/patch", {
          method: "PATCH",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(model),
        });
        this.refreshEntrie([], res);
      },
      onChangeSideFilter() {
        this.favSort = !this.favSort;
      },

      //Drag
      async onDropTableToWeek(oEvent) {
        const date = oEvent
          .getSource()
          .getBindingContext("dates")
          .getProperty("date");
        const timer = oEvent
          .getParameter("draggedControl")
          .getBindingContext("timers")
          .getObject();
        if (timer.times.startDate) {
          timer.times.duration += Date.now() - timer.times.startDate;
          timer.times.startDate = undefined;
        }

        const model = {
          entryId: timer.entryId,
          description: timer.description,
          tag: timer.tag,
          favorite: timer.favorite || false,
          times: {
            startDate: date,
            endDate: date,
            duration: Math.round(timer.times.duration / 60 / 1000),
            status: "in-progress",
          },
        };
        const res = await fetch("http://localhost:3000/post", {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(model),
        });
        await this.refreshEntrie([date], res);
        this.onDeleteTimer(oEvent, timer);
      },
      async onDropWeekToTable(oEvent) {
        const date = oEvent
          .getParameter("draggedControl")
          .getBindingContext("dates")
          .getObject();
        this.getView()
          .getModel("timers")
          .getData()
          .push({
            id: Date.now(),
            entryId: date.entryId,
            description: date.description,
            tag: date.tag,
            favorite: date.favorite,
            times: {
              startDate: undefined,
              endDate: undefined,
              duration: date.duration * 60 * 1000,
              status: "in-progress",
            },
            displayDuration: date.duration * 60 * 1000,
          });

        const model = {
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
          body: JSON.stringify(model),
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
          JSON.stringify(this.getModelData("timers"))
        );
      },
      async onDropWeekToWeek(oEvent) {
        const date = oEvent
          .getSource()
          .getBindingContext("dates")
          .getProperty("date");
        const entry = oEvent
          .getParameter("draggedControl")
          .getBindingContext("dates")
          .getObject();
        const model = {
          entryId: entry.entryId,
          times: {
            startDate: date,
            endDate: date,
            duration: entry.duration,
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
        const res = await fetch("http://localhost:3000/delete", {
          method: "DELETE",
          mode: "cors",
          cache: "no-cache",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          redirect: "follow",
          body: JSON.stringify(dmodel),
        });

        await this.refreshEntrie(
          [
            date,
            oEvent
              .getParameter("draggedControl")
              .getBindingContext("dates")
              .getProperty("date"),
          ],
          res
        );
      },
      async onDropSideToWeek(oEvent) {
        const date = oEvent
          .getSource()
          .getBindingContext("dates")
          .getProperty("date");
        const entry = oEvent
          .getParameter("draggedControl")
          .getBindingContext("user")
          .getObject();
        const model = {
          entryId: entry.id,
          description: entry.description,
          tag: entry.tag,
          defaultDuration: entry.defaultDuration,
          favorite: entry.favorite,
          times: {
            startDate: date,
            endDate: date,
            duration: 0,
            status: "in-progress",
          },
        };
        this.onCreateDialog(oEvent, model);
      },
      async onDropSideToTable(oEvent) {
        const entry = oEvent
          .getParameter("draggedControl")
          .getBindingContext("user")
          .getObject();
        const id = Date.now();
        this.getView()
          .getModel("timers")
          .getData()
          .push({
            id: Date.now(),
            entryId: entry.id,
            description: entry.description,
            tag: entry.tag,
            favorite: entry.favorite,
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
          JSON.stringify(this.getModelData("timers"))
        );
      },

      //Routing
      async onRouteStatistics() {
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
