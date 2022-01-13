import * as React from "react";

import {
  Button,
  Divider,
  Modal,
  Typography,
  Space,
  Input,
  Row,
  Col
} from "antd";

import { CheckOutlined, CopyOutlined, DeleteOutlined } from "@ant-design/icons";
import { fetchFinishUnlockSha } from "../api/api-def";

import { delUnLockedData, UnlockDef } from "../redux/main-slice";
import { authenticator } from "otplib";

import { getQR } from "./ShareOrForget";
import { hashFinalStep, hashStep } from "../crypto/cryptoUtils";
const { Title, Text, Paragraph } = Typography;

const isLink = (e) => e.startsWith("http://") || e.startsWith("https://");
const isImage = (e) => e.startsWith("[img]") && e.endsWith("[/img]");
const isTOTP = (e) => e.startsWith("[totp]") && e.endsWith("[/totp]");
const isQR = (e) => e.startsWith("[qr]") && e.endsWith("[/qr]");
const isHASH256 = (e) => e.startsWith("[sha256]") && e.endsWith("[/sha256]");
const isHASH256Parts = (e) =>
  e.startsWith("[sha256p]") && e.endsWith("[/sha256p]");
const isHASH1Parts = (e) => e.startsWith("[sha1p]") && e.endsWith("[/sha1p]");

async function sha256_simple(message: string): Promise<string> {
  // encode as UTF-8
  const msgBuffer = new TextEncoder().encode(message);

  // hash the message
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);

  // convert ArrayBuffer to Array
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // convert bytes to hex string
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

export const redactCopy = (txt) => {
  // not really stopping anyone, just to avoid copy secret on mistake
  return txt
    .replace(/\[img\].*?\[\/img\]/g, "<IMAGE>")
    .replace(/\[totp\].*?\[\/totp\]/g, "<TOTP>")
    .replace(/\[qr\].*?\[\/qr\]/g, "<QR CODE>")
    .replace(/\[sha256\].*?\[\/sha256\]/g, "<HASH256 CODE>")
    .replace(/\[sha256p\].*?\[\/sha256p\]/g, "<HASH256-Parts CODE>")
    .replace(/\[sha1p\].*?\[\/sha1p\]/g, "<HASH1-Parts CODE>");
};

export const isRedacted = (txt) => {
  return redactCopy(txt) == txt;
};

const AsyncImage = (props: { getSrc: Promise<string> }) => {
  const [src, setSrc] = React.useState("");
  React.useEffect(() => {
    props.getSrc.then((e) => setSrc(e));
  });
  return (
    <img src={src} alt="qr-code" style={!src ? { height: 0, width: 0 } : {}} />
  );
};

const SecretMessage = (props: {
  sharedSecret: string;
  cb: (string) => Promise<string>;
}) => {
  const [result, setResult] = React.useState("FFFF");
  const [input, setInput] = React.useState("");
  return (
    <>
      Enter code: <br />
      <ul style={{ width: "100%" }}>
        <li>
          <Input
            placeholder="Enter the code here"
            value={input}
            onChange={(e) => {
              let txt = e.target.value;
              setInput(txt);
              props
                .cb(props.sharedSecret + txt)
                .then((e) => setResult(e))
                .catch((e) => setResult(`Error: ${e}`));
            }}
          />
        </li>
        <li>
          <Paragraph
            copyable={{
              icon: [
                <CopyOutlined style={{ fontSize: "2em" }} key="copy-icon" />,
                <CheckOutlined style={{ fontSize: "2em" }} key="copied-icon" />
              ],
              text: result
            }}
            style={{ wordBreak: "break-all" }}
          >
            <b> {result}</b>
          </Paragraph>
        </li>
      </ul>
    </>
  );
};

const SecretMessageParts = (props: {
  hashType: string;
  sharedSecret: string;
  unlock: UnlockDef;
}) => {
  const CalculateHash = async (code: string) => {
    const DELIM = "::";
    const u = props.unlock;

    let dataparts = code.split(DELIM);
    // Splitting text where prefix=postfix, we can just use odd,even
    let state = undefined;
    for (let i = 0; i < dataparts.length; i++) {
      const part = dataparts[i];
      if (part.length === 0) continue;
      if (i % 2 === 0) {
        // client side:
        state = hashStep(part, props.hashType, state);
      } else {
        let result = await fetchFinishUnlockSha(
          u.encPass,
          u.from,
          u.to,
          u.keySalt,
          u.unlockProof,
          props.hashType,
          state,
          part
        );
        if (result.err) throw new Error(result.err);
        state = result.data.hashstep;
      }
    }
    let hashresult = hashFinalStep(null, props.hashType, state);
    return hashresult;
  };

  const [result, setResult] = React.useState("FFFF");
  const [input, setInput] = React.useState("");
  return (
    <>
      Enter code:
      <ul style={{ width: "100%" }}>
        <li>
          <Space direction="horizontal">
            <Input
              placeholder="Enter the code here"
              value={input}
              onChange={(e) => {
                let txt = e.target.value;
                setInput(txt);
              }}
            />
            <Button
              type="primary"
              onClick={(e) => {
                CalculateHash(input + props.sharedSecret)
                  .then((e) => setResult(e))
                  .catch((e) => setResult(`Error: ${e}`));
              }}
            >
              Hash!
            </Button>
          </Space>
        </li>
        <li>
          <Paragraph
            copyable={{
              icon: [
                <CopyOutlined style={{ fontSize: "2em" }} key="copy-icon" />,
                <CheckOutlined style={{ fontSize: "2em" }} key="copied-icon" />
              ],
              text: result
            }}
            style={{ wordBreak: "break-all" }}
          >
            <b> {result}</b>
          </Paragraph>
        </li>
      </ul>
    </>
  );
};

export function TextEffects(props: { text: string; unlock: UnlockDef }) {
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
        } else if (isTOTP(e)) {
          let totpStr = e.match(/\[totp\]([a-zA-Z0-9]+?)\[\/totp\]/)[1];
          return (
            <>
              <Text code>
                {authenticator.generate(totpStr).split("").join(" ")}
              </Text>{" "}
            </>
          );
        } else if (isHASH256Parts(e)) {
          let hashSahredSecret = (e.match(
            /\[sha256p\]([^\s]+?)\[\/sha256p\]/
          ) || ["", ""])[1];
          return (
            <>
              <SecretMessageParts
                hashType={"sha256"}
                sharedSecret={hashSahredSecret}
                unlock={props.unlock}
              />
            </>
          );
        } else if (isHASH1Parts(e)) {
          let hashSahredSecret = (e.match(/\[sha1p\]([^\s]+?)\[\/sha1p\]/) || [
            "",
            ""
          ])[1];
          return (
            <>
              <SecretMessageParts
                hashType={"sha1"}
                sharedSecret={hashSahredSecret}
                unlock={props.unlock}
              />
            </>
          );
        } else if (isHASH256(e)) {
          let hashSahredSecret = (e.match(
            /\[sha256\]([^\s]+?)\[\/sha256\]/
          ) || ["", ""])[1];
          return (
            <>
              <SecretMessage
                sharedSecret={hashSahredSecret}
                cb={sha256_simple}
              />
            </>
          );
        } else if (isQR(e)) {
          let qrData = e.match(/\[qr\](.+?)\[\/qr\]/)[1];

          return (
            <>
              <AsyncImage getSrc={getQR(qrData)} />
            </>
          );
        } else {
          return <>{e}&nbsp;</>;
        }
      })}
    </>
  );
}
