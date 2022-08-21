import { useState, useEffect } from "react";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Program, AnchorProvider, web3, Idl } from "@project-serum/anchor";
import { Buffer } from "buffer";

import _idl from "./idl.json";
import kp from "./keypair.json";

import "./App.css";

type GifItem = {
    gifLink: string;
    userAddress: Object;
};

const { SystemProgram, Keypair } = web3;
window.Buffer = Buffer;
const idl = _idl as Idl;

const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);

const programID = new PublicKey(idl.metadata.address);
const network = clusterApiUrl("devnet");

const App = () => {
    const [walletAddress, setWalletAddress] = useState(null);
    const [gifAddress, setGifAddress] = useState<string>("");
    const [gifList, setGifList] = useState<Array<GifItem>>([]);

    useEffect(() => {
        const onLoad = async () => await connectWallet();
        window.addEventListener("load", onLoad);
        return () => window.removeEventListener("load", onLoad);
    }, []);

    useEffect(() => {
        if (walletAddress) {
            getGifList();
        }
    }, [walletAddress]);

    const connectWallet = async () => {
        try {
            const { solana } = window;
            if (solana) {
                const { publicKey } = await solana.connect();
                setWalletAddress(publicKey.toString());
            }
        } catch (error) {
            console.error(error);
        }
    };

    const sendGif = async () => {
        if (gifAddress.length) {
            try {
                const provider = getProvider();
                const program = new Program(idl, programID, provider);
                await program.rpc.addGif(gifAddress, {
                    accounts: {
                        baseAccount: baseAccount.publicKey,
                        user: provider.wallet.publicKey,
                    },
                });
                console.log("Gift send successfully");
                setGifAddress("");
                await getGifList();
            } catch (error) {
                console.error(`Error sending gif: ${error}`);
            }
        } else {
            console.warn("Gif address is empty, please set an address");
        }
    };

    const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;
        setGifAddress(value);
    };

    const getProvider = () => {
        const connection = new Connection(network, "processed");
        const provider = new AnchorProvider(connection, window.solana, {
            preflightCommitment: "processed",
        });
        return provider;
    };

    const createGifAccount = async () => {
        try {
            const provider = getProvider();
            const program = new Program(idl, programID, provider);
            await program.rpc.startStuffOff({
                accounts: {
                    baseAccount: baseAccount.publicKey,
                    user: provider.wallet.publicKey,
                    systemProgram: SystemProgram.programId,
                },
                signers: [baseAccount],
            });
            console.log(
                `Created new baseAccount w/ address : ${baseAccount.publicKey.toString()}`
            );
            await getGifList();
        } catch (error) {
            console.error(`Error creating baseAccount ${error}`);
        }
    };

    const getGifList = async () => {
        try {
            const provider = getProvider();
            const program = new Program(idl, programID, provider);
            const { gifList } = await program.account.baseAccount.fetch(
                baseAccount.publicKey
            );
            setGifList(gifList as Array<GifItem>);
        } catch (error) {
            console.error(`error getting gif list ${error}`);
            console.warn(baseAccount.publicKey.toString());
            setGifList([]);
        }
    };

    const RenderNotConnected = () => {
        return (
            <div>
                <button className="button" onClick={connectWallet}>
                    Connect wallet
                </button>
            </div>
        );
    };

    const RenderCreateBaseAccount = () => {
        return (
            <div>
                <button className="button connect" onClick={createGifAccount}>
                    Do one time Initialization for Gif Program Account
                </button>
            </div>
        );
    };

    const RenderConnectedContainer = () => {
        if (gifList === null) return <RenderCreateBaseAccount />;
        return (
            <div>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        sendGif();
                    }}
                    className="form"
                >
                    <input
                        className="input"
                        type="text"
                        placeholder="Enter GIF link"
                        value={gifAddress}
                        onChange={onInputChange}
                    />
                    <button className="button" type="submit">
                        Submit
                    </button>
                </form>
                <div className="gif-wall__container">
                    {gifList.map((item, index) => (
                        <div className="gif-wall__item" key={index}>
                            <img src={item.gifLink} alt={item.gifLink} />
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="App">
            <div className="container">
                <div>
                    <h1 className="title">Gif Portal</h1>
                    <p>View your GIF collection in the metaverse</p>
                </div>
                {!walletAddress && <RenderNotConnected />}
                {walletAddress && <RenderConnectedContainer />}
            </div>
        </div>
    );
};

export default App;
