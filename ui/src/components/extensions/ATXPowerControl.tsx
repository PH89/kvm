import { useEffect, useState, useRef } from "react";
import { LuHardDrive, LuPower, LuRotateCcw } from "react-icons/lu";

import { m } from "@localizations/messages.js";
import { JsonRpcResponse, useJsonRpc } from "@hooks/useJsonRpc";
import {Button, HoldableFeedbackButton} from "@components/Button";
import Card from "@components/Card";
import LoadingSpinner from "@components/LoadingSpinner";
import { SettingsPageHeader } from "@components/SettingsPageheader";
import notifications from "@/notifications";

interface ATXState {
  power: boolean;
  hdd: boolean;
}

function SecondsCounter() {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    setSeconds(0);
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
  return <div>{seconds} s</div>;
}

export function ATXPowerControl() {
  const [atxState, setAtxState] = useState<ATXState | null>(null);

  const { send } = useJsonRpc(function onRequest(resp) {
    if (resp.method === "atxState") {
      setAtxState(resp.params as ATXState);
    }
  });

  // Request initial state
  useEffect(() => {
    send("getATXState", {}, (resp: JsonRpcResponse) => {
      if ("error" in resp) {
        notifications.error(
          m.atx_power_control_get_state_error({ error: resp.error.data || m.unknown_error() }),
        );
        return;
      }
      setAtxState(resp.result as ATXState);
    });
  }, [send]);

  const handlePowerPress = (pressed: boolean) => {
    // Handle button press
    if (pressed) {
      // Send press action
      console.log("Sending press ATX power button");
      send("setATXPowerAction", { action: "power-press" }, resp => {
        if ("error" in resp) {
          notifications.error(
              m.atx_power_control_send_action_error({
                  action: m.atx_power_control_power_button_press(),
                  error: resp.error.data || m.unknown_error(),
              }),
          );
        }
      });
    }
    // Handle button release
    else {
      console.log("Sending release ATX power button");
      send("setATXPowerAction", { action: "power-release" }, resp => {
        if ("error" in resp) {
          notifications.error(
              m.atx_power_control_send_action_error({
                  action: m.atx_power_control_power_button_release(),
                  error: resp.error.data || m.unknown_error(),
              }),
          );
        }
      });
    }
  };

  return (
    <div className="space-y-4">
      <SettingsPageHeader
        title={m.extensions_atx_power_control()}
        description={m.extensions_atx_power_control_description()}
      />

      {atxState === null ? (
        <Card className="flex h-[120px] items-center justify-center p-3">
          <LoadingSpinner className="h-6 w-6 text-blue-500 dark:text-blue-400" />
        </Card>
      ) : (
        <Card className="h-[120px] animate-fadeIn opacity-0">
          <div className="space-y-4 p-3">
            {/* Control Buttons */}
            <div className="flex items-center space-x-2">
              <HoldableFeedbackButton
                size="SM"
                theme="light"
                LeadingIcon={LuPower}
                text={m.atx_power_control_power_button()}
                onPress={() => handlePowerPress(true)}
                onRelease={() => handlePowerPress(false)}
                feedbackRender={(pressed, render) => {
                  if (pressed) {
                    render(
                        <SecondsCounter />
                    );
                  } else {
                    render(null);
                  }
                }}
              />
              <Button
                size="SM"
                theme="light"
                LeadingIcon={LuRotateCcw}
                text={m.atx_power_control_reset_button()}
                onClick={() => {
                  send("setATXPowerAction", { action: "reset" }, (resp: JsonRpcResponse) => {
                    if ("error" in resp) {
                      notifications.error(
                        m.atx_power_control_send_action_error({
                          action: m.atx_power_control_reset_button(),
                          error: resp.error.data || m.unknown_error(),
                        }),
                      );
                      return;
                    }
                  });
                }}
              />
            </div>

            <hr className="border-slate-700/30 dark:border-slate-600/30" />
            {/* Status Indicators */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  <LuPower
                    strokeWidth={3}
                    className={`mr-1 inline ${
                      atxState?.power ? "text-green-600" : "text-slate-300"
                    }`}
                  />
                  {m.atx_power_control_power_led()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  <LuHardDrive
                    strokeWidth={3}
                    className={`mr-1 inline ${atxState?.hdd ? "text-blue-400" : "text-slate-300"}`}
                  />
                  {m.atx_power_control_hdd_led()}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
