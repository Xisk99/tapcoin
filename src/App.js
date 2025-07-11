import React, { useEffect, useState } from 'react';
import { PublicKey, Connection } from '@solana/web3.js';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, increment } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCFXeIdfLbid7H5o6w0cve-snURAka0d7E",
  authDomain: "tapcoin-336ca.firebaseapp.com",
  projectId: "tapcoin-336ca",
  storageBucket: "tapcoin-336ca.firebasestorage.app",
  messagingSenderId: "546350623544",
  appId: "1:546350623544:web:8dba4be4738567da25afcd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [hasToken, setHasToken] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  const TOKEN_ADDRESS = '6ZoXwAMUT5HpB4Lg2Bt5bz5iTnEhUrfuBKJgstkwpump';
  const RPC_ENDPOINT = 'https://go.getblock.io/4136d34f90a6488b84214ae26f0ed5f4';

  const getClickCount = async () => {
    const docRef = doc(db, "counter", "taps");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().count;
    } else {
      return 0;
    }
  };

  useEffect(() => {
    const unsubscribe = getClickCount().then(count => {
      setClickCount(count);
    });

    return () => unsubscribe;
  }, []);

  const checkTokenBalance = async (publicKeyStr) => {
    try {
      const connection = new Connection(RPC_ENDPOINT);
      const accounts = await connection.getParsedTokenAccountsByOwner(
        new PublicKey(publicKeyStr),
        { mint: new PublicKey(TOKEN_ADDRESS) }
      );
      const balance =
        accounts.value[0]?.account?.data?.parsed?.info?.tokenAmount?.uiAmount || 0;
      setHasToken(balance > 0);
    } catch (error) {
      console.error('Error checking token balance:', error);
      setHasToken(false);
    }
  };

  const connectWallet = async () => {
    try {
      const { solana } = window;
      if (solana?.isPhantom) {
        const response = await solana.connect();
        console.log('Wallet connected:', response.publicKey.toString());
        setWalletAddress(response.publicKey.toString());
        checkTokenBalance(response.publicKey.toString());
      } else {
        alert('Phantom Wallet not found! Please install it.');
      }
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleClick = async () => {
    if (!walletAddress) {
      alert('You need to connect your Phantom Wallet and hold at least 1 $TAPCOIN to play.');
      return;
    }
    if (!hasToken) {
      alert('You need at least 1 $TAPCOIN to play.');
      return;
    }
    if (Date.now() - lastClickTime < 200) {
      return;
    }
    setLastClickTime(Date.now());
    setClicked(true);
    setTimeout(() => setClicked(false), 200);

    const docRef = doc(db, "counter", "taps");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await setDoc(docRef, { count: increment(1) }, { merge: true });
    } else {
      await setDoc(docRef, { count: 1 });
    }
    const count = await getClickCount();
    setClickCount(count);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Contenido */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Botón de conexión */}
        <button
          onClick={connectWallet}
          style={{
            backgroundColor: '#551A8B',
            color: 'white',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '9999px',
            cursor: 'pointer',
            marginBottom: '16px'
          }}
        >
          {walletAddress ?? "Connect Phantom Wallet"}
        </button>

        {/* Imagen */}
        <div
          onClick={handleClick}
          style={{
            cursor: 'pointer',
            transform: clicked ? 'scale(0.95)' : 'scale(1)',
            transition: 'transform 0.2s',
            height: 'full'
          }}
        >
          <img
            src="/tapcoin.png"
            alt="TapCoin"
            style={{ width: '320px', height: '320px', objectFit: 'contain' }}
          />
        </div>

        {/* Texto */}
        <p style={{
          textAlign: 'center',
          fontSize: '20px',
          fontWeight: 'bold',
          marginTop: '24px',
          marginLeft: '16px',
          marginRight: '16px'
        }}>
          You must hold the token to tap. Creator private key will be revealed only to holders when we reach 1,000,000,000 clicks, 50% for me / 50% for the lucky and faster one.
        </p>

        {/* Contador */}
        <p style={{ textAlign: 'center', fontSize: '18px', marginTop: '8px' }}>
          Current clicks: {clickCount}
        </p>

        {/* Botón pumpfun */}
        <a
          href="https://pump.fun"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            marginTop: '16px',
            backgroundColor: 'black',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '9999px',
            textDecoration: 'none',
            display: 'inline-block'
          }}
        >
          Buy the token on pumpfun
        </a>

        {/* Placeholder private key box */}
        <div style={{
          backgroundColor: 'lightgray',
          padding: '16px',
          marginTop: '16px',
          borderRadius: '8px'
        }}>
          <p>Placeholder private key, will show at 100,000,000 clicks</p>
        </div>
      </div>
    </div>
  );
}
