import * as React from "react";

import { Space } from "antd";

import { AlertList, AddToAlertList } from "./AlertList";

import { fetchCreateTemp } from "../api/api-def";

import { useAppDispatch } from "../redux/store";
import { addTempInfo, KeyDef } from "../redux/main-slice";
import { KeyInput } from "./KeyInput";

export function StoreForTemp() {
  const dispath = useAppDispatch();
  //const temps = useAppSelector((s) => s.main.temps);
  const ALERT_LIST_NAME = "StoreForTemp";

  let startSaveTempProcess = (key: KeyDef) => {
    fetchCreateTemp(key.id, key.keyProof, key.keySalt)
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
              addTempInfo({
                from: result.data.from,
                tempproof: result.data.tempproof,
                salt: key.keySalt,
                token: key.id
              })
            );
            AddToAlertList(
              ALERT_LIST_NAME,
              "success",
              `Stored key ${key.id} for later!`
            );
          } catch (error) {
            AddToAlertList(
              ALERT_LIST_NAME,
              "error",
              `Error storing key for later: ${error}`
            );
          }
        }
      })
      .catch((e) =>
        AddToAlertList(ALERT_LIST_NAME, "error", `Error fetching: ${e}`)
      );

    return true;
  };

  return (
    <>
      <Space direction="vertical" style={{ width: "100%" }}>
        <b> Enter key info to store: </b>
        <KeyInput
          extraChecks={() => true}
          onSubmit={(key) => startSaveTempProcess(key)}
          buttonText="Remember it!"
        />
        <AlertList listName={ALERT_LIST_NAME} />
      </Space>
    </>
  );
}
