import * as React from "react";
import {
  CaretUpOutlined,
  CaretDownOutlined,
  EditOutlined
} from "@ant-design/icons";

import { Modal, Button } from "antd";

export type minOffsetArr = [number, number, number]; // day, hour, min
export function TimeDelayShowAndEdit(
  props: {
    value: minOffsetArr;
    onChange: (val: minOffsetArr) => void;
  } = { value: [0, 0, 0], onChange: (e) => {} }
) {
  const [visible, setVisible] = React.useState(false);
  const fastChange = (index, delta) => {
    let current = props.value;
    current[index] = Math.max(0, current[index] + delta);
    if (JSON.stringify(current) === "[0,0,0]") {
      current = [0, 0, 1]; // min 1 minute
    }
    props.onChange(current);
  };

  return (
    <>
      <span>
        Days: <b> {props.value[0]} </b>
      </span>
      <span>
        Hours: <b> {props.value[1]} </b>{" "}
      </span>
      <span>
        Minutes: <b>{props.value[2]} </b>
      </span>
      <Button onClick={() => setVisible(true)}>
        <EditOutlined />
      </Button>
      <Modal
        title={"Edit time"}
        visible={visible}
        closeIcon={<></>}
        footer={<Button onClick={() => setVisible(false)}>Done</Button>}
      >
        <ul style={{ lineHeight: "3em", listStyleType: "none" }}>
          <li>
            <span> Days: {props.value[0]} </span> <br />
            <Button onClick={() => fastChange(0, 1)}>
              <CaretUpOutlined />
            </Button>
            &nbsp;
            <Button onClick={() => fastChange(0, -1)}>
              <CaretDownOutlined />
            </Button>
            &nbsp;
            <Button onClick={() => fastChange(0, 5)}>
              <CaretUpOutlined /> 5
            </Button>
            &nbsp;
            <Button onClick={() => fastChange(0, -5)}>
              <CaretDownOutlined /> 5
            </Button>
          </li>
          <li>
            <span> Hours: {props.value[1]} </span> <br />
            <Button onClick={() => fastChange(1, 1)}>
              <CaretUpOutlined />
            </Button>
            &nbsp;
            <Button onClick={() => fastChange(1, -1)}>
              <CaretDownOutlined />
            </Button>
            &nbsp;
            <Button onClick={() => fastChange(1, 5)}>
              <CaretUpOutlined /> 5
            </Button>
            &nbsp;
            <Button onClick={() => fastChange(1, -5)}>
              <CaretDownOutlined /> 5
            </Button>
          </li>
          <li>
            <span> Minutes: {props.value[2]} </span> <br />
            <Button onClick={() => fastChange(2, 1)}>
              <CaretUpOutlined />
            </Button>
            &nbsp;
            <Button onClick={() => fastChange(2, -1)}>
              <CaretDownOutlined />
            </Button>
            &nbsp;
            <Button onClick={() => fastChange(2, 10)}>
              <CaretUpOutlined /> 10
            </Button>
            &nbsp;
            <Button onClick={() => fastChange(2, -10)}>
              <CaretDownOutlined /> 10
            </Button>
          </li>
        </ul>
      </Modal>
    </>
  );
}
