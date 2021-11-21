import React, { useEffect } from "react";
import { Layout, Button, Switch } from "antd";

type Theme = "light" | "dark";

const stylesheets = {
  light: "https://cdnjs.cloudflare.com/ajax/libs/antd/4.9.4/antd.min.css",
  dark: "https://cdnjs.cloudflare.com/ajax/libs/antd/4.9.4/antd.dark.min.css"
};

const createStylesheetLink = (): HTMLLinkElement => {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.id = "antd-stylesheet";
  document.head.appendChild(link);
  return link;
};

const getStylesheetLink = (): HTMLLinkElement =>
  document.head.querySelector("#antd-stylesheet") || createStylesheetLink();

const systemTheme = () =>
  window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

export const getTheme = () =>
  (localStorage.getItem("theme") as Theme) || systemTheme();

export const setTheme = (t: Theme) => {
  localStorage.setItem("theme", t);
  getStylesheetLink().href = stylesheets[t];
};

export const toggleTheme = () =>
  setTheme(getTheme() === "dark" ? "light" : "dark");

export function ToggleDarkMode() {
  const [theme, setStrTheme] = React.useState(getTheme() as Theme);
  useEffect(() => {
    if (theme === "dark") setTheme("dark");
  }, []);
  return (
    <Switch
      checkedChildren="🌘 Dark Mode"
      unCheckedChildren="☀ Light Mode"
      checked={theme === "light"}
      onChange={() => {
        toggleTheme();
        setStrTheme(getTheme());
      }}
    />
  );
}
/* const App: React.FC = () => {
  // Set the default theme when the component is mounted
  React.useEffect(() => setTheme(getTheme()), []);

  return (
    <Layout>
      <Layout.Header>Header goes here...</Layout.Header>
      <Layout.Content style={{ margin: "auto", marginTop: "3em" }}>
        <Button onClick={toggleTheme}>Toggle Theme</Button>
      </Layout.Content>
    </Layout>
  );
}; */
