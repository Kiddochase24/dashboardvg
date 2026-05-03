import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { preInitWalletConnect } from "./lib/web3";

// Start WalletConnect relay connection immediately on page load
// so by the time the user pastes their address and clicks connect,
// the handshake is already done and the QR appears instantly.
preInitWalletConnect();

createRoot(document.getElementById("root")!).render(<App />);
