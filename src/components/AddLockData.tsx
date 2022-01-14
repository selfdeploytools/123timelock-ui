import * as React from "react";
import * as encryptor from "simple-encryptor";
import {
  Alert,
  Button,
  Checkbox,
  Collapse,
  Input,
  Space,
  Typography
} from "antd";

import { uuidv4 } from "../utils/utils";
import { Group, fetchEncPass, fetchEncHash } from "../api/api-def";

import { AlertType, ResultAlert } from "./ResultAlert";
import { MobileDataHelperModal } from "../components/MobileDataHelperModal";

import { addLockedData, KeyDef } from "../redux/main-slice";
import { useAppDispatch, useAppSelector } from "../redux/store";
import { BoldTime } from "./BoldTime";
import { ShowOrDelete } from "./AvailData";
import { TOTP2Keys } from "../crypto/cryptoUtils";

const { Panel } = Collapse;
const { Text } = Typography;
const { TextArea } = Input;

export const SHA_DELIM = "`~SHA~`";
export const MAC_DELIM = "`~MAC~`";

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
    setClearOldTimeout(
      (setTimeout(() => setAlertList([]), 5 * 1000) as unknown) as number
    );
  };

  const addAlert = (type: AlertType, msg: string) => {
    setAlertList((old) => [[type, msg], ...old]);
    resetClearTimeout();
  };

  let key2value = (k: KeyDef) => k.keySalt + "|" + k.id;
  let value2salt = (v: string) => v.split("|")[0];

  const convertMacParts = async (
    data: string,
    randomPass: string,
    addAlert: (type: AlertType, msg: string) => void
  ) => {
    let dataparts = data.split(MAC_DELIM);
    // Splitting text where prefix=postfix, we can just use odd,even
    let dataStripped = dataparts.filter((e, i) => i % 2 === 0);
    let MACparts = dataparts.filter((e, i) => i % 2 === 1);
    let MACKeyPairs = MACparts.map((e) => TOTP2Keys(e, "sha1"));

    if (MACparts.length === 0) return data;

    let encrHashParts = (await fetchEncHash(
      MACKeyPairs.map((e) => JSON.stringify(e.serverKey)),
      randomPass
    ).catch((e) => {
      addAlert("error", `Error fetching hashparts (otp): ${e}`);
    })) || { err: "void fetchEncHash", data: { encparts: [] } };

    if (!!encrHashParts.err)
      throw new Error("Fetch hashparts (otp), " + encrHashParts.err);

    let dataWithHashparts = dataStripped
      .map((e, i) =>
        i !== dataStripped.length - 1
          ? e +
            (MACparts[i].length > 0 // real hash and not end\start element
              ? encrHashParts.data.encparts[i] +
                MAC_DELIM +
                JSON.stringify(MACKeyPairs[i].clientKey)
              : "")
          : e
      )
      .join("");
    return dataWithHashparts;
  };

  const convertHashParts = async (
    data: string,
    randomPass: string,
    addAlert: (type: AlertType, msg: string) => void
  ) => {
    let dataparts = data.split(SHA_DELIM);
    // Splitting text where prefix=postfix, we can just use odd,even
    let dataStripped = dataparts.filter((e, i) => i % 2 === 0);
    let hashparts = dataparts.filter((e, i) => i % 2 === 1);

    if (hashparts.length === 0) return data;

    let encrHashParts = (await fetchEncHash(hashparts, randomPass).catch(
      (e) => {
        addAlert("error", `Error fetching hashparts (hash): ${e}`);
      }
    )) || { err: "void fetchEncHash", data: { encparts: [] } };
    if (!!encrHashParts.err)
      throw new Error("Fetch hashparts (hash), " + encrHashParts.err);

    let dataWithHashparts = dataStripped
      .map((e, i) =>
        i !== dataStripped.length - 1
          ? e +
            (hashparts[i].length > 0 // real hash and not end\start element
              ? SHA_DELIM + encrHashParts.data.encparts[i] + SHA_DELIM
              : "")
          : e
      )
      .join("");
    return dataWithHashparts;
  };

  const startLockDataProcess = async () => {
    if (locked.filter((e) => e.desc === name).length > 0) {
      addAlert("info", `Entry with '${name}' already exist!`);
      return;
    }

    let randomPass = uuidv4();
    let encRandomPass = (await fetchEncPass(
      selectedKeysSalt.map((e) => value2salt(e)),
      randomPass
    ).catch((e) => {
      addAlert("error", `Error fetching: ${e}`);
    })) || { err: "void fetchEncPass", data: { enckey: "" } };

    if (!!encRandomPass.err) {
      addAlert("error", `${encRandomPass.err || "<empty error>"}`);
      return;
    }

    try {
      let dataWithEncHashParts = await convertMacParts(
        data,
        randomPass,
        addAlert
      );

      dataWithEncHashParts = await convertHashParts(
        dataWithEncHashParts,
        randomPass,
        addAlert
      );

      const dataEncrypted = encryptor
        .createEncryptor(randomPass)
        .encrypt(dataWithEncHashParts);

      if (
        !encRandomPass ||
        !encRandomPass.data ||
        !encRandomPass.data.enckey ||
        encRandomPass.data.enckey.length !== selectedKeysSalt.length
      ) {
        addAlert("error", "Can't read encryption result");
      } else {
        dispath(
          addLockedData({
            desc: name,
            encData: dataEncrypted,
            availablePass: selectedKeysSalt.map((salt, i) => ({
              encPass: encRandomPass.data.enckey[i],
              keySalt: value2salt(salt)
            }))
          })
        );
        // clear data of this
        setData("");
        setName("");

        addAlert(
          "success",
          `Data was saved sucessfully! (${encRandomPass.data.enckey.length} keys)`
        );
      }
    } catch (error) {
      addAlert("error", `Error encrypting: '${error}'`);
    }
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
          <b>2. </b> Enter data here: <br />
          <Collapse>
            <Panel header="ℹ Formatting tips" key="-1">
              <ul style={{ paddingLeft: "10px" }}>
                <li style={{ marginBottom: "10px" }}>
                  You can copy row by row after.{" "}
                </li>
                <li style={{ marginBottom: "10px" }}>
                  Links works out of the box - <b>http(s)://.../</b>
                </li>
                <li style={{ marginBottom: "10px" }}>
                  You can use <b>[img] [totp] [qr]</b> and <b>[sha256]</b> with
                  ending tag <b>[/...]</b>
                </li>
                <li style={{ marginBottom: "10px" }}>
                  Multi step, server backed, hash - <b> [sha256p], [sha1p] </b>{" "}
                  like:
                  <Text
                    code
                    copyable={{
                      text: "[sha256p]aaaa`~SHA~`bbbb`~SHA~`cccc[/sha256p]"
                    }}
                  >
                    [sha256p]aaaa
                    <Text mark>
                      `~SHA~`<b>bbbb</b>`~SHA~`
                    </Text>
                    cccc[/sha256p]
                  </Text>{" "}
                  where <Text code>bbbb</Text> will be used only on the server
                  side
                </li>
                <li style={{ marginBottom: "10px" }}>
                  Multi step, Server backed, totp
                  <b> [totp2] </b> tags with:
                  <Text
                    code
                    copyable={{
                      text: "[totp2]`~MAC~`TOTP_CODE`~MAC~`[/totp2]"
                    }}
                  >
                    [totp2]
                    <Text mark>
                      `~MAC~`<b>TOTP_CODE</b>`~MAC~`
                    </Text>
                    [/totp2]
                  </Text>
                </li>
              </ul>
            </Panel>
          </Collapse>
        </span>
        <TextArea
          dir="auto"
          style={{ height: "30vh", resize: "none" }}
          disabled={selectedKeysSalt.length === 0}
          value={data}
          onChange={(e) => {
            setData(e.target.value);
          }}
        />
        <ShowOrDelete
          deleteOnly={false}
          unlocksArray={[{ desc: "Preview Data" }]}
          timecalc={() => 0}
          callback={(u, set) => {
            set(["error", ""], data, () => {});
          }}
          btnType="primary"
          btnDanger={false}
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
          onClick={async () => {
            startLockDataProcess();
          }}
        >
          4. Add encrypted data
        </Button>
      </Space>
    </>
  );
}
