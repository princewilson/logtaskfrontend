import Controller from "sap/ui/core/mvc/Controller";
import UIComponent from "sap/ui/core/UIComponent";
import { CLERK_SIGN_IN_FALLBACK_REDIRECT_URL, CLERK_AFTER_SIGNOUT_URL, API_BASE_URL } from '../constants';
import JSONModel from "sap/ui/model/json/JSONModel";
import ManagedObject from "sap/ui/base/ManagedObject";
import Page from "sap/m/Page";
import Title from "sap/m/Title";
import Bar from "sap/m/Bar";
import HTML from "sap/ui/core/HTML";
import FlexItemData from "sap/m/FlexItemData";
import Button from "sap/m/Button";
import History from "sap/ui/core/routing/History";
import ResourceModel from "sap/ui/model/resource/ResourceModel";
import ResourceBundle from "sap/base/i18n/ResourceBundle";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
/**
 * @name LogTask.controller.Base
 */
export default class BaseController extends Controller {
    onInit(): void | undefined {
        console.log("BaseController onInit");
        const oController = this;
        // set i18n model on view
        const i18nModel = new ResourceModel({
            bundleName: "LogTask.i18n.i18n"
        });
        oController.getView()?.setModel(i18nModel, "i18n");
    }
    onBeforeRendering(): void | undefined {
        console.log("BaseController onBeforeRendering");
    }
    onAfterRendering(): void | undefined {
        console.log("BaseController onAfterRendering");
    }
    onExit(): void | undefined {
        console.log("BaseController exited");
    }
    protected async ensureAuthenticated(): Promise<boolean> {
        const router = UIComponent.getRouterFor(this);

        if (!window.Clerk?.isSignedIn) {
            router.navTo("login");
            return false;
        }

        return true;
    }

    _renderClerkComponent(): void {
        console.log("BaseController _renderClerkComponent");
        const oController = this;
        if (!window.Clerk) {
            console.error("ClerkJS is not loaded");
            return;
        }
        const router = UIComponent.getRouterFor(this);

        if (window.Clerk.isSignedIn) {
            // If already signed in, redirect to home page            
            const user = document.getElementById(oController.getView()?.byId("clerk-user")?.getId() || "");
            if (!user) {
                console.info("Could not find Clerk user element");
                return;
            }

            user.innerHTML = ""; // Clear previous content;
            const div = document.createElement("div");
            user.appendChild(div);


            // Mount the user button
            window.Clerk.mountUserButton(div, {
                afterSignOutUrl: CLERK_AFTER_SIGNOUT_URL
            });
        } else {
            // Else, show sign-in form        
            const root = document.getElementById("clerk-root");

            // If root element exists, that means we are already in login page
            if (root) {
                root.innerHTML = "";
                const div = document.createElement("div");
                root.appendChild(div);


                // Mount the sign-in form
                window.Clerk.mountSignIn(div, {
                    routing: 'hash',
                    fallbackRedirectUrl: CLERK_SIGN_IN_FALLBACK_REDIRECT_URL
                });
            }
        }
    }

    setHeaderTitle(i18nTitle: string): void {
        const oController = this;
        const oModel = oController.getOwnerComponent()?.getModel("customPageHeader") as JSONModel;
        const resourceBundle = (this.getView()?.getModel("i18n") as ResourceModel)?.getResourceBundle() as ResourceBundle;
        if (oModel) {
            oModel.setProperty("/title", resourceBundle.getText(i18nTitle));
        }
    }

    appendHeader(): void {
        const oController = this;
        const content = oController.getView()?.getAggregation("content") as ManagedObject[];
        if (content && content.length && content[0] instanceof Page) {
            const page = content[0] as Page;
            const customHeader = page.getCustomHeader();
            if (!customHeader) {
                const oCustomHeader = new Bar({
                    design: "Header",
                    enableFlexBox: true,
                    contentLeft: [
                        new Button({
                            type: "Back",
                            press: oController.onNavBack.bind(oController)
                        }),
                        new Title({
                            text: "{i18n>headerTitle}",
                            level: "H6"
                        })
                    ],
                    contentMiddle: [
                        new Title({
                            text: "{customPageHeader>/title}",
                            layoutData: new FlexItemData({
                                alignSelf: "Baseline",
                                growFactor: 1
                            })
                        })
                    ],
                    contentRight: [
                        new HTML(this.getView()?.createId("clerk-user"), {
                            content: "<div class='clerk-user'></div>;"
                        })
                    ]
                });
                oCustomHeader.addEventDelegate({
                    onAfterRendering: function () {
                        oController._renderClerkComponent();
                    }
                })
                page.setCustomHeader(
                    oCustomHeader
                );
            }
        }
    }
    getRouter() {
        return UIComponent.getRouterFor(this);
    }

