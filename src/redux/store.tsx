import { Action, configureStore, Middleware } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import throttle from "lodash/throttle";

import mainSliceReducer, {
  MainSliceStorageKey,
  MainSliceTypePrefix
} from "./main-slice";

const _store = configureStore({
  reducer: {
    [MainSliceTypePrefix]: mainSliceReducer
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware()
  /*.prepend(
      localStorageSave(MainSliceTypePrefix, MainSliceStorageKey)
    )*/
});

export const store = _store;

store.subscribe(
  throttle(() => {
    let dataToSave = JSON.stringify(store.getState()[MainSliceTypePrefix]);
    console.log(
      "Saving to storage.. kB:" +
        Math.round((dataToSave.length / 1024) * 100) / 100 +
        " out of 5120"
    );
    localStorage.setItem(MainSliceStorageKey, dataToSave);
  }, 1000 /* ignore more than 1 event in ms timespan*/)
);

export type RootState = ReturnType<typeof _store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof _store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
