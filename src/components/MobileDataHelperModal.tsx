/* Need packages:
@types/qrcode.react
qrcode.react

@types/react-qr-reader
react-qr-reader

*/

/*
TODOS:
  disable based on READ WRITE operations
  disable - json operations - true by default
  disable local storage operation?
      maybe custom localStorage Store name (save data in diff spaces)
  copy -> More modal -> Copy all or copy by line (trimmed)
  qr costuome code
    how to add our logo and texts?
*/

import * as React from "react";
import {
  Button,
  Radio,
  Divider,
  Modal,
  Tag,
  message,
  Input,
  List,
  Empty
} from "antd";
import { MenuOutlined, DeleteOutlined } from "@ant-design/icons";
import renderEmpty from "antd/lib/config-provider/renderEmpty";

import * as QrReaderAll from "react-qr-reader";
import * as QRCodeALL from "qrcode.react";
const QrReader = QrReaderAll.default;
const QrCode = QRCodeALL.default;

interface SaveItem {
  name: string;
  date: number;
  value: string;
}

export function MobileDataHelperModal(props: {
  title: string;
  data: string;
  setData: (a: string) => void;
}) {
  const [qrReadOpen, setOpenQRRead] = React.useState(false);
  const [qrCodeOpen, setOpenQRCode] = React.useState(false);
  const [optionsOpen, setOpenOptions] = React.useState(false);

  const [saveOpen, setSaveOpen] = React.useState(false);
  const [saveName, setSaveName] = React.useState("");

  const [loadOpen, setLoadOpen] = React.useState(false);
  const [loadTempArr, setLoadTempArr] = React.useState<Array<SaveItem>>([]);

  const withClose = (callback: any) => {
    return () => {
      setOpenOptions(false);
      callback();
    };
  };

  const minify = () => {
    try {
      const j = JSON.parse(props.data);
      props.setData(JSON.stringify(j));
    } catch (error) {}
  };

  const beautify = () => {
    try {
      const j = JSON.parse(props.data);
      props.setData(JSON.stringify(j, null, 4));
    } catch (error) {}
  };

  const copy = () => {
    try {
      navigator.clipboard.writeText(props.data);
      message.info("Copy Complete");
    } catch (error) {
      message.error(`Copy error: ${error}`);
    }
  };

  const saveStorage = () => {
    const state: Array<SaveItem> = JSON.parse(
      localStorage.getItem("mySaves") || "[]"
    );
    state.push({
      name: saveName,
      value: props.data,
      date: Date.now()
    });
    localStorage.setItem("mySaves", JSON.stringify(state));
    message.info(`Item '${saveName}' Saved!`);
  };

  const share = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "[Share] " + props.title,
          text: props.data
        })
        .then(() => {})
        .catch((e) => message.error(`Error sharing: ${e}`));
    } else {
      message.warning("Sharing Unavailable");
    }
  };

  const openLoadStorage = () => {
    setLoadTempArr(JSON.parse(localStorage.getItem("mySaves") || "[]"));
    setLoadOpen(true);
  };

  const closeLoadStorage = () => {
    localStorage.setItem("mySaves", JSON.stringify(loadTempArr));
    setLoadTempArr([{ name: "Error if see this", date: 0, value: "Error" }]);
    setLoadOpen(false);
  };

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center"
      }}
    >
      <div style={{ margin: "auto" }}>
        <Divider>
          {props.title}&nbsp;&nbsp;
          <Button onClick={() => setOpenOptions(true)}>
            <MenuOutlined />
          </Button>
        </Divider>
        <textarea
          onChange={(e) => props.setData(e.target.value)}
          style={{
            margin: "8px",
            height: "200px",
            maxHeight: "200px",
            overflowY: "scroll",
            width: document.body.clientWidth * 0.9, // only onLoad
            backgroundColor: "tan"
          }}
          value={props.data}
        ></textarea>
        <Modal
          title={`[Options] ${props.title}`}
          visible={optionsOpen}
          onOk={() => setOpenOptions(false)}
          onCancel={() => {
            setOpenOptions(false);
          }}
        >
          <Button onClick={withClose(copy)}>✂ Copy</Button> &nbsp; &nbsp;
          <Button onClick={withClose(() => props.setData(""))}>
            ❌ Clear
          </Button>{" "}
          &nbsp; &nbsp;
          <Button onClick={withClose(share)}>📤 Share</Button>
          <br />
          <br />
          &nbsp; QR &nbsp;
          <Button onClick={withClose(() => setOpenQRRead(true))}>
            👀 Scan
          </Button>{" "}
          &nbsp; &nbsp;
          <Button onClick={withClose(() => setOpenQRCode(true))}>
            🎨 Generate
          </Button>
          <br />
          <br /> JSON &nbsp;
          <Button onClick={withClose(beautify)}>💅 Beautify</Button> &nbsp;
          &nbsp;
          <Button onClick={withClose(minify)}>🤏 Minify</Button>
          <br />
          <br /> Local Storage &nbsp;
          <Button
            onClick={withClose(() => {
              setSaveName("");
              setSaveOpen(true);
            })}
          >
            💾 Save
          </Button>{" "}
          &nbsp; &nbsp;
          <Button onClick={withClose(openLoadStorage)}>📂 Load</Button>
        </Modal>
        <Modal
          visible={qrCodeOpen}
          onOk={() => setOpenQRCode(false)}
          onCancel={() => {
            setOpenQRCode(false);
          }}
          width={document.body.clientWidth * 0.9}
        >
          Save QR <br />
          {qrCodeOpen ? (
            <div style={{ display: "block", textAlign: "center" }}>
              <QrCode
                value={props.data}
                size={document.body.clientWidth * 0.85}
              />
            </div>
          ) : (
            <></>
          )}
        </Modal>
        <Modal
          visible={qrReadOpen}
          onOk={() => setOpenQRRead(false)}
          onCancel={() => {
            props.setData("[CANCELED]");
            setOpenQRRead(false);
          }}
        >
          Read QR <br />
          {qrReadOpen ? (
            <QrReader
              delay={100}
              onError={(err) => {
                props.setData(`[ERROR] ${err}`);
                setOpenQRRead(false);
              }}
              onScan={(data) => {
                // Called for each Instance
                if (data && qrReadOpen) {
                  // "&& qrReadOpen" => Check if our instance
                  props.setData(`${data}`);
                  setOpenQRRead(false);
                }
              }}
              facingMode={"environment"}
            />
          ) : (
            <></>
          )}
        </Modal>
        <Modal
          title={"Save to local storage"}
          visible={saveOpen}
          onOk={() => {
            saveStorage();
            setSaveOpen(false);
          }}
          onCancel={() => {
            setSaveOpen(false);
          }}
        >
          Please enter entry name: <br />
          Data Created: <b>{new Date().toString()}</b> <br />
          <Input
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
          ></Input>
        </Modal>
        <Modal
          title={"Load from local storage"}
          visible={loadOpen}
          onCancel={closeLoadStorage} // X toolbar button
          footer={<Button onClick={closeLoadStorage}>Cancel</Button>}
        >
          <List style={{ maxHeight: "50vh", overflowY: "scroll" }}>
            {!!loadTempArr && loadTempArr.length > 0 ? (
              loadTempArr.map((e, i) => {
                return (
                  <List.Item key={i}>
                    Name: {e.name} <br />
                    Date: <b>{new Date(e.date).toString()}</b> <br />
                    <Button
                      onClick={() => {
                        props.setData(e.value);
                        closeLoadStorage();
                      }}
                    >
                      Use This
                    </Button>
                    <Button
                      danger
                      style={{ float: "right" }}
                      onClick={() => {
                        loadTempArr.splice(i, 1);
                        setLoadTempArr([].concat(loadTempArr));
                      }}
                    >
                      <DeleteOutlined />
                    </Button>
                  </List.Item>
                );
              })
            ) : (
              <Empty />
            )}
          </List>
        </Modal>
      </div>
    </div>
  );
}
