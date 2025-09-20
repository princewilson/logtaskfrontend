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
        fetch("http://localhost:3000/hello", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${await window.Clerk.session.getToken()}`,
                "Accept": "*/*",
                "Host": "localhost:3000",
                "Origin": "http://localhost:8081",
                "Referer": "http://localhost:8081/index.html#/goals",
                "Sec-Fetch-Dest": "document",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.3485.66",
                "X-Forwarded-Host": "localhost:3000",
                "X-Forwarded-Protocol": "http"
            }
        }).then(async (response: Response) => {
            const text = await response.json();
            console.log(text); // This will print the json response from the server
        })
    }
}