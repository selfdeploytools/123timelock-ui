import * as React from "react";

import {
  Alert,
  Button,
  Card,
  Descriptions,
  Modal,
  Progress,
  Radio,
  Result,
  Space,
  Typography
} from "antd";

import { AlertList, AddToAlertList } from "./AlertList";

import { fetchCreateTemp, fetchConvertFastTemp } from "../api/api-def";

import { useAppDispatch, useAppSelector } from "../redux/store";
import {
  addTempInfo,
  delTempInfo,
  KeyDef,
  TempStartInfo
} from "../redux/main-slice";
import { KeyInput } from "./KeyInput";
import { BoldTime } from "./BoldTime";

import { default as prettyms } from "pretty-ms";

const { Text } = Typography;

export function ShowCode(props: { code: string }) {
  return (
    <div style={{ textAlign: "left" }}>
      {props.code.split("").map((c) => (
        <Text
          strong
          code
          style={{
            fontSize: "1.5em",
            color: !/[a-zA-Z]/.test(c) ? "#db00db" : "red"
          }}
        >
          {c}
        </Text>
      ))}
    </div>
  );
}

export function ShareTemp() {
  const dispath = useAppDispatch();
  const temps = useAppSelector((s) => s.main.temps);
  const ALERT_LIST_NAME = "SHARE_TEMP_LIST";

  const [myNow, setMyNow] = React.useState(Date.now());
  React.useEffect(() => {
    let updateTime = () => setMyNow(Date.now());
    let id = setInterval(updateTime, 2 * 1000);

    return () => {
      clearInterval(id);
    };
  });

  const [selectedTemp, setSelectedTemp] = React.useState(null as TempStartInfo);

  const VALID_TIME: number = 3 * 60 * 1000; // 3 min
  const [tempCodeStart, setTempCodeStart] = React.useState(Date.now());
  const [tempCode, setTempCode] = React.useState(["0000", "0000"]);
  const [shareVisible, setVisibleShare] = React.useState(false);

  const showTempCode = (code, time) => {
    setTempCode([code, time]);
    setTempCodeStart(Date.now());
    setVisibleShare(true);
  };

  let startShareTemp = (tempinfo: TempStartInfo) => {
    fetchConvertFastTemp(
      tempinfo.token,
      tempinfo.tempproof,
      tempinfo.from,
      tempinfo.salt
    )
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
            dispath(delTempInfo(tempinfo.tempproof));
            showTempCode(result.data.fastproof, result.data.mindiff);
          } catch (error) {
            AddToAlertList(
              ALERT_LIST_NAME,
              "error",
              `Error gettign a share code: ${error}`
            );
          }
        }
      })
      .catch((e) =>
        AddToAlertList(ALERT_LIST_NAME, "error", `Error fetching: ${e}`)
      );

    return true;
  };

  const closeShowTemp = () => {
    setSelectedTemp(null);
    setVisibleShare(false);
  };

  return (
    <>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Alert
          message=""
          description={
            <i>
              Any shared code will be valid for <b>3 minutes</b> and gone
              forever
            </i>
          }
          type="warning"
          showIcon
          closable={false}
        />
        <Radio.Group
          onChange={(e) => {
            setSelectedTemp(
              temps.filter((l) => l.tempproof === e.target.value)[0]
            );
          }}
          value={selectedTemp && selectedTemp.tempproof}
        >
          {temps.map((e) => (
            <Radio key={e.tempproof} value={e.tempproof}>
              <BoldTime time={e.token} /> <b> Time passed: </b>
              {prettyms(myNow - e.from, { secondsDecimalDigits: 0 })}
              &nbsp;&nbsp;&nbsp;
            </Radio>
          ))}
        </Radio.Group>
        <AlertList listName={ALERT_LIST_NAME} />
        <Button
          type="primary"
          disabled={!selectedTemp || !selectedTemp.tempproof}
          onClick={() => startShareTemp(selectedTemp)}
        >
          Share Selected
        </Button>
        <Modal
          visible={shareVisible}
          title={"Key share code"}
          closeIcon={<></>}
          onOk={closeShowTemp}
          onCancel={closeShowTemp}
        >
          <Result
            status="success"
            title={
              <Descriptions
                title="Use this codes on another device"
                bordered
                column={1}
              >
                <Descriptions.Item label="Key">
                  <BoldTime time={selectedTemp?.token} />
                </Descriptions.Item>
                <Descriptions.Item label="Code">
                  <ShowCode code={tempCode[0]} />
                </Descriptions.Item>
                <Descriptions.Item label="Time">
                  <ShowCode code={tempCode[1]} />
                </Descriptions.Item>
              </Descriptions>
            }
          />
          Time Left until expire:{" "}
          <b>
            {prettyms(Math.max(0, tempCodeStart + VALID_TIME - myNow), {
              secondsDecimalDigits: 0
            })}
          </b>
          <Progress
            strokeColor="#ffa500"
            percent={Math.max(
              0,
              100 - (100 * (myNow - tempCodeStart)) / VALID_TIME
            )}
            showInfo={false}
          />
        </Modal>
      </Space>
    </>
  );
}
