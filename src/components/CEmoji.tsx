import * as React from "react";

// Made for emojis since one day they became black&white
// in 17.11.21 it was because they has custom font-weight
// but allso possible:
// https://www.tjvantoll.com/2016/06/15/emoji-on-windows/

export function CEmoji(props: { text: string }) {
  return <span className="emoji">{props.text}</span>;
}
