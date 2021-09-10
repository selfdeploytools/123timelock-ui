import { Tag } from "antd";
import * as React from "react";

export function BoldTime(props: { time: string }) {
  let times = props.time.split(/[^0-9]+/); // ["0", "0", "1", ""]
  let texts = props.time.split(/[0-9]+/); // ["", "d ", "hr ", "min"]

  return (
    <>
      {/*  {[0, 1, 2].map((i) => (
        <React.Fragment key={i}>
          {i === 0 ? (
            <i>{times[i]}</i>
          ) : i === 1 ? (
            <b>{times[i]}</b>
          ) : (
            <i>{times[i]}</i>
          )}
          <sup>{texts[i + 1]} </sup>
        </React.Fragment>
      ))} */}
      <Tag color="geekblue" style={{ fontSize: "1.2em" }}>
        <i>{times[0]}</i>d <b>{times[1]}</b>hr <b>{times[2]}</b>min
      </Tag>
    </>
  );
}
