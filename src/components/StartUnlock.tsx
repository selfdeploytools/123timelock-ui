import * as React from "react";

import {
  Button,
  Divider,
  Modal,
  Radio,
  Input,
  List,
  message,
  Alert,
  Steps,
  Typography,
  Space,
  DatePicker,
  Collapse,
  Tag,
  Select,
  TimePicker,
  InputNumber
} from "antd";

import { AlertType, ResultAlert } from "../components/ResultAlert";

import { fetchStartUnlock } from "../api/api-def";

import { useAppDispatch, useAppSelector } from "../redux/store";
import { addUnLockedData, KeyDef, LockedDataDef } from "../redux/main-slice";
import { KeyInput } from "./KeyInput";

const { Option } = Select;

export function StartUnlock() {
  const dispath = useAppDispatch();
  const keys = useAppSelector((s) => s.main.keys);
  const locked = useAppSelector((s) => s.main.lockedData);

  const [alertList, setAlertList] = React.useState(
    [] as Array<[AlertType, string]>
  );
  // Local variables will get reset every render upon mutation whereas state will update
  const [clearOldTimeout, setClearOldTimeout] = React.useState(-1);

  const resetClearTimeout = () => {
    if (clearOldTimeout > -1) {
      clearTimeout(clearOldTimeout);
    }
    setClearOldTimeout(setTimeout(() => setAlertList([]), 5 * 1000));
  };

  const addAlert = (type: AlertType, msg: string) => {
    setAlertList((old) => [[type, msg], ...old]);
    resetClearTimeout();
  };

  /* const [keyId, setKeyId] = React.useState("");
  const [keyProof, setKeyProof] = React.useState(""); */

  const [sLocked, setSLocked] = React.useState({
    desc: "",
    encData: "",
    availablePass: []
  } as LockedDataDef);

  const [offset, setOffset] = React.useState(0);

  let startUnlockProcess = (cbKey: KeyDef) => {
    let key = keys.filter((k) => k.id === cbKey.id)[0];
    let encPass = sLocked.availablePass.filter(
      (e) => e.keySalt === key.keySalt
    )[0].encPass;
    fetchStartUnlock(encPass, key.keySalt, key.id, cbKey.keyProof, offset)
      .then((result) => {
        if (!!result.err) {
          addAlert("error", `${result.err || "<empty error>"}`);
          return;
        } else {
          try {
            dispath(
              addUnLockedData({
                desc: sLocked.desc,
                encData: sLocked.encData,
                encPass: encPass,

                keySalt: key.keySalt,
                keyID: key.id,

                from: result.data.from,
                to: result.data.to,

                unlockProof: result.data.proof
              })
            );
            addAlert(
              "success",
              `Data "${sLocked.desc}" is now in unlock queue!`
            );
            setOffset(0);
          } catch (error) {}
        }
      })
      .catch((e) => {
        addAlert("error", `Error fetching: ${e}`);
      });
    return true;
  };

  return (
    <>
      <Space direction="vertical" style={{ width: "100%" }}>
        <b> Choose the data to unlock: </b>
        <div>
          <Radio.Group
            onChange={(e) => {
              setSLocked(locked.filter((l) => l.desc === e.target.value)[0]);
            }}
            value={sLocked && sLocked.desc}
          >
            {locked.map((l) => (
              <Radio key={l.desc} value={l.desc}>
                {l.desc}
              </Radio>
            ))}
          </Radio.Group>
        </div>
        <span>
          <b> Add lock time, for schedule: (min)</b>
        </span>
        <InputNumber
          min={0}
          value={offset}
          onKeyUp={(e) => setOffset(parseInt(e.currentTarget.value, 10) || 0)}
          onChange={(e) => setOffset(parseInt(e, 10) || 0)}
        />
        <b> Enter key info to unlock: </b>
        <KeyInput
          extraChecks={() => !!sLocked.desc}
          onSubmit={startUnlockProcess}
          buttonText="Add to unlock queue!"
        />
        {alertList.map((e) => (
          <ResultAlert key={JSON.stringify(e)} type={e[0]} msg={e[1]} />
        ))}
      </Space>

      {/* 
      
       <div style={{ display: "grid", justifyItems: "center" }}>
          <Button
            disabled={!keyId || !keyProof || !sLocked.desc}
            type="primary"
            onClick={() => startUnlockProcess()}
          >
            Add to unlock queue!
          </Button>
        </div>
        
      <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ whiteSpace: "nowrap", margin: "4px" }}>
            Enter the key <b>ID</b> and <b>salt</b>:
          </span>
          <Select
            value={keyId}
            style={{ width: "50%" }}
            onChange={(e) => setKeyId(e)}
          >
            {sLocked &&
              keys
                .filter(
                  (k) =>
                    sLocked.availablePass.findIndex(
                      (p) => p.keySalt === k.keySalt
                    ) > -1
                )
                .map((k) => (
                  <Option value={k.id} key={k.id}>
                    {k.id}
                  </Option>
                ))}
          </Select>
        </div>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ whiteSpace: "nowrap", margin: "4px" }}>
            Enter token\proof:
          </span>
          <Input
            type="password"
            value={keyProof}
            onChange={(e) => setKeyProof(e.target.value)}
          />
        </div> */}

      {/*<b> When should we start counting down the time? </b>
        <Checkbox
          checked={startNow}
          onChange={(e) => setStartNow(e.target.checked)}
        >
          Now
        </Checkbox>
        <Space>
          <DatePicker
            disabled={startNow}
            disabledDate={(d) => {
              let disabled = d.toDate().getTime() < Date.now();
              if (disabled) {
                if (
                  d.toDate().toISOString().split("T")[0] ===
                  new Date().toISOString().split("T")[0]
                )
                  disabled = false;
              }
              return disabled;
            }}
          />
          <TimePicker
            disabled={startNow}
            disabledDate={(d) => d.toDate().getTime() < Date.now() + 60 * 1000}
          />
        </Space>
        <span>
          {"("} + The time delay from the key {")"}{" "}
        </span>
        <b> How long will the data be available after unlock (min)? </b>
        <Input value={60} />
        */}
    </>
  );
}
