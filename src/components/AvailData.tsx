import * as React from "react";

import { Button, Divider, Modal, Typography, Space } from "antd";

import { CheckOutlined, CopyOutlined, DeleteOutlined } from "@ant-design/icons";

import * as encryptor from "simple-encryptor";

import { AlertType, ResultAlert } from "../components/ResultAlert";

import { fetchFinishUnlock } from "../api/api-def";

import { useAppDispatch, useAppSelector } from "../redux/store";
import { delUnLockedData, UnlockDef } from "../redux/main-slice";

import { default as prettyms } from "pretty-ms";
import { CEmoji } from "./CEmoji";
const { Title, Text, Paragraph } = Typography;

export function SimpleEmpty() {
  return (
    <div style={{ width: "100%", textAlign: "center", color: "lightgray" }}>
      <b>- Empty - </b>
    </div>
  );
}

type simpleCB = () => void;
type AlertMessage = [AlertType, string];
type setReact = (alert: AlertMessage, data: string, deleteCB: simpleCB) => void;

const isLink = (e) => e.startsWith("http://") || e.startsWith("https://");
const isImage = (e) => e.startsWith("[img]") && e.endsWith("[/img]");

const redactCopy = (txt) => {
  // not really stopping anyone, just to avoid copy secret on mistake
  return txt.replace(/\[img\].*?\[\/img\]/g, "<IMAGE>");
};

export function TextEffects(props: { text: string }) {
  return (
    <>
      {props.text.split(" ").map((e, i) => {
        if (isLink(e)) {
          return (
            <a target="_blank" rel="noreferrer" href={e} key={e + i}>
              {e}{" "}
            </a>
          );
        } else if (isImage(e)) {
          let link = encodeURI(e.match(/\[img\](.*?)\[\/img\]/)[1]);
          if (!isLink(link)) {
            return <>Invalid Image link </>;
          }
          return (
            <img
              style={{ width: "100%" }}
              src={link}
              alt="Secret"
              key={e + i}
            />
          );
        } else {
          return <>{e} </>;
        }
      })}
    </>
  );
}

export function ShowOrDelete(props: {
  deleteOnly: boolean;
  unlocksArray: UnlockDef[];
  timeprefix: string;
  timecalc: (u: UnlockDef) => number;
  callback: (u: UnlockDef, setMsg: setReact) => void;
  btnType: "text" | "link" | "ghost" | "primary" | "default" | "dashed";
  btnDanger: boolean;
}) {
  const [deleteFunc, setDeleteFunc] = React.useState({ cb: () => {} });
  const [modalVisible, setModalVisible] = React.useState(false);
  const [alertMsg, setAlertMsg] = React.useState(["error", ""] as AlertMessage);
  const [modalData, setModalData] = React.useState("");

  const [closeTimeout, setCloseTimeout] = React.useState(-1);

  const customCallback = (
    alert: AlertMessage,
    data: string = "",
    deleteCB: simpleCB
  ) => {
    setDeleteFunc({ cb: deleteCB });
    if (data === "") {
      setModalData("");
      setAlertMsg(alert);
    } else {
      setModalData(data);
      setAlertMsg(["error", ""]);
    }

    setCloseTimeout(
      setTimeout(() => {
        setModalData("");
        setAlertMsg(["error", ""]);
        setModalVisible(false);
      }, 15 * 1000) as unknown as number
    );
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalData("");
    setModalVisible(false);
    if (closeTimeout > -1) clearTimeout(closeTimeout);
  };

  return (
    <>
      {/*-------- Data models ----------------*/}
      <Modal
        title={"Unlocked data"}
        visible={modalVisible}
        onOk={closeModal}
        onCancel={closeModal}
        closable={false}
      >
        <Space wrap={true} style={{ alignItems: "end" }}>
          <Button
            danger
            onClick={() => {
              if (deleteFunc.cb) {
                deleteFunc.cb();
                setModalData("");
                setAlertMsg(["error", ""]);
                setModalVisible(false);
              }
            }}
          >
            <DeleteOutlined /> Forget Unlock{" "}
          </Button>
          <Paragraph
            copyable={{
              icon: [
                <CopyOutlined style={{ fontSize: "2em" }} key="copy-icon" />,
                <CheckOutlined style={{ fontSize: "2em" }} key="copied-icon" />
              ],
              text: redactCopy(modalData + alertMsg[1])
            }}
          >
            Copy All Text
          </Paragraph>
        </Space>
        <Divider />
        {alertMsg[1].length > 0 && (
          <>
            <ResultAlert type={alertMsg[0]} msg={alertMsg[1]} />
            <br />
          </>
        )}
        {alertMsg[1].length === 0 && (
          <>
            {modalData
              .split("\n")
              .filter((e) => !!e)
              .map((l, i) => (
                <>
                  <div
                    dir="auto"
                    style={{
                      wordWrap: "normal",
                      display: "flex",
                      flexWrap: "wrap"
                    }}
                    key={l + i}
                  >
                    <TextEffects text={l} />

                    <Paragraph
                      copyable={{
                        text: redactCopy(l),
                        icon: [
                          <CopyOutlined
                            style={{ fontSize: "2em" }}
                            key="copy-icon"
                          />,
                          <CheckOutlined
                            style={{ fontSize: "2em" }}
                            key="copied-icon"
                          />
                        ]
                      }}
                    ></Paragraph>
                  </div>
                  <Divider key={l + i + "|1"} />
                </>
              ))}
          </>
        )}
      </Modal>
      {/*-------- Buttons ----------------*/}
      {props.unlocksArray.length > 0 ? (
        <Space wrap={true}>
          {props.unlocksArray.map((u, i) => (
            <Button
              type={props.btnType}
              danger={props.btnDanger}
              key={[i, u.desc].toString()}
              onClick={() => {
                props.callback(u, customCallback);
              }}
            >
              {" "}
              {props.btnDanger && <DeleteOutlined />}
              {u.desc}, <b> {props.timeprefix}: </b>{" "}
              {prettyms(props.timecalc(u), { secondsDecimalDigits: 0 })}
            </Button>
          ))}
        </Space>
      ) : (
        <SimpleEmpty />
      )}
    </>
  );
}

