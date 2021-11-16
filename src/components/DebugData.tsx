import * as React from "react";

import {
  Avatar,
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
  TimePicker
} from "antd";

import { useAppDispatch, useAppSelector } from "../redux/store";
import {
  addKey,
  delKey,
  delLockedData,
  delUnLockedData
} from "../redux/main-slice";

export function DebugData() {
  const dispatch = useAppDispatch();
  const keys = useAppSelector((state) => state.main.keys);
  const locked = useAppSelector((state) => state.main.lockedData);
  const unlocks = useAppSelector((state) => state.main.unlocks);
  const temps = useAppSelector((state) => state.main.temps);

  const [url, setUrl] = React.useState(
    localStorage.getItem("SERVER_URL") || "<default>"
  );

  const addKey_ = (name: string) => {
    dispatch(
      addKey({
        id: "key" + Math.random(),
        keySalt: Math.random() + "_" + Math.random(),
        keyProof: Math.random() + "_" + Math.random()
      })
    );
  };

  return (
    <>
      <Button onClick={() => addKey_("")}>Add Key</Button>
      <ul>
        <u>Keys</u>
        {keys.map((e) => (
          <li key={e.id}>
            {e.id} <Button onClick={() => dispatch(delKey(e.id))}>Del</Button>{" "}
            <br />
            salt: {e.keySalt}
            <br />
            proof: {e.keyProof}
          </li>
        ))}
      </ul>
      <ul>
        <u>Locked</u>

        {locked.map((e) => (
          <li key={e.desc + e.encData + e.availablePass.length}>
            {e.desc} ({e.availablePass.length} keys){" "}
            <Button onClick={() => dispatch(delLockedData(e.desc))}>Del</Button>{" "}
            <ul>
              {e.availablePass.map((k, i) => (
                <>
                  <li key={i}>
                    {k.keySalt}, pass len: {k.encPass.length}
                  </li>
                </>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <ul>
        <u>Unlocks</u>

        {unlocks.map((e) => (
          <li key={e.unlockProof}>
            {e.desc}: {e.from} - {e.to}
            <Button
              onClick={() => dispatch(delUnLockedData(e.keySalt, e.from, e.to))}
            >
              Del
            </Button>{" "}
          </li>
        ))}
      </ul>
      <ul>
        <u>Temps</u>

        {temps.map((e) => (
          <li key={e.tempproof}>
            {e.token}: {e.from} - {e.tempproof}
          </li>
        ))}
      </ul>
      <p>
        Change API URL:{" "}
        <Input value={url} onChange={(e) => setUrl(e.target.value)} />{" "}
        <Button
          onClick={() => {
            localStorage.setItem("SERVER_URL", url);
            window.location.reload();
          }}
        >
          Change!
        </Button>
      </p>
    </>
  );
}
