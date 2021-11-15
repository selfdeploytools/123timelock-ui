import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type TempStartInfo = {
  from: number,
  tempproof: string
}


export type KeyDef = {
  id: string;
  keySalt: string;
  keyProof: string; // User can forget this.
};

export type LockedDataDef = {
  desc: string;
  encData: string;
  availablePass: {
    encPass: string;
    keySalt: string;
  }[];
};

export type UnlockDef = {
  desc: string;
  encData: string;
  encPass: string;

  keySalt: string;
  keyID: string;

  from: number;
  to: number;

  unlockProof: string;
};

export type MainSliceDef = {
  keys: KeyDef[];
  lockedData: LockedDataDef[];
  unlocks: UnlockDef[];
  temps: TempStartInfo[];
};

export type delUnlockDef = [string, number, number];

export const MainSliceStorageKey = "redux_main_store_cache";
export const MainSliceTypePrefix = "main";

const initialState: MainSliceDef = localStorage.getItem(MainSliceStorageKey)
  ? JSON.parse(localStorage.getItem(MainSliceStorageKey))
  : {
      keys: [],
      lockedData: [],
      unlocks: [], 
      temps: []
    };

export const mainSlice = createSlice({
  name: MainSliceTypePrefix,
  initialState,
  reducers: {
    addKey: {
      reducer(state, action: PayloadAction<KeyDef>) {
        state.keys.push(action.payload);
      },
      prepare(data: KeyDef) {
        return { payload: data };
      }
    },
    addLockedData: {
      reducer(state, action: PayloadAction<LockedDataDef>) {
        state.lockedData.push(action.payload);
      },
      prepare(data: LockedDataDef) {
        return { payload: data };
      }
    },
    addUnLockedData: {
      reducer(state, action: PayloadAction<UnlockDef>) {
        state.unlocks.push(action.payload);
      },
      prepare(data: UnlockDef) {
        return { payload: data };
      }
    },
    delKey: {
      reducer(state, action: PayloadAction<string>) {
        state.keys = state.keys.filter((e) => e.id !== action.payload);
      },
      prepare(id: string) {
        return { payload: id };
      }
    },
    forgetKey: {
      reducer(state, action: PayloadAction<string>) {
        state.keys = state.keys.map((e) =>
          e.id !== action.payload
            ? e
            : { id: e.id, keySalt: e.keySalt, keyProof: "token forgotten!" }
        );
      },
      prepare(id: string) {
        return { payload: id };
      }
    },
    delLockedData: {
      reducer(state, action: PayloadAction<string>) {
        state.lockedData = state.lockedData.filter(
          (e) => e.desc !== action.payload
        );
      },
      prepare(desc: string) {
        return { payload: desc };
      }
    },
    delUnLockedData: {
      reducer(state, action: PayloadAction<delUnlockDef>) {
        state.unlocks = state.unlocks.filter(
          (e) =>
            !(
              e.keySalt === action.payload[0] &&
              e.from === action.payload[1] &&
              e.to === action.payload[2]
            )
        );
      },
      prepare(
        salt: string,
        from: number,
        to: number
      ): { payload: delUnlockDef } {
        return { payload: [salt, from, to] };
      }
    },
    clearAll: (state, action) => {
      state.keys = [];
      state.lockedData = [];
      state.unlocks = [];
    },
    addTempInfo: {
      reducer(state, action: PayloadAction<TempStartInfo>) {
        state.temps.push(action.payload);
      },
      prepare(data:TempStartInfo) {
        return {payload:data};
      }
    },
    delTempInfo: {
      reducer(state, action: PayloadAction<string>) {
        state.temps = state.temps.filter(
          (e) => e.tempproof !== action.payload
        );
      },
      prepare(proof: string) {
        return { payload: proof };
      }
    },
  }
});

/* Creating Async functions like data:
https://redux-toolkit.js.org/usage/usage-with-typescript#createasyncthunk
with
  type from `mainSlice.actions.addKey.type`
*/

export const {
  addKey,
  addLockedData,
  addUnLockedData,
  delKey,
  delLockedData,
  delUnLockedData,
  clearAll,
  forgetKey,
  addTempInfo, delTempInfo
} = mainSlice.actions;
export default mainSlice.reducer;
