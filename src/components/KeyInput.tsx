import * as React from "react";

import { Button, Modal, Input, Alert, Space } from "antd";

import { CopyOutlined, QrcodeOutlined } from "@ant-design/icons";

import { KeyDef } from "../redux/main-slice";

import * as QrReaderAll from "react-qr-reader";
const QrReader = QrReaderAll.default;

const { TextArea } = Input;

function trimf(t: string | null) {
  if (!t) return "";
  return t.trim();
}

type modalAlertMsg = {
  type: "success" | "info" | "warning" | "error";
  msg: string;
};

export function KeyInput(props: {
  onSubmit: (key: KeyDef) => boolean;
  buttonText: string;
  extraChecks?: () => boolean;
}) {
  const [id, setId] = React.useState("");
  const [salt, setSalt] = React.useState("");
  const [proof, setProof] = React.useState("");

  const [pasteVisible, setPasteVisible] = React.useState(false);
  const [pasteData, setPasteData] = React.useState("");

  const [qrVisible, setQrVisible] = React.useState(false);
  const [qrData, setQrData] = React.useState("");

  const modalMsgs: {
    [key: string]: modalAlertMsg;
  } = {
    paste: { type: "info", msg: "Please paste info" },
    scan: { type: "info", msg: "Please scan a QR" },
    valid: { type: "success", msg: "Structure is valid! " },
    error: { type: "error", msg: "Error: %" }
  };

  const [pasteValidMsg, setPasteValidMsg] = React.useState(modalMsgs.paste);
  const [qrValidMsg, setQrValidMsg] = React.useState(modalMsgs.scan);

  const errorValidMsg = (text: string): modalAlertMsg => ({
    type: "error",
    msg: modalMsgs.error.msg.replace("%", text)
  });

  const validateKeyObj = (
    data: string,
    infoMsg: modalAlertMsg,
    callback: React.Dispatch<React.SetStateAction<modalAlertMsg>>
  ) => {
    if (!data || data === "") {
      callback(infoMsg);
    } else {
      try {
        let obj = JSON.parse(data) as KeyDef;
        if (typeof obj !== "object") {
          callback(errorValidMsg("Can't find an object"));
        } else {
          if (!obj.id) {
            callback(errorValidMsg("Can't find key.id"));
          } else if (!obj.keyProof) {
            callback(errorValidMsg("Can't find key.keyProof"));
          } else if (!obj.keySalt) {
            callback(errorValidMsg("Can't find key.keySalt"));
          } else {
            callback(modalMsgs.valid);
          }
        }
      } catch (error) {
        callback(errorValidMsg(`${error}`));
      }
    }
  };

  const clearPasteModal = () => {
    setPasteData("");
    setPasteVisible(false);
    setPasteValidMsg(modalMsgs.paste);
  };

  const [qrKey, setQrKey] = React.useState(0);

  const clearQrModal = () => {
    setQrKey(qrKey + 1);
    setQrData("");
    setQrVisible(false);
    setQrValidMsg(modalMsgs.scan);
  };

  const clearInputs = () => {
    setId("");
    setSalt("");
    setProof("");
  };

  // {"id":"0d 0hr 4min","keySalt":"salt_16248_229_82391","keyProof":"token_9e16e_1575d_66456"}

  return (
    <>
      <Space direction="vertical" style={{ width: "100%" }}>
        <div style={{ border: "1px blue solid" }}>
          <div
            style={{
              //marginTop: "-10px",
              marginLeft: "5px",
              textAlign: "center"
            }}
          >
            <span style={{ padding: "2px" }}>
              <b>Quick fill with:</b>
            </span>
          </div>{" "}
          <div
            style={{
              display: "flex",
              //marginTop: "-25px",
              flexDirection: "row",
              justifyContent: "center"
            }}
          >
            <Button
              style={{
                padding: "20px",
                margin: "10px",
                whiteSpace: "normal",
                height: "auto"
              }}
              onClick={() => setQrVisible(true)}
            >
              <QrcodeOutlined
                style={{ fontSize: "64px", color: "rgb(29 98 255)" }}
              />{" "}
              <br />
              QR Code
            </Button>
            <Button
              style={{
                padding: "20px",
                margin: "10px",
                whiteSpace: "normal",
                height: "auto"
              }}
              onClick={() => setPasteVisible(true)}
            >
              <CopyOutlined
                style={{ fontSize: "64px", color: "rgb(29 98 255)" }}
              />{" "}
              <br />
              From Copy
            </Button>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ whiteSpace: "nowrap", margin: "4px" }}>Name:</span>
          <Input
            placeholder="like 0d 0hr 4min"
            value={id}
            onChange={(e) => setId(trimf(e.target.value))}
          />
        </div>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ whiteSpace: "nowrap", margin: "4px" }}>
            Random (salt):
          </span>
          <Input
            placeholder="like salt_162...."
            value={salt}
            onChange={(e) => setSalt(trimf(e.target.value))}
          />
        </div>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ whiteSpace: "nowrap", margin: "4px" }}>
            Proof (token):
          </span>
          <Input
            placeholder="like token_91e...."
            type="password"
            value={proof}
            onChange={(e) => setProof(trimf(e.target.value))}
          />
        </div>
        <div>
          <Button danger onClick={() => clearInputs()}>
            Clear
          </Button>
          <Button
            style={{ float: "right" }}
            type="primary"
            disabled={
              !id ||
              !proof ||
              !salt ||
              !(props.extraChecks ? props.extraChecks() : true)
            }
            onClick={() => {
              let key: KeyDef = {
                id: id,
                keySalt: salt,
                keyProof: proof
              };
              if (props.onSubmit) {
                if (props.onSubmit(key)) {
                  clearInputs();
                }
              }
            }}
          >
            {props.buttonText}
          </Button>
        </div>
      </Space>
      <Modal
        title={"Paste key info"}
        visible={pasteVisible}
        okText="Quick fill!"
        okButtonProps={{ disabled: pasteValidMsg.type !== "success" }}
        onOk={() => {
          let key: KeyDef = JSON.parse(pasteData);
          setId(key.id);
          setProof(key.keyProof);
          setSalt(key.keySalt);
          clearPasteModal();
        }}
        onCancel={() => {
          setPasteVisible(false);
          clearPasteModal();
        }}
        closable={false}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%"
          }}
        >
          <Alert message={pasteValidMsg.msg} type={pasteValidMsg.type} />
          <TextArea
            value={pasteData}
            onChange={(e) => {
              setPasteData(e.target.value);
              validateKeyObj(e.target.value, modalMsgs.paste, setPasteValidMsg);
            }}
            style={{ height: "100%", marginTop: "10px" }}
          />
        </div>
      </Modal>
      <Modal
        key={qrKey /*This fixes the busy camera after model closing*/}
        title={"Load key from QR"}
        visible={qrVisible}
        okText="Quick fill!"
        okButtonProps={{ disabled: qrValidMsg.type !== "success" }}
        onOk={() => {
          let key: KeyDef = JSON.parse(qrData);
          setId(key.id);
          setProof(key.keyProof);
          setSalt(key.keySalt);
          clearQrModal();
        }}
        onCancel={() => {
          setQrVisible(false);
          clearQrModal();
        }}
        closable={false}
      >
        {" "}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%"
          }}
        >
          <Alert
            style={{ marginBottom: "10px" }}
            message={qrValidMsg.msg}
            type={qrValidMsg.type}
          />
          {qrVisible ? (
            <QrReader
              delay={100}
              onError={(err) => {
                setQrData("");
                setQrValidMsg(errorValidMsg(`${err}`));
              }}
              onScan={(data) => {
                // Called for each Instance
                if (data && qrVisible) {
                  // "&& qrReadOpen" => Check if our instance
                  validateKeyObj(data, modalMsgs.scan, setQrValidMsg);
                  setQrData(data);
                }
              }}
              facingMode={"environment"}
            />
          ) : (
            <></>
          )}
        </div>
      </Modal>
    </>
  );
}
