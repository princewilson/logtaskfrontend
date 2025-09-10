import UIComponent from "sap/ui/core/UIComponent";
import JSONModel from "sap/ui/model/json/JSONModel";
/**
 * @namespace LogTask
 */
export default class Component extends UIComponent {
    public static metadata = {
        "interfaces": ["sap.ui.core.IAsyncContentCreation"],
        "manifest": "json"
    };
    init(): void {
        // call the init function of the parent
        super.init();

        const oJSON = {
            "headerTitle": ""
        }
        const oModel = new JSONModel();
        oModel.setData(oJSON);

        // set the model
        this.setModel(oModel);

        const oGoalsJSON = {
            "Goals": [
                {
                    "id": "goal1",
                    "title": "Complete Project Milestone",
                    "description": "Finish the first milestone of the project by the end of the month.",
                    "status": "In Progress",
                    "dueDate": "2023-10-31"
                },
                {
                    "id": "goal2",
                    "title": "Improve Team Collaboration",
                    "description": "Organize weekly team meetings to enhance communication and collaboration.",
                    "status": "Not Started",
                    "dueDate": "2023-11-15"
                }
            ]
        }
        const oGoalsModel = new JSONModel();
        oGoalsModel.setData(oGoalsJSON);

        // set the goals model
        this.setModel(oGoalsModel, "goals");

        // creates the views based on URL/hash
        this.getRouter().initialize();
    };
};