    /**
     * Generic network request helper that:
     * - Ensures a Clerk token is present for authentication
     * - Builds sane default headers (Accept, Sec-Fetch-Dest, X-Forwarded-Host, X-Forwarded-Protocol)
     * - Automatically sets Content-Type for JSON bodies
     * - Parses JSON/text responses and throws on non-2xx
     */
    protected async request<T = any>(endpoint: string, method: string = "GET", body?: any, extraHeaders?: Record<string, string>): Promise<T> {
        const oController = this;
        const oUIModel = oController.getOwnerComponent()?.getModel("ui") as JSONModel | undefined;

        let url: URL;
        if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
            url = new URL(endpoint);
        } else if (endpoint.startsWith("/")) {
            // path relative to API base
            url = new URL(endpoint, API_BASE_URL);
        } else {
            // treat as relative path
            url = new URL(`/${endpoint}`, API_BASE_URL);
        }
        try {
            // Fetch Clerk token and require it for all calls
            let token = "";
            token = (await window.Clerk?.session?.getToken?.()) || "";

            if (!token) {
                const err: any = new Error("Not authenticated");
                err.status = 401;
                throw err;
            }

            const headers: Record<string, string> = {
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`,
                ...extraHeaders
            };

            const init: RequestInit = { method, headers };

            if (body !== undefined) {
                if (body instanceof FormData) {
                    init.body = body;
                    // Let browser set multipart boundaries and Content-Type for FormData
                } else if (typeof body === "string") {
                    init.body = body;
                    headers["Content-Type"] = headers["Content-Type"] || "text/plain;charset=utf-8";
                } else {
                    init.body = JSON.stringify(body);
                    headers["Content-Type"] = headers["Content-Type"] || "application/json";
                }
            }

            oUIModel?.setProperty("/busy", true);

            const response = await fetch(url.toString(), init);

            // Parse response intelligently
            let parsed: any;
            const contentType = response.headers.get("content-type") || "";
            if (contentType.includes("application/json")) {
                parsed = await response.json();
            } else {
                parsed = await response.text();
            }

            if (!response.ok) {
                const err: any = new Error(`Request failed: ${response.status} ${response.statusText}`);
                err.status = response.status;
                err.body = parsed;
                throw err;
            }

            return parsed as T;
        } catch (err: unknown) {
            const isHttpError = (e: unknown): e is Error & { status?: number | string; body?: any } =>
                e instanceof Error && 'status' in e;

            if (isHttpError(err)) {
                const status = Number(err.status);

                if ([400, 404, 409].includes(status)) {
                    MessageBox.error(
                        err?.body?.error || "Operation failed.",
                        { title: "Operation Failed" }
                    );
                    throw err;
                } else if (status === 401) {
                    MessageBox.error("Please re-login and try again", {
                        title: "Session Expired",
                    });
                    throw err;
                }
            }

            MessageToast.show("Could not connect to the server.");
            throw err;
        } finally {
            oUIModel?.setProperty("/busy", false);
        }
    }

    protected diff<T extends object>(current: T, original: T): Partial<T> {
        const changes: Partial<T> = {};
        (Object.keys(current) as (keyof T)[]).forEach(key => {
            if (current[key] !== original[key]) {
                changes[key] = current[key];
            }
        });
        return changes;
    }

    onNavBack(): void {
        let oController = this;
        let oHistory, sPreviousHash;

        oHistory = History.getInstance();
        sPreviousHash = oHistory.getPreviousHash();

        if (sPreviousHash !== undefined) {
            window.history.go(-1);
        } else {
            oController.getRouter()?.navTo("home", {}, true /*no history*/);
        }
    }
};