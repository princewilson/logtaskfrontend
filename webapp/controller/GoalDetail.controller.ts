import JSONModel from 'sap/ui/model/json/JSONModel';
import BaseController from './Base.controller'
import FlexibleColumnLayout from 'sap/f/FlexibleColumnLayout';
import ResourceModel from 'sap/ui/model/resource/ResourceModel';
import MessageToast from 'sap/m/MessageToast';
import Dialog from 'sap/m/Dialog';
import Fragment from 'sap/ui/core/Fragment';
import { Goal } from '../types/Goal';
import MessageBox from 'sap/m/MessageBox';

export default class GoalDetailController extends BaseController {
    private _oDeleteGoalDialog?: Dialog;

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
    onEditGoal(): void {
        const oController = this;
        const oView = oController.getView();
        const oGoalsCurrentModel = oView?.getModel("goalsCurrent") as JSONModel;
        const oUIModel = oView?.getModel("ui") as JSONModel;
        const bEditMode = oUIModel?.getProperty("/edit");

        // On entering edit mode, ensure goalsCurrent is a fresh copy of goalsOriginal
        if (!bEditMode) {
            const oGoalsOriginal = oController.getOwnerComponent()?.getModel("goalsOriginal") as JSONModel;
            oGoalsCurrentModel.setProperty("/Goals", structuredClone(oGoalsOriginal.getProperty("/Goals")));
        }
        oUIModel?.setProperty("/edit", !bEditMode);
        oUIModel?.setProperty("/dirty", false);

        // Attach property change listener to track changes
        oGoalsCurrentModel.attachPropertyChange(oController._onGoalPropertyChange, oController);
    }
    async onSaveGoal(): Promise<void> {
        const oController = this;
        const oView = oController.getView();
        const oUIModel = oView?.getModel("ui") as JSONModel;
        const oGoalsCurrentModel = oView?.getModel("goalsCurrent") as JSONModel;
        const sBindingPath = oView?.getBindingContext("goalsCurrent")?.getPath();
        const oCurrent: Goal = oView?.getModel("goalsCurrent")?.getProperty(sBindingPath!) as Goal;
        const aOriginalGoals: Goal[] = oController.getOwnerComponent()?.getModel("goalsOriginal")?.getProperty("/Goals") as Goal[] || [];
        const oOriginal: Goal = aOriginalGoals.find(goal => goal.id === oCurrent.id)!;
        const bEditMode = oUIModel?.getProperty("/edit");
        let oChangedFields: Partial<Goal> = {};

        oChangedFields = oController.diff<Goal>(oCurrent, oOriginal);

        if (Object.keys(oChangedFields).length > 0 && sBindingPath) {
            const sGoalId = oCurrent.id;
            let oUpdateGoal = await oController.request(`/goals/${sGoalId}`, "PUT", oChangedFields);
            if (oUpdateGoal?.success) {
                // Update local model
                const oGoal = oGoalsCurrentModel.getProperty(sBindingPath);
                Object.assign(oGoal, oChangedFields);
                oGoalsCurrentModel.setProperty(sBindingPath, oGoal);

                const aGoals = oGoalsCurrentModel.getProperty("/Goals") as Goal[];
                // Update both models to new state
                (oController.getOwnerComponent()?.getModel("goalsOriginal") as JSONModel)?.setProperty("/Goals", structuredClone(aGoals));
                (oController.getOwnerComponent()?.getModel("goalsCurrent") as JSONModel)?.setProperty("/Goals", structuredClone(aGoals));

                oGoalsCurrentModel.detachPropertyChange(oController._onGoalPropertyChange, oController);
            }
        } else {
            MessageToast.show("No changes to save.");
        }
        // Exit edit mode
        oUIModel?.setProperty("/edit", !bEditMode);
        oUIModel?.setProperty("/dirty", false);
    }
    onCancelGoal(): void {
        const oController = this;
        const oView = oController.getView();
        const oUIModel = oView?.getModel("ui") as JSONModel;
        const bEditMode = oUIModel?.getProperty("/edit");
        const bDirty = oUIModel?.getProperty("/dirty");
        const oOriginal = oController.getOwnerComponent()?.getModel("goalsOriginal") as JSONModel;
        const oCurrent = oView?.getModel("goalsCurrent") as JSONModel;

        const resetAndExit = () => {
            // Reset goalsCurrent to original
            if (oOriginal) {
                oCurrent?.setProperty("/Goals", structuredClone(oOriginal.getProperty("/Goals")));
            }
            // Exit edit mode
            oCurrent?.detachPropertyChange(oController._onGoalPropertyChange, oController);
            oUIModel?.setProperty("/dirty", false);
            oUIModel?.setProperty("/edit", !bEditMode);
        };

        if (bDirty) {
            MessageBox.warning("Are you sure you want to discard your changes?", {
                title: "Confirm",
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function (sAction: string) {
                    if (sAction === MessageBox.Action.YES) {
                        resetAndExit();
                    }
                }
            })
        } else {
            resetAndExit();
        }
    }
    onCloseDetail(): void {
        const oController = this;
        const oView = oController.getView();
        const oUIModel = oView?.getModel("ui") as JSONModel;
        const bEditMode = oUIModel?.getProperty("/edit");
        const bDirty = oUIModel?.getProperty("/dirty");
        const oOriginal = oController.getOwnerComponent()?.getModel("goalsOriginal") as JSONModel;
        const oCurrent = oView?.getModel("goalsCurrent") as JSONModel;
        const oFCL = oView?.getParent()?.getParent() as FlexibleColumnLayout;

        if (bDirty) {
            MessageBox.warning("Are you sure you want to discard your changes?", {
                title: "Confirm",
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function (sAction: string) {
                    if (sAction === MessageBox.Action.YES) {
                        // Reset goalsCurrent to original
                        if (oOriginal) {
                            oCurrent?.setProperty("/Goals", structuredClone(oOriginal.getProperty("/Goals")));
                        }
                        // Exit edit mode
                        oCurrent?.detachPropertyChange(oController._onGoalPropertyChange, oController);
                        oUIModel?.setProperty("/dirty", false);
                        oUIModel?.setProperty("/edit", !bEditMode);

                        // Check if FlexibleColumnLayout exists
                        if (oFCL && typeof oFCL.setLayout === "function") {
                            // Show only the begin column (list)
                            oFCL.setLayout("OneColumn");
                        }
                    }
                }
            })
        } else {
            // Check if FlexibleColumnLayout exists
            if (oFCL && typeof oFCL.setLayout === "function") {
                // Show only the begin column (list)
                oFCL.setLayout("OneColumn");
                oUIModel?.setProperty("/dirty", false);
                oUIModel?.setProperty("/edit", false);
            }
        }
    }
    async onDeleteGoal(): Promise<void> {
        const oController = this;

        if (!oController._oDeleteGoalDialog) {
            const viewId = oController.getView()?.getId() as string;
            const oFragment = await Fragment.load({
                id: viewId,
                name: "LogTask.view.fragment.DeleteGoal",
                controller: oController
            });

            oController._oDeleteGoalDialog = oFragment as Dialog;
            oController.getView()?.addDependent(oController._oDeleteGoalDialog);
        }

        oController._oDeleteGoalDialog.open();
    }

