import * as React from "react";

import { Radio, Space, Input, Button } from "antd";

import { AlertList, AddToAlertList } from "./AlertList";

import { fetchCreateTemp, fetchUnloackWithFast } from "../api/api-def";

import { useAppDispatch, useAppSelector } from "../redux/store";
import {
  addTempInfo,
  addUnLockedData,
  KeyDef,
  LockedDataDef
} from "../redux/main-slice";
import { KeyInput } from "./KeyInput";
import { BoldTime } from "./BoldTime";

export function UseSharedCode() {
  const dispath = useAppDispatch();
  const keys = useAppSelector((s) => s.main.keys);
  const locks = useAppSelector((s) => s.main.lockedData);
  const ALERT_LIST_NAME = "USE_SHARED_CODE";

  let startUnlockWithSharedCode = (
    locked: LockedDataDef,
    key: KeyDef,
    code: string,
    time: string
  ) => {
    let encPassObj = locked.availablePass.filter(
      (e) => e.keySalt === key.keySalt
    )[0];

    fetchUnloackWithFast(key.id, key.keySalt, time, code, encPassObj.encPass)
      .then((result) => {
        if (!!result.err) {
          AddToAlertList(
            ALERT_LIST_NAME,
            "error",
            `${result.err || "<empty error>"}`
          );
          return;
        } else {
          try {
            dispath(
              addUnLockedData({
                desc: locked.desc,
                encPass: encPassObj.encPass,
                encData: locked.encData,
                from: result.data.from,
                to: result.data.to,
                unlockProof: result.data.proof,
                keyID: key.id,
                keySalt: key.keySalt
              })
            );
            AddToAlertList(
              ALERT_LIST_NAME,
              "success",
              `Added ${locked.desc} to the unlocked queue1`
            );
            setSelectedLocked(null);
            setSelectedSaltKey(null);
            setTimeCode("");
            setShareCode("");
          } catch (error) {
            AddToAlertList(
              ALERT_LIST_NAME,
              "error",
              `Error unlocking using share: ${error}`
            );
          }
        }
      })
      .catch((e) =>
        AddToAlertList(ALERT_LIST_NAME, "error", `Error fetching: ${e}`)
      );
  };

  const [selectedLocked, setSelectedLocked] = React.useState(
    null as LockedDataDef
  );
  const [selectedSaltKey, setSelectedSaltKey] = React.useState(null as KeyDef);
  const [shareCode, setShareCode] = React.useState("");
  const [timeCode, setTimeCode] = React.useState("");

  return (
    <>
      <Space direction="vertical" style={{ width: "100%" }}>
        <b>Choose Locked Item:</b>
        <Radio.Group
          onChange={(e) => {
            setSelectedLocked(
              locks.filter((l) => l.encData === e.target.value)[0]
            );
            setSelectedSaltKey(null);
          }}
          value={selectedLocked && selectedLocked.encData}
        >
          {locks.map((e) => (
            <Radio key={e.encData} value={e.encData}>
              {e.desc}
            </Radio>
          ))}
        </Radio.Group>
        <b>Choose Key to Unlock:</b>
        <Radio.Group
          onChange={(e) => {
            setSelectedSaltKey(
              keys.filter((l) => l.keySalt === e.target.value)[0]
            );
          }}
          value={selectedSaltKey && selectedSaltKey.keySalt}
        >
          {!!selectedLocked &&
            keys
              .filter(
                (e) =>
                  selectedLocked.availablePass.findIndex(
                    (j) => j.keySalt === e.keySalt
                  ) > -1
              )
              .map((e) => (
                <Radio key={e.keySalt} value={e.keySalt}>
                  <BoldTime time={e.id} />
                </Radio>
              ))}
        </Radio.Group>
        <b>Enter the shared code:</b>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ whiteSpace: "nowrap", margin: "4px" }}>Code:</span>
          <Input
            placeholder="6 numbers or letters like A0A0A0"
            value={shareCode}
            onChange={(e) =>
              setShareCode(
                ((e.target.value || "").match(/[a-zA-Z0-9]+/) || [""])[0]
                  .toUpperCase()
                  .trim()
                  .substring(0, 6)
              )
            }
          />
        </div>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ whiteSpace: "nowrap", margin: "4px" }}>Time:</span>
          <Input
            placeholder="4 numbers like 1234"
            value={timeCode}
            onChange={(e) =>
              setTimeCode(
                ((e.target.value || "").match(/[0-9]+/) || [""])[0]
                  .toUpperCase()
                  .trim()
                  .substring(0, 4)
              )
            }
          />
        </div>
        <AlertList listName={ALERT_LIST_NAME} />
        <Button
          disabled={
            !selectedLocked ||
            !selectedSaltKey ||
            shareCode.length !== 6 ||
            timeCode.length !== 4
          }
          type="primary"
          onClick={() =>
            startUnlockWithSharedCode(
              selectedLocked,
              selectedSaltKey,
              shareCode,
              timeCode
            )
          }
        >
          Add to unlock queue!
        </Button>
      </Space>
    </>
  );
}