export function AvailableData() {
  const dispatch = useAppDispatch();
  const unlocks = useAppSelector((state) => state.main.unlocks);
  const [nowTime, setNowTime] = React.useState(Date.now());

  React.useEffect(() => {
    let id = setInterval(() => setNowTime(Date.now()), 2000);
    return () => {
      clearInterval(id);
    };
  }, []);

  const deleteUnlock = (u: UnlockDef) => {
    dispatch(delUnLockedData(u.keySalt, u.from, u.to));
  };

  const unlockFinishProcess = (u: UnlockDef, setAlert: setReact) => {
    const delCB = () => deleteUnlock(u);
    fetchFinishUnlock(u.encPass, u.from, u.to, u.keySalt, u.unlockProof)
      .then((result) => {
        if (!!result.err) {
          setAlert(["error", `${result.err || "<empty error>"}`], "", delCB);
          return;
        } else {
          try {
            let data = encryptor
              .createEncryptor(result.data.pass)
              .decrypt(u.encData);
            setAlert(null, data, delCB);
          } catch (error) {
            setAlert(["error", `Error decrypting: ${error}`], "", delCB);
          }
        }
      })
      .catch((e) => {
        setAlert(["error", `Error fetching: ${e}`], "", delCB);
      });
  };

  return (
    <>
      <Divider orientation="left">
        {" "}
        <Title level={4}>
          <CEmoji text="✅" /> Unlocked now
        </Title>
      </Divider>
      <ShowOrDelete
        unlocksArray={unlocks.filter((u) => u.from < nowTime && u.to > nowTime)}
        deleteOnly={false}
        timeprefix="left"
        timecalc={(u) => u.to - Date.now()}
        callback={(u, s) => unlockFinishProcess(u, s)}
        btnType={"primary"}
        btnDanger={false}
      />
      <Divider orientation="left">
        <Title level={4}>
          <CEmoji text="⏳" /> Upcoming...
        </Title>
      </Divider>
      <ShowOrDelete
        unlocksArray={unlocks.filter((u) => u.from > nowTime)}
        deleteOnly={false}
        timeprefix="wait"
        timecalc={(u) => u.from - Date.now()}
        callback={(u, s) => unlockFinishProcess(u, s)}
        btnType={"default"}
        btnDanger={false}
      />
      <Divider orientation="left">
        <Title level={4}>
          {" "}
          <CEmoji text="🐌" /> Too late{" "}
        </Title>
      </Divider>
      <ShowOrDelete
        unlocksArray={unlocks.filter((u) => u.to < nowTime)}
        deleteOnly={true}
        timeprefix="expired"
        timecalc={(u) => Date.now() - u.to}
        callback={(u) => deleteUnlock(u)}
        btnType={"default"}
        btnDanger={true}
      />
    </>
  );
}
