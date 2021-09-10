import * as React from "react";
import { DeleteOutlined } from "@ant-design/icons";

import { removeDup, removeIndInxState } from "../utils/utils";

import { useAppDispatch, useAppSelector } from "../redux/store";
import { addKey } from "../redux/main-slice";

import { Button, Space } from "antd";
import { fetchNewGroup } from "../api/api-def";

import { AlertType, ResultAlert } from "./ResultAlert";
import { minOffsetArr, TimeDelayShowAndEdit } from "./TimeDelayShowAndEdit";

const timesToStrings = (items: Array<minOffsetArr>) => {
  // works because parse-duration on server
  return items.map((e) => `${e[0]}d ${e[1]}hr ${e[2]}min`);
};

export function CreateNewKeys() {
  const dispath = useAppDispatch();
  const groups = useAppSelector((s) => s.main.keys);

  const [times, setTimes] = React.useState([] as Array<minOffsetArr>);
  const [alertList, setAlertList] = React.useState(
    [] as Array<[AlertType, string]>
  );

  // Local variables will get reset every render upon mutation whereas state will update
  const [clearOldTimeout, setClearOldTimeout] = React.useState(-1);

  const updateTime = (index: number, value: minOffsetArr) => {
    setTimes((old) => {
      let arr = [...old];
      arr[index] = value;
      return arr;
    });
  };

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

  const startNewKeyProcess = () => {
    const timeStrings = removeDup(timesToStrings(times));

    let existing = timeStrings.filter(
      (t) => groups.filter((g) => g.id === t).length > 0
    );

    if (existing.length > 0) {
      addAlert("info", `Key ${existing[0]} already exists!`);
      return;
    }

    fetchNewGroup(timeStrings)
      .then((result) => {
        if (!!result.err) {
          addAlert("error", `${result.err || "<empty error>"}`);
          return;
        } else {
          //addGroup(name, result.data.salt, result.data.tokens);
          //message.success(`"${name}" was added!`);

          result.data.tokens.forEach((t) => {
            dispath(addKey({ id: t.name, keySalt: t.salt, keyProof: t.proof }));
          });

          addAlert(
            "success",
            `Added ${result.data.tokens.length} tokens sucessfully!`
          );
        }
      })
      .catch((e) => {
        addAlert("error", `Error fetching: ${e}`);
      });
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <span> Choose the delay each key will have: </span>
      <ul>
        {times.map((e, i) => (
          <li key={i} style={{ margin: "1.5em 0px" }}>
            <Button
              danger
              onClick={() => {
                removeIndInxState(i, setTimes);
              }}
            >
              <DeleteOutlined />
            </Button>
            &nbsp;
            <TimeDelayShowAndEdit
              key={i}
              value={e}
              onChange={(newvalue) => {
                updateTime(i, newvalue);
              }}
            />
            &nbsp;
          </li>
        ))}
      </ul>

      <div>
        <Space direction="vertical" style={{ width: "100%" }}>
          {alertList.map((e) => (
            <ResultAlert key={JSON.stringify(e)} type={e[0]} msg={e[1]} />
          ))}
        </Space>
      </div>
      <div>
        <Button onClick={() => setTimes((old) => [...old, [0, 0, 1]])}>
          1. Add delayed time
        </Button>
        &nbsp;
        <Button
          style={{ float: "right" }}
          type="primary"
          disabled={times.length === 0}
          onClick={() => {
            startNewKeyProcess();
          }}
        >
          2. Create !
        </Button>
      </div>
    </Space>
  );
}
