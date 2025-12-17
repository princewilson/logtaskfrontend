import JSONModel from 'sap/ui/model/json/JSONModel';
import BaseController from './Base.controller'
import FlexibleColumnLayout from 'sap/f/FlexibleColumnLayout';
export default class GoalDetailController extends BaseController {
    onInit(): void | undefined {
        console.log("GoalDetailController initialized");
    }
    onBeforeRendering(): void | undefined {
        console.log("Preparing GoalDetailController");
    }
    onAfterRendering(): void | undefined {
        console.log("Rendering GoalDetailController");
    }
    onExit(): void | undefined {
        console.log("GoalDetailController exited");
    }
    onCloseDetail(): void {
        const oController = this;
        const oView = oController.getView();
        const oFCL = oView?.getParent()?.getParent() as FlexibleColumnLayout;
        // Check if FlexibleColumnLayout exists
        if (oFCL && typeof oFCL.setLayout === "function") {
            // Show only the begin column (list)
            oFCL.setLayout("OneColumn");
        }
    }
    async onDeleteGoal(): Promise<void> {
        const oController = this;
    }
}