import { BackgroundApp } from "./app/BackgroundApp.ts";
import { ChromeBackgroundPlatform } from "./platform/chrome/ChromeBackgroundPlatform.ts";
import { PANEL_PORT_NAME } from "./protocol/messages.ts";

new BackgroundApp(new ChromeBackgroundPlatform({ panelPortName: PANEL_PORT_NAME })).start();
