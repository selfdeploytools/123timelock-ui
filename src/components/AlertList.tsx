import * as React from "react";

import { Space } from "antd";

import { AlertType, ResultAlert } from "./ResultAlert";

export function AddToAlertList(listName: string, type: AlertType, msg: string) {
  document.dispatchEvent(
    new CustomEvent("alert-list-" + listName, { detail: { type, msg } })
  );
}

export function AlertList(props: { listName: string }) {
  const [alertList, setAlertList] = React.useState(
    [] as Array<[AlertType, string]>
  );
  // Local variables will get reset every render upon mutation whereas state will update
  const [clearOldTimeout, setClearOldTimeout] = React.useState(-1);

  const eventHandler = (e: CustomEvent<{ type: AlertType; msg: string }>) => {
    const { type, msg } = e.detail;
    addAlert(type, msg);
  };

  const addAlert = (type: AlertType, msg: string) => {
    setAlertList((old) => [[type, msg], ...old]);
    resetClearTimeout();
  };

  const resetClearTimeout = () => {
    if (clearOldTimeout > -1) {
      clearTimeout(clearOldTimeout);
    }
    setClearOldTimeout(
      setTimeout(() => setAlertList([]), 5 * 1000) as unknown as number
    );
  };

  React.useEffect(() => {
    document.addEventListener("alert-list-" + props.listName, eventHandler);

    return function cleanup() {
      document.removeEventListener(
        "alert-list-" + props.listName,
        eventHandler
      );
    };
  }, []);

  return (
    <div>
      <Space direction="vertical" style={{ width: "100%", margin: "2px" }}>
        {alertList.map((e) => (
          <ResultAlert key={JSON.stringify(e)} type={e[0]} msg={e[1]} />
        ))}
      </Space>
    </div>
  );
}
