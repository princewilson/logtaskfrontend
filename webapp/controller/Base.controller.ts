import Controller from "sap/ui/core/mvc/Controller";
import UIComponent from "sap/ui/core/UIComponent";
import { CLERK_SIGN_IN_FALLBACK_REDIRECT_URL } from '../constants';
import { CLERK_AFTER_SIGNOUT_URL } from '../constants';
import JSONModel from "sap/ui/model/json/JSONModel";
import ManagedObject from "sap/ui/base/ManagedObject";
import Page from "sap/m/Page";
import Title from "sap/m/Title";
import Bar from "sap/m/Bar";
import HTML from "sap/ui/core/HTML";
import FlexItemData from "sap/m/FlexItemData";
import Button from "sap/m/Button";
import History from "sap/ui/core/routing/History";
/**
 * @name LogTask.controller.Base
 */
export default class BaseController extends Controller {
    onInit(): void | undefined {
        const oController = this;
        oController.appendHeader();
        oController.ensureAuthenticated().then((authenticated: boolean) => {
            if (authenticated) {
                console.log("User Authenticated");
            } else {
                console.log("Authentication failed");
            }
        });
    }

    onAfterRendering(): void | undefined {
        window.ClerkReady.then(() => {
            this._renderClerkComponent();
        });
    }

    protected async ensureAuthenticated(): Promise<boolean> {
        if (!window.ClerkReady) {
            console.error("ClerkReady Promise not found");
            return false;
        }

        const router = UIComponent.getRouterFor(this);

        if (!window.Clerk?.user) {
            router.navTo("login");
            return false;
        }

        return true;
    }

    _renderClerkComponent(): void {
        if (!window.Clerk) {
            console.error("ClerkJS is not loaded");
            return;
        }


        if (window.Clerk.user && window.Clerk.session && window.Clerk.session.status == "active") {
            // If already signed in, redirect to home page
            const router = UIComponent.getRouterFor(this);
            router.navTo("home");

            const user = document.getElementById("clerk-user");
            if (!user) {
                console.error("Could not find Clerk root element");
                return;
            }

            if (!user.innerHTML) {
                const div = document.createElement("div");
                user.appendChild(div);
                window.Clerk.mountUserButton(div, {
                    afterSignOutUrl: CLERK_AFTER_SIGNOUT_URL
                });
            }
        } else {
            // Else, show sign-in form        

            const root = document.getElementById("clerk-root");

            if (!root) {
                console.error("Could not find Clerk root element");
                return;
            }

            if (!root.innerHTML) {
                const div = document.createElement("div");
                root.appendChild(div);
                window.Clerk.mountSignIn(div, {
                    routing: 'hash',
                    fallbackRedirectUrl: CLERK_SIGN_IN_FALLBACK_REDIRECT_URL
                });
            }
        }
    }

    setHeaderTitle(title: string): void {
        const oController = this;
        const oModel = oController.getOwnerComponent()?.getModel() as JSONModel;
        if (oModel) {
            oModel.setProperty("/headerTitle", title);
        }
    }

    appendHeader(): void {
        const oController = this;
        const content = oController.getView()?.getAggregation("content") as ManagedObject[];
        if (content && content.length && content[0] instanceof Page) {
            const page = content[0] as Page;
            const customHeader = page.getCustomHeader();
            if (!customHeader) {
                page.setCustomHeader(
                    new Bar({
                        design: "Header",
                        enableFlexBox: true,
                        contentLeft: [
                            new Button({
                                type: "Back",
                                press: oController.onNavBack
                            }),
                            new Title({
                                text: "LogTask",
                                level: "H6"
                            })
                        ],
                        contentMiddle: [
                            new Title({
                                text: "{/headerTitle}",
                                layoutData: new FlexItemData({
                                    alignSelf: "Baseline",
                                    growFactor: 1
                                })
                            })
                        ],
                        contentRight: [
                            new HTML({
                                content: "<div id='clerk-user'></div>;"
                            })
                        ]
                    })
                );
            }
        }
    }
    getRouter() {
        return UIComponent.getRouterFor(this);
    }
    onNavBack(): void {
        let oController = this;
        let oHistory, sPreviousHash;

        oHistory = History.getInstance();
        sPreviousHash = oHistory.getPreviousHash();

        if (sPreviousHash !== undefined) {
            window.history.go(-1);
        } else {
            oController.getRouter().navTo("home", {}, true /*no history*/);
        }
    }
};