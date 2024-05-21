import { useEffect, useMemo, useState } from "react";
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base";
import RPC from "./solanaRPC";
import "./App.css";

import { getDefaultExternalAdapters } from "@web3auth/default-solana-adapter"; 
import { SolanaPrivateKeyProvider } from "@web3auth/solana-provider";

const clientId = "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ"; 

function App() {

  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState({});
  const [addressInfo, setAddressInfo] = useState<string[]>([]);

  const chainConfig = {
    chainId: "0x3",
    chainNamespace: CHAIN_NAMESPACES.SOLANA,
    rpcTarget: "https://api.testnet.solana.com",
    tickerName: "SOLANA",
    ticker: "SOL",
    decimals: 18,
    blockExplorerUrl: "https://explorer.solana.com/?cluster=testnet",
    logo: "https://images.toruswallet.io/sol.svg"
  };

  useEffect(() => {
    const init = async () => {
      try {

        const solanaPrivateKeyPrvoider = new SolanaPrivateKeyProvider({
          config: { chainConfig: chainConfig }
        })

        const web3auth = new Web3Auth({
          clientId,
          // uiConfig refers to the whitelabeling options, which is available only on Growth Plan and above
          // Please remove this parameter if you're on the Base Plan
          uiConfig: {
            appName: "W3A Heroes",
            mode: "light",
            // loginMethodsOrder: ["apple", "google", "twitter"],
            logoLight: "https://web3auth.io/images/web3authlog.png",
            logoDark: "https://web3auth.io/images/web3authlogodark.png",
            defaultLanguage: "en", // en, de, ja, ko, zh, es, fr, pt, nl
            loginGridCol: 3,
            primaryButton: "externalLogin", // "externalLogin" | "socialLogin" | "emailLogin"
            uxMode: "redirect",
          },
          web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
          privateKeyProvider: solanaPrivateKeyPrvoider
        });

        // Setup external adapaters
        const adapters = await getDefaultExternalAdapters({
          options: {
            clientId,
            chainConfig,
          }
        });
        adapters.forEach((adapter) => {
          web3auth.configureAdapter(adapter);
        });

        setWeb3auth(web3auth);

        await web3auth.initModal();
        setProvider(web3auth.provider);

        if (web3auth.connected) {
          setLoggedIn(true);
        }
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, []);

  const getUserInfo = async () => {
    if (!web3auth) return;
    const user = await web3auth.getUserInfo();
    setUserInfo(user);
  };
  const getAccounts = async () => {
    if (!web3auth || !provider) return;
    const rpc = new RPC(provider);
    const address = await rpc.getAccounts();
    setAddressInfo(address);
  };

  useEffect(() => {
    if (!!web3auth && !!provider && loggedIn) {
      getUserInfo();
      getAccounts();
    }
  }, [web3auth, provider, loggedIn]);

  const login = async () => {
    if (!web3auth) return;
    const web3authProvider = await web3auth.connect();

    if (web3auth.connected) {
      setLoggedIn(true);
    }
    setProvider(web3authProvider);
  };

  const logout = async () => {
    if (!web3auth) return;
    await web3auth.logout();
    setProvider(null);
    setLoggedIn(false);
  };

  const loggedInView = (
    <>
      <div className="flex-container">
        <div>
          <button onClick={logout} className="card">
            Log Out
          </button>
        </div>
      </div>
      <div id="console" style={{ whiteSpace: "pre-line", textAlign: "center" }}>
        <p style={{ whiteSpace: "pre-line" }}>Logged in Successfully!</p>
        <p>Address: {addressInfo}</p>
        <p>User Info: {JSON.stringify(userInfo || {}, null, 2)}</p>
      </div>
    </>
  );

  const unloggedInView = (
    <button onClick={login} className="card">
      Login
    </button>
  );

  return (
    <div className="container">
      <h1 className="title">
        Solana Network
      </h1>

      <div className="grid">{loggedIn ? loggedInView : unloggedInView}</div>
    </div>
  );
}

export default App;