    async onConfirmDeleteGoalYes(): Promise<void> {
        const oController = this;
        const oView = oController.getView();
        const oUIModel = oView?.getModel("ui") as JSONModel;
        const bEditMode = oUIModel?.getProperty("/edit");
        const oGoalsCurrentModel = oView?.getModel("goalsCurrent") as JSONModel;
        const sBindingPath = oView?.getBindingContext("goalsCurrent")?.getPath();
        const oCurrentGoal: Goal = oView?.getModel("goalsCurrent")?.getProperty(sBindingPath!) as Goal;
        const sGoalId = oCurrentGoal.id;
        const i18nModel = oController.getView()?.getModel("i18n") as ResourceModel;
        const resourceBundle = await i18nModel?.getResourceBundle();

        if (sGoalId) {
            let oDeleteGoal = await oController.request(`/goals/${sGoalId}`, "DELETE");
            if (oDeleteGoal?.success) {
                MessageToast.show(resourceBundle?.getText("goalDeletedMessage") || "Goal deleted successfully");

                oGoalsCurrentModel.detachPropertyChange(oController._onGoalPropertyChange, oController);

                let aGoals = oGoalsCurrentModel?.getProperty("/Goals") as Goal[] || [];
                aGoals = aGoals.filter((goal: Goal) => goal.id !== sGoalId);

                (oController.getOwnerComponent()?.getModel("goalsOriginal") as JSONModel)?.setProperty("/Goals", structuredClone(aGoals));
                (oController.getOwnerComponent()?.getModel("goalsCurrent") as JSONModel)?.setProperty("/Goals", structuredClone(aGoals));

                oUIModel?.setProperty("/edit", !bEditMode);
                oUIModel?.setProperty("/dirty", false);
                oController.onCloseDetail();
            }
        }
        if (oController._oDeleteGoalDialog) {
            oController._oDeleteGoalDialog.close();
        }
    }

    onConfirmDeleteGoalNo(): void {
        const oController = this;
        if (oController._oDeleteGoalDialog) {
            oController._oDeleteGoalDialog.close();
        }
    }

    private _onGoalPropertyChange(): void {
        const oController = this;
        const oView = oController.getView();
        const oUIModel = oView?.getModel("ui") as JSONModel;

        const sPath = oView?.getBindingContext("goalsCurrent")?.getPath();
        if (!sPath) return;

        const oCurrent = oView?.getModel("goalsCurrent")?.getProperty(sPath) as Goal;
        const aOriginalGoals = oController.getOwnerComponent()
            ?.getModel("goalsOriginal")
            ?.getProperty("/Goals") as Goal[];

        const oOriginal = aOriginalGoals.find(g => g.id === oCurrent.id);
        if (!oOriginal) return;

        const hasChanges = Object.keys(oController.diff(oCurrent, oOriginal)).length > 0;
        oUIModel.setProperty("/dirty", hasChanges);
    }
}