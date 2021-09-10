import * as React from "react";
import "./styles.css";
import "antd/dist/antd.css";

import { logo } from "./img/logo";
import keysvg from "./img/key.svg";

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
  TimePicker,
  Empty
} from "antd";

import {
  CaretUpOutlined,
  CheckOutlined,
  CopyOutlined,
  DeleteOutlined,
  QrcodeOutlined,
  SmileFilled,
  SmileOutlined
} from "@ant-design/icons";

import * as encryptor from "simple-encryptor";

import { setTheme, getTheme, ToggleDarkMode } from "./layout/darkmode";

import { CreateNewKeys } from "./components/CreateNewKeys";
import { AddLockData } from "./components/AddLockData";
import { ShareForgetKeys } from "./components/ShareOrForget";
import { MobileDataHelperModal } from "./components/MobileDataHelperModal";
import { AlertType, ResultAlert } from "./components/ResultAlert";
import { StartUnlock } from "./components/StartUnlock";
import { DebugData } from "./components/DebugData";
import { AvailableData } from "./components/AvailData";
import { KeyInput } from "./components/KeyInput";

import throttle from "lodash/throttle";

import {
  fetchNewGroup,
  Group,
  fetchEncPass,
  fetchStartUnlock,
  fetchFinishUnlock
} from "./api/api-def";

import { Provider } from "react-redux";
import { store, useAppDispatch, useAppSelector } from "./redux/store";
import {
  addKey,
  addUnLockedData,
  delKey,
  delLockedData,
  delUnLockedData,
  KeyDef,
  LockedDataDef,
  UnlockDef,
  clearAll
} from "./redux/main-slice";

import { default as prettyms } from "pretty-ms";

import * as QrReaderAll from "react-qr-reader";
import * as QRCodeALL from "qrcode.react";
const QrReader = QrReaderAll.default;
const QrCode = QRCodeALL.default;

const { TextArea } = Input;
const { Option } = Select;
const { Panel } = Collapse;
const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Step } = Steps;

/*
Unlocked data :
  (never save unlocked local)
  If open, click to Read Data (copy per line)
  timer until unlocking and then locked again 

Decrypt with token -> read salt,token, and show matched encrypted data that can be decrypted

Add data -> Choose token  (Group->token = salt->token)
  Or from camera

Add tokens-> name group  -> Save group,salt,[tokens]
Share\Copy Tokens \ QR images

Forget tokens -> only token! not salt+name, salt is needed to dec

Group, Delayed Key(s),  Locked Data, Available Data


Later:
- 2fa tool to show on link enter (with temporal redirect to avoid bookmark?)
- add warning about making locks for long time and that you waver all responsibolity
- warning about trying to open first before using locks
    closeable only (no save in localStorage)
- export\import unlocked data with share 1 min link\8 num code
    from mobile to pc, and not native copy paste
- google ads?
cloudflare pages?

https://usexd.sse.codesandbox.io/redirect?url=https://0nek1.csb.app/



20 * log(256)/log(20000*10) = 9.085 (10 words with ending 1...10)
*/

export function ImportKeys() {
  const dispatch = useAppDispatch();
  const keys = useAppSelector((s) => s.main.keys);

  const [msg, setMsg] = React.useState("");

  const callback = (final: KeyDef) => {
    let existLength = keys.filter(
      (k) => k.id === final.id && k.keyProof === final.keyProof
    ).length;
    if (existLength === 0) {
      dispatch(addKey(final));
      setMsg("");
      return true;
    } else {
      setMsg(`Key '${final.id}' already exists`);
      return false;
    }
  };
  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <KeyInput onSubmit={callback} buttonText="Import !" />
      {!!msg && <Alert type="warning" message={msg} />}
    </Space>
  );
}

