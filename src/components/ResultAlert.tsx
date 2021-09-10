import * as React from "react";
import { Alert } from "antd";

export type AlertType = "success" | "info" | "warning" | "error";
export function ResultAlert(props: { type: AlertType; msg: string }) {
  return <Alert type={props.type} message={props.msg} />;
}
