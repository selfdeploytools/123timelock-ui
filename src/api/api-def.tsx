import * as React from "react";

// ============= Types ==============

export type TimeToken = {
  // = "delayed key"
  name: string;
  proof: string;
  salt: string;
};

export type LockedData = {
  name: string;
  enc_data: string;
  enc_pass: string;
};

export type UnLockedData = {
  name: string; // name of unlocked data
  from: number;
  to: number;
  unlockproof: string;
  token: TimeToken;
};

export type Group = {
  name: string;
  salt: string;
  tokens: Array<TimeToken>;
  locked: Array<LockedData>;
  unlocked: Array<UnLockedData>;
};

// =============  API  ==============

const SERVER_BASE =
  localStorage.getItem("SERVER_URL") ||
  "https://timelock-back-ga.my123.app/api";
const fastGET = async (
  path: string,
  params: { [key: string]: string | string[] }
) => {
  let url = SERVER_BASE + path + "?rnd=" + Math.random();
  Object.keys(params).forEach((k) => {
    const v = params[k];
    if (!Array.isArray(v)) {
      url += `&${k}=${v}`;
    } else {
      v.forEach((val) => {
        url += `&${k}=${val}`;
      });
    }
  });
  const result = { err: null, data: null };
  try {
    const response = await fetch(url);
    const json = await response.json();
    result.data = json;
    if (result.data.err) {
      result.err = result.data.err;
    }
  } catch (error) {
    result.err = error;
  }
  return result;
};

export const fetchNewGroup = async (times: Array<string>) => {
  const result: {
    err?: string;
    data: {
      salt: string;
      tokens: Array<TimeToken>;
    };
  } = await fastGET("/setup", { time: times });
  console.log("/setup", result);
  return result;
};

export const fetchEncPass = async (salts: string[], pass: string) => {
  const result: {
    err?: string;
    data: {
      enckey: string[];
    };
  } = await fastGET("/enc", { salts, pass });
  console.log("/enc", result);
  return result;
};

export const fetchStartUnlock = async (
  encPass: string,
  keySalt: string,
  keyId: string,
  keyProof: string,
  offsetMin = 0,
  durationMin = 15
) => {
  const result: {
    err?: string;
    data: {
      from: number;
      to: number;
      proof: string;
    };
  } = await fastGET("/unlock/begin", {
    enckey: encPass,
    salt: keySalt,
    token: keyId,
    tokenproof: keyProof,
    offsetstartmin: offsetMin.toString(),
    duration: durationMin.toString()
  });
  console.log("/unlock/begin", result);
  return result;
};

export const fetchFinishUnlock = async (
  encPass: string,
  from: number,
  to: number,
  salt: string,
  proof: string
) => {
  const result: {
    err?: string;
    data: {
      pass: string;
      timeLeftOpen: string;
    };
  } = await fastGET("/unlock/finish", {
    enckey: encPass,
    from: from.toString(),
    to: to.toString(),
    proof,
    salt
  });
  console.log("/unlock/finish", result);
  return result;
};

// =============  React Funcs  ==============

/*
import createPersistedState from "use-persisted-state";
const ALL_GROUPS = "all_groups_names";

export function GroupIterator(props: {
  render_callback: (
    groupNames: string[],
    addGroupName: (name: string) => void
  ) => JSX.Element;
}) {
  const [allGroups, setAllGroups] = createPersistedState(ALL_GROUPS)(
    [] as Array<string>
  );
  return props.render_callback(
    allGroups.filter(function (item, pos, ary) {
      // remove duplicates
      return !pos || item != ary[pos - 1];
    }),
    (name: string) => {
      setAllGroups((old) => [name, ...old]);
    }
  );
}
*/
