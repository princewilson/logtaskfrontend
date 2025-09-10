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

export default class GoalsListController extends BaseController {
    onInit(): void | undefined {
        console.log("GoalsListController initialized");
        const oController = this;
        oController.ensureAuthenticated().then((authenticated: boolean) => {
            if (authenticated) {
                console.log("User Authenticated");
            } else {
                console.log("Authentication failed");
            }
        });

        // Listen for route match
        const oRouter = oController.getRouter();
        oRouter.getRoute("goals")?.attachPatternMatched(this._onRouteMatched, this);
    }
    _onRouteMatched(): void {
        const oController = this;
        oController.appendHeader();
        oController.setHeaderTitle("goalsListTitle"); // Assuming "goalsListTitle" is defined in i18n
        oController._renderClerkComponent();
    }

    onBeforeRendering(): void | undefined {
        console.log("Preparing GoalsListController");
    }

    onAfterRendering(): void | undefined {
        console.log("Rendering GoalsListController");
        const oController = this;
        oController._renderClerkComponent();
    }

    onExit(): void | undefined {
        console.log("GoalsListController exited");
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
                        new Filter("id", FilterOperator.Contains, sQuery),
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

    onAddNewGoal(): void | undefined {

    }

    onGoalsListItemPress(oEvent: Event): void | undefined {
        const oItem = oEvent.getSource() as ColumnListItem;
        if (!oItem) {
            console.error("ColumnListItem not found");
            return;
        }

        const sPath = oItem.getBindingContext("goals")?.getPath()
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
                path: sPath, model: "goals"
            });
        } else {
            console.error("No mid column pages found");
            return;
        }
        oFCL.setLayout(LayoutType.TwoColumnsMidExpanded);
    }
}