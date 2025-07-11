import React, { useEffect, useState } from 'react';
import { PublicKey, Connection } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_VERCEL_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_VERCEL_SUPABASE_ANON_KEY;
console.log('Environment Variables:', process.env);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [hasToken, setHasToken] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [tokenBalance, setTokenBalance] = useState(0); // Initialize token balance to 0
  const [isFetchingBalance, setIsFetchingBalance] = useState(false); // Added state to track if balance is being fetched

  const TOKEN_ADDRESS = '6vhEL3UctR5s94ctmrPYVnEp9meDxJxVxcSidfcWpump';
  const RPC_ENDPOINT = 'https://go.getblock.io/4136d34f90a6488b84214ae26f0ed5f4';

  const getClickCount = async () => {
    const { data, error } = await supabase
      .from('taps')
      .select('counter')
      .eq('id', 1)
      .single();

    if (error) {
      console.error('Error fetching click count:', error);
      return 0;
    }

    return data.counter;
  };

  useEffect(() => {
    const unsubscribe = getClickCount().then(count => {
      setClickCount(count);
    });

    return () => unsubscribe;
  }, []);

  const checkTokenBalance = async (publicKeyStr) => {
    setIsFetchingBalance(true); // Set fetching balance to true
    try {
      const connection = new Connection(RPC_ENDPOINT);
      const accounts = await connection.getParsedTokenAccountsByOwner(
        new PublicKey(publicKeyStr),
        { mint: new PublicKey(TOKEN_ADDRESS) }
      );
      const balance =
        accounts.value[0]?.account?.data?.parsed?.info?.tokenAmount?.uiAmount || 0;
      setHasToken(balance > 0);
      setTokenBalance(balance); // Set token balance state
    } catch (error) {
      console.error('Error checking token balance:', error);
      setHasToken(false);
      setTokenBalance(0); // Reset token balance state on error
    } finally {
      setIsFetchingBalance(false); // Set fetching balance to false
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
    setTimeout(() => setClicked(false), 500);

    const { error } = await supabase
      .from('taps')
      .update({ counter: clickCount + 1 })
      .eq('id', 1);

    if (error) {
      console.error('Error updating click count:', error);
      return;
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

        {/* $TAPCOIN balance indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <p style={{ marginRight: '8px' }}>$TAPCOIN Balance:</p>
          <p>{isFetchingBalance ? 'Loading...' : tokenBalance}</p>
        </div>

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
          You must hold the token to tap. Creator private key will be revealed only to holders when we reach 1,000,000 clicks, 50% for me / 50% for the lucky and faster one.
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
          <p>First part of the private key: 5v6XE5tDcANWaj6Hcz6gvR15KuFnTkJAh4EXQM..., full will show at 1,000,000 clicks</p>
        </div>
      </div>
    </div>
  );
}
