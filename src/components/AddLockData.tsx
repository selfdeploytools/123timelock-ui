import * as React from "react";
import * as encryptor from "simple-encryptor";
import { Alert, Button, Checkbox, Input, Space } from "antd";

import { uuidv4 } from "../utils/utils";
import { Group, fetchEncPass } from "../api/api-def";

import { AlertType, ResultAlert } from "./ResultAlert";
import { MobileDataHelperModal } from "../components/MobileDataHelperModal";

import { addLockedData, KeyDef } from "../redux/main-slice";
import { useAppDispatch, useAppSelector } from "../redux/store";
import { BoldTime } from "./BoldTime";

const { TextArea } = Input;

export function AddLockData() {
  const dispath = useAppDispatch();
  const keys = useAppSelector((s) => s.main.keys);
  const locked = useAppSelector((s) => s.main.lockedData);

  const [alertList, setAlertList] = React.useState(
    [] as Array<[AlertType, string]>
  );

  const [selectedKeysSalt, setSelectedKeysSalt] = React.useState(
    [] as string[]
  );
  const [data, setData] = React.useState("");
  const [name, setName] = React.useState("");

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

  let key2value = (k: KeyDef) => k.keySalt + "|" + k.id;
  let value2salt = (v: string) => v.split("|")[0];

  const startLockDataProcess = () => {
    if (locked.filter((e) => e.desc === name).length > 0) {
      addAlert("info", `Entry with '${name}' already exist!`);
      return;
    }
    let randomPass = uuidv4();
    fetchEncPass(
      selectedKeysSalt.map((e) => value2salt(e)),
      randomPass
    )
      .then((result) => {
        if (!!result.err) {
          addAlert("error", `${result.err || "<empty error>"}`);
          return;
        } else {
          try {
            const dataEncrypted = encryptor
              .createEncryptor(randomPass)
              .encrypt(data);

            if (
              !result ||
              !result.data ||
              !result.data.enckey ||
              result.data.enckey.length !== selectedKeysSalt.length
            ) {
              addAlert("error", "Can't read encryption result");
            } else {
              dispath(
                addLockedData({
                  desc: name,
                  encData: dataEncrypted,
                  availablePass: selectedKeysSalt.map((salt, i) => ({
                    encPass: result.data.enckey[i],
                    keySalt: value2salt(salt)
                  }))
                })
              );
              // clear data of this
              setData("");
              setName("");

              addAlert(
                "success",
                `Data was saved sucessfully! (${result.data.enckey.length} keys)`
              );
            }
            //result.data.enckey
          } catch (error) {
            addAlert("error", `Error encrypting: '${error}'`);
          }
        }
      })
      .catch((e) => {
        addAlert("error", `Error fetching: ${e}`);
      });
  };

  return (
    <>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Alert
          message="Reminder"
          description={
            <i>
              Always save a copy of the original in a safe place. All data is
              saved purely on the device and can be deleted <b>unexpectedly </b>{" "}
              by the browser.
            </i>
          }
          type="warning"
          showIcon
          closable
        />
        <span>
          <b>1. </b> Choose what keys can be used:{" "}
        </span>
        <Space>
          <Button
            onClick={() =>
              setSelectedKeysSalt([...keys].map((e) => key2value(e)))
            }
          >
            Select all
          </Button>
          <Button onClick={() => setSelectedKeysSalt([])}>De-select all</Button>
        </Space>
        <Checkbox.Group
          options={keys.map((k) => ({
            label: <BoldTime time={k.id} />,
            value: key2value(k)
          }))}
          value={selectedKeysSalt}
          onChange={(values) => {
            console.log(values);
            setSelectedKeysSalt(values as string[]);
          }}
        />
        <span>
          <b>2. </b> Enter data here (you can copy row by row later):
        </span>
        <TextArea
          dir="auto"
          style={{ height: "30vh", resize: "none" }}
          disabled={selectedKeysSalt.length === 0}
          value={data}
          onChange={(e) => {
            setData(e.target.value);
          }}
          dir="auto"
        />
        <span>
          <b>3.</b> Enter a nickname for this data:{" "}
        </span>
        <Input
          dir="auto"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {alertList.map((e) => (
          <ResultAlert key={JSON.stringify(e)} type={e[0]} msg={e[1]} />
        ))}
        <Button
          type="primary"
          disabled={selectedKeysSalt.length === 0 || !data || !name}
          onClick={() => {
            startLockDataProcess();
          }}
        >
          4. Add encrypted data
        </Button>
      </Space>
    </>
  );
}
