import FlexibleColumnLayout from 'sap/f/FlexibleColumnLayout';
import BaseController from './Base.controller'
import { LayoutType } from 'sap/f/library';
import Event from 'sap/ui/base/Event';
import ManagedObject from 'sap/ui/base/ManagedObject';
import View from 'sap/ui/core/mvc/View';
import ColumnListItem from 'sap/m/ColumnListItem';
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import Table from 'sap/m/Table';
import ListBinding from 'sap/ui/model/ListBinding';
import JSONModel from 'sap/ui/model/json/JSONModel';
import Dialog from 'sap/m/Dialog';
import Input from 'sap/m/Input';
import TextArea from 'sap/m/TextArea';
import MessageToast from 'sap/m/MessageToast';
import Fragment from 'sap/ui/core/Fragment';
import ResourceModel from "sap/ui/model/resource/ResourceModel";

export default class GoalsListController extends BaseController {
    private _oCreateDialog?: Dialog;

    onInit(): void | undefined {
        console.log("GoalsListController initialized");
        const oController = this;

        // Listen for route match
        const oRouter = oController.getRouter();
        oRouter.getRoute("goals")?.attachPatternMatched(this._onRouteMatched, this);
    }
    async _onRouteMatched(): Promise<void> {
        const oController = this;

        const authenticated = await oController.ensureAuthenticated();
        if (!authenticated) return;

        oController.setHeaderTitle("goalsListTitle"); // Assuming "goalsListTitle" is defined in i18n

        let aGoals = await oController.request("/goals", "GET");
        if (aGoals?.success) {
            let oGoalsOriginalModel = oController.getOwnerComponent()?.getModel("goalsOriginal") as JSONModel | undefined;
            let oGoalsCurrentModel = oController.getOwnerComponent()?.getModel("goalsCurrent") as JSONModel | undefined;

            if (!oGoalsOriginalModel) {
                oGoalsOriginalModel = new JSONModel({});
                oController.getOwnerComponent()?.setModel(oGoalsOriginalModel, "goalsOriginal");
            }
            if (!oGoalsCurrentModel) {
                oGoalsCurrentModel = new JSONModel({});
                oController.getOwnerComponent()?.setModel(oGoalsCurrentModel, "goalsCurrent");
            }

            oGoalsOriginalModel.setProperty("/Goals", structuredClone(aGoals.success));
            oGoalsCurrentModel.setProperty("/Goals", structuredClone(aGoals.success));
        }
    }

    onBeforeRendering(): void | undefined {
        console.log("Preparing GoalsListController");
    }

    onAfterRendering(): void | undefined {
        console.log("Rendering GoalsListController");
        const oController = this;
        oController.appendHeader();
    }

    onExit(): void | undefined {
        console.log("GoalsListController exited");
        // clean up fragment dialog if it exists
        if (this._oCreateDialog) {
            this._oCreateDialog.destroy();
            this._oCreateDialog = undefined;
        }
    }

    onSearch(oEvent: Event): void {
        const sQuery = (oEvent.getParameter("query" as never) as string || "").trim();
        const oTable = this.byId("goalsTable") as Table;
        if (!oTable) return;

        let aFilters: Filter[] = [];
        if (sQuery) {
            aFilters = [
                new Filter({
                    filters: [
                        new Filter("title", FilterOperator.Contains, sQuery)
                    ],
                    and: false
                })
            ];
        }
        const oBinding = oTable?.getBinding("items") as ListBinding;
        if (oBinding) {
            oBinding.filter(aFilters, "Application");
        }
    }

    async onAddNewGoal(): Promise<void> {
        const oController = this;

        // Lazy load fragment dialog if not already loaded
        if (!oController._oCreateDialog) {
            const viewId = oController.getView()?.getId() as string;
            const oFragment = await Fragment.load({
                id: viewId,
                name: "LogTask.view.fragment.CreateGoal",
                controller: oController
            });

            oController._oCreateDialog = oFragment as Dialog;
            oController.getView()?.addDependent(oController._oCreateDialog);
        }

        oController._oCreateDialog.open();
    }

    async onCreateGoalDialogCreate(): Promise<void> {
        const oController = this;
        if (!oController._oCreateDialog) return;

        const viewId = oController.getView()?.getId() as string;
        const oTitleInput = Fragment.byId(viewId, "createGoalTitleInput") as Input;
        const oDescriptionInput = Fragment.byId(viewId, "createGoalDescriptionInput") as TextArea;

        const title = (oTitleInput?.getValue() || "").trim();
        const description = (oDescriptionInput?.getValue() || "").trim();

        const i18nModel = this.getView()?.getModel("i18n") as ResourceModel | undefined;
        const resourceBundle = await i18nModel?.getResourceBundle();
        const titleRequiredText = resourceBundle?.getText("titleRequired") || "Please provide a title for the goal.";
        const descriptionRequiredText = resourceBundle?.getText("descriptionRequired") || "Please provide a description for the goal.";

        if (!title) {
            MessageToast.show(titleRequiredText);
            return;
        }
        if (!description) {
            MessageToast.show(descriptionRequiredText);
            return;
        }


        let response = await oController.request("/goals", "POST", {
            title,
            description
        });
        try {
            if (response?.success) {
                MessageToast.show(resourceBundle?.getText("goalCreated") || "Goal created");

                // Refresh list
                const oModel = oController.getOwnerComponent()?.getModel("goalsCurrent") as JSONModel;
                const aGoals = oModel.getProperty("/Goals") as Array<Object> || [];

                aGoals.unshift({
                    ...response.success
                });

                oModel.setProperty("/Goals", aGoals);
            }

            // Close dialog and clear inputs
            oController._oCreateDialog.close();
            if (oTitleInput) oTitleInput.setValue("");
            if (oDescriptionInput) oDescriptionInput.setValue("");
        } catch (err) {
            console.error("Failed to create goal:", err);
            MessageToast.show(resourceBundle?.getText("goalCreateFailed") || "Failed to create goal. Check console for details.");
        }
    }

    onCreateGoalDialogClose(): void {
        const oController = this;
        if (!oController._oCreateDialog) return;

        const viewId = oController.getView()?.getId() as string;
        const oTitleInput = Fragment.byId(viewId, "createGoalTitleInput") as Input;
        const oDescriptionInput = Fragment.byId(viewId, "createGoalDescriptionInput") as TextArea;

        if (oTitleInput) oTitleInput.setValue("");
        if (oDescriptionInput) oDescriptionInput.setValue("");

        oController._oCreateDialog.close();
    }

    onGoalsListItemPress(oEvent: Event): void | undefined {
        const oItem = oEvent.getSource() as ColumnListItem;
        if (!oItem) {
            console.error("ColumnListItem not found");
            return;
        }

        const sPath = oItem.getBindingContext("goalsCurrent")?.getPath()
        if (!sPath) {
            console.error("Binding context path not found");
            return;
        }

        const oFCL = this.getView()?.getParent()?.getParent() as FlexibleColumnLayout;
        if (!oFCL) {
            console.error("FlexibleColumnLayout not found");
            return;
        }
        const aMidColumnPages = oFCL.getAggregation("midColumnPages") as ManagedObject[];
        if (aMidColumnPages.length > 0) {
            const oGoalDetailView = aMidColumnPages[0] as View;
            if (!oGoalDetailView) {
                console.error("Goal detail view not found");
                return;
            }

            oGoalDetailView.bindElement({
                path: sPath, model: "goalsCurrent"
            });
        } else {
            console.error("No mid column pages found");
            return;
        }
        oFCL.setLayout(LayoutType.TwoColumnsMidExpanded);
    }
}