export function ManageData() {
  const dispatch = useAppDispatch();
  const locked = useAppSelector((s) => s.main.lockedData);
  const [dataName, setDataName] = React.useState("");

  const deleteSelected = () => {
    dispatch(delLockedData(dataName));
    setDataName("");
  };

  return (
    <>
      <Space direction="vertical">
        <Radio.Group
          onChange={(e) => {
            setDataName(e.target.value);
          }}
          value={dataName}
        >
          {locked.map((l) => (
            <Radio key={l.desc} value={l.desc}>
              {l.desc}
            </Radio>
          ))}
        </Radio.Group>
        <Divider />
        <Button danger disabled={!dataName} onClick={() => deleteSelected()}>
          <DeleteOutlined /> Delete selected data
        </Button>
      </Space>
    </>
  );
}

// ==================================================
// ===========    MAIN CODE                 =========
// ==================================================

export function ClearAll(props: { style?: React.CSSProperties }) {
  const dispatch = useAppDispatch();
  return (
    <Button
      style={props.style}
      danger
      type="link"
      onClick={() => {
        dispatch(clearAll(""));
      }}
    >
      Clear All Data
    </Button>
  );
}

export default function App() {
  const [showDebug, setShowDebug] = React.useState(false);

  const [scrollTimeout, setScrollTimeout] = React.useState(0);
  const onCollapse = (e: Element) => {
    clearTimeout(scrollTimeout);
    setScrollTimeout(
      (setTimeout(() => {
        (e as HTMLElement).scrollIntoView({
          block: "start",
          behavior: "smooth"
        });
      }, 450) as unknown) as number
    );
  };

  React.useEffect(() => {
    const throttleFunc = throttle((e) => onCollapse(e), 1000);

    document.querySelectorAll(".ant-collapse-header").forEach((e) =>
      e.addEventListener("click", (h) => {
        throttleFunc(e);
      })
    );

    return () => {
      document.querySelectorAll(".ant-collapse-header").forEach((e) =>
        e.removeEventListener("click", (h) => {
          throttleFunc(e);
        })
      );
    };
  }, []);

  return (
    <Provider store={store}>
      <div>
        <div style={{ display: "block", textAlign: "center" }}>
          <img src={logo} style={{ width: "100%", padding: "10px" }} /> <br />
          <ToggleDarkMode />
        </div>
        <>
          <Divider>
            <Title level={2}> ⚔ Everyday use:</Title>{" "}
          </Divider>
          <Collapse accordion defaultActiveKey="1">
            <Panel header="Available Data" key="1">
              <AvailableData />
            </Panel>
            <Panel header="Unlock data with a delayed key" key="2">
              <StartUnlock />
            </Panel>
            <Panel header="Lock new data" key="4">
              <AddLockData />
            </Panel>
          </Collapse>
          <br />
          <Divider>
            {" "}
            <Title level={2}> 1️⃣ Once in a while:</Title>{" "}
          </Divider>
          <Collapse accordion>
            <Panel header="Manage saved locked data" key="1">
              <ManageData />
            </Panel>
            <Panel header="Manage Keys (Export & Forget)" key="5">
              <ShareForgetKeys />
            </Panel>
            <Panel header="Import Keys" key="6">
              <ImportKeys />
            </Panel>
            <Panel header="Create new delayed keys" key="7">
              <CreateNewKeys />
            </Panel>
          </Collapse>
          {showDebug && (
            <>
              <br />
              <Divider>
                {" "}
                <Title level={2}> 🔌 Debug</Title>{" "}
              </Divider>
              <Collapse defaultActiveKey="3">
                <Panel header="Debug Data" key="3">
                  <DebugData />
                  <ClearAll />
                </Panel>
              </Collapse>
            </>
          )}
        </>
        <Divider />
        <div style={{ textAlign: "center" }}>
          Provided with no cost, thanks to Vercel.com + CodeSandbox.io 💘 <br />
          Copyright 2021 (c) timelock.my123.app (c) 123timelock <br />
          <Button type="link" onClick={() => setShowDebug((old) => !old)}>
            Toggle Debug
          </Button>{" "}
        </div>
      </div>
    </Provider>
  );
}
