import * as React from "react";

import { Button, Space, Typography } from "antd";

import { useAppDispatch, useAppSelector } from "../redux/store";
import { addKey, delKey, KeyDef, forgetKey } from "../redux/main-slice";

import { MobileDataHelperModal } from "../components/MobileDataHelperModal";
import { BoldTime } from "./BoldTime";

import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  Svg,
  View,
  Image
} from "@react-pdf/renderer";
import PdfDocument from "../utils/PdfDocument";

import * as QRCode from "qrcode";
import { logo } from "../img/logo";
import Title from "antd/lib/typography/Title";
import {
  CheckOutlined,
  CopyOutlined,
  QrcodeOutlined,
  UnlockOutlined
} from "@ant-design/icons";
import Checkbox from "antd/lib/checkbox/Checkbox";
import Modal from "antd/lib/modal/Modal";

const { Paragraph } = Typography;

export const styles = StyleSheet.create({
  txt: {
    textAlign: "right",
    right: "2",
    fontSize: "10px",
    padding: "5px",
    backgroundColor: "#FEFEFE"
  },
  img: { height: "100%", width: "50%" },
  section: {
    textAlign: "center",
    width: "47%",
    margin: "1.5%",
    border: "3px solid black",
    flexDirection: "row",
    padding: "0px"
  },
  header: {
    fontSize: 12,
    margin: 20,
    textAlign: "center",
    color: "grey"
  },
  pageNumber: {
    position: "absolute",
    fontSize: 12,
    bottom: 15,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "grey",
    backgroundColor: "#FEFEFE"
  }
});

const TestDocument = (props: { keys: KeyDef[]; images: string[] }) => {
  return (
    <Document>
      <Page size="A4">
        <Text style={styles.header} fixed>
          123timelock Keys Export {new Date().toDateString()}
        </Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between"
          }}
        >
          {props.keys.map((k, i) => (
            <View key={k.id} style={[styles.section]}>
              <Image src={props.images[i]} style={styles.img} />
              <View style={{ width: "100%" }}>
                {/*Fit text trick, viewbox based on width of text (aprox):*/}
                <Svg viewBox="0 0 150 18">
                  <Text x="0" y="15">
                    {k.id}
                  </Text>
                </Svg>
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    top: 0,
                    height: "100%",
                    width: "21%",
                    borderLeft: "3px #00000024 dotted",
                    opacity: 0.7
                  }}
                />
                <Text style={styles.txt}>{k.keySalt}</Text>
                <Text style={styles.txt}>{k.keyProof}</Text>
              </View>
              <Image
                src={logo}
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: "35%",
                  width: "50%",
                  opacity: 0.7
                }}
              />
            </View>
          ))}
        </View>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `[ Page ${pageNumber} / ${totalPages} ]`
          }
          fixed
        />
      </Page>
    </Document>
  );
};

export const getQR = (data: string) => {
  return new Promise<string>((ok, bad) => {
    QRCode.toDataURL(data, (err, url) => {
      if (err) return bad(err);
      ok(url);
    });
  });
};

export function ShareForgetKeys() {
  const dispatch = useAppDispatch();
  const keys = useAppSelector((state) => state.main.keys);
  const [keysQR, setKeysQr] = React.useState([] as string[]);
  const [modifyKey, setModifyKey] = React.useState("");

  const [singleModalVisible, setSingleModalVisible] = React.useState(false);

  const [selQR, setSelQR] = React.useState("");
  const [selID, setSelID] = React.useState("");

  const addKey_ = (name: string) => {
    dispatch(
      addKey({ id: "key" + Math.random(), keySalt: "1", keyProof: "2" })
    );
  };
  const delKey_ = (name: string) => {
    dispatch(delKey(name));
  };
  const forgetKey_ = (name: string) => {
    dispatch(forgetKey(name));
  };

  const renderPdf = () => {
    Promise.all(keys.map((k) => getQR(JSON.stringify(k))))
      .then((result) => setKeysQr(result))
      .catch((e) => {
        setKeysQr([]);
        console.log(e);
      });
  };

  return (
    <>
      {/*<Button onClick={() => addKey_("")}>Add Key</Button>*/}
      <ul>
        {keys.map((e) => (
          <li key={e.id}>
            <BoldTime time={e.id} />
            <Paragraph
              style={{ display: "inline" }}
              copyable={{
                text: JSON.stringify(e),
                icon: [
                  <CopyOutlined style={{ fontSize: "2em" }} key="copy-icon" />,
                  <CheckOutlined
                    style={{ fontSize: "2em" }}
                    key="copied-icon"
                  />
                ],
                tooltips: "Copy"
              }}
            ></Paragraph>
            {e.keyProof.startsWith("token_") && (
              <QrcodeOutlined
                onClick={async () => {
                  setSelID(e.id);
                  setSelQR(await getQR(JSON.stringify(e)));
                  setSingleModalVisible(true);
                }}
                style={{ fontSize: "2em" }}
                key="copy-icon"
              />
            )}
            <ul>
              <li>
                <b>Random numbers (salt):</b> {e.keySalt}
              </li>
              <li>
                <b>Proof (token):</b> {e.keyProof ? e.keyProof : "No Proof!"}{" "}
              </li>
              <li>
                <Checkbox
                  onChange={(ev) => {
                    if (ev.target.checked) {
                      setModifyKey(`${e.id}_${e.keySalt}`);
                    } else {
                      setModifyKey("");
                    }
                  }}
                >
                  Check to modify {">>"}
                </Checkbox>
                <ul>
                  <li style={{ marginBottom: "15px" }}>
                    <Space>
                      <Button
                        disabled={modifyKey !== `${e.id}_${e.keySalt}`}
                        danger
                        onClick={() => delKey_(e.id)}
                      >
                        Delete
                      </Button>

                      <Button
                        disabled={modifyKey !== `${e.id}_${e.keySalt}`}
                        onClick={() => forgetKey_(e.id)}
                      >
                        Forget
                      </Button>
                    </Space>
                  </li>
                </ul>
              </li>
            </ul>
          </li>
        ))}
      </ul>
      <Button onClick={() => renderPdf()}>Render Pdf {">>"} </Button> {">> "}
      {keys.length === keysQR.length && (
        <PdfDocument
          key={"key1"}
          title="Title1"
          document={<TestDocument keys={keys} images={keysQR} />}
        />
      )}
      <Modal
        visible={singleModalVisible}
        footer={
          <Button type="primary" onClick={() => setSingleModalVisible(false)}>
            Close
          </Button>
        }
        closable={false}
      >
        <BoldTime time={selID} /> <br />
        <img style={{ width: "100%" }} src={selQR} />
      </Modal>
    </>
  );
}

/*
Old erros when used useLocalStorage()..
  // This sub-componenet was created to use new hooks on new group creating
  //    because the map() made a 1 more call to createPersistedState(groupName)
  // using them in a callback arrow func made an error : "Rendered more hooks than the previous render."
  // But a new call to hook because a new React component is acceptible...
*/
