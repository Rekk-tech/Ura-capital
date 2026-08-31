import ReactDOM from "react-dom/client";
import { App } from "./app/App.js";
import "./index.css";

const rootElement = document.getElementById("root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<App />);
}
