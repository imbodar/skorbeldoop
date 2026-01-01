import React, { useState } from 'react';
import { CaveExplorer } from './cave-explorer';
import { CyanRectangle } from './cyan-rectangle';
import { RockPaperScissors } from './rock-paper-scissors';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'cave-explorer' | 'cyan-rectangle' | 'rock-paper-scissors'>('home');

  if (currentPage === 'cave-explorer') {
    return <CaveExplorer />;
  }

  if (currentPage === 'cyan-rectangle') {
    return <CyanRectangle />;
  }

  if (currentPage === 'rock-paper-scissors') {
    return <RockPaperScissors />;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px',
      boxSizing: 'border-box',
      overflow: 'auto'
    }}>
      <div style={{
        maxWidth: '90%',
        width: '800px',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '48px',
          marginBottom: '10px',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Skorbeldoop
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#666',
          marginBottom: '40px'
        }}>
          Welcome to your TypeScript Cloudflare Pages site!
        </p>

        <div style={{
          background: '#f8f9fa',
          borderRadius: '12px',
          padding: '30px',
          marginBottom: '30px'
        }}>
          <h2 style={{
            fontSize: '28px',
            marginBottom: '15px',
            color: '#333'
          }}>
            🎮 Cave Explorer
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#666',
            marginBottom: '20px',
            lineHeight: '1.6'
          }}>
            Navigate through massive procedurally-generated cave systems!<br />
            Hunt glowing fish to survive and avoid the giant leviathans.<br />
            <strong>Can you survive the depths?</strong>
          </p>
          <button
            onClick={() => setCurrentPage('cave-explorer')}
            style={{
              padding: '15px 40px',
              fontSize: '18px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #00d9ff, #0099cc)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0, 217, 255, 0.4)',
              transition: 'all 0.3s',
              fontFamily: 'inherit'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 217, 255, 0.6)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 217, 255, 0.4)';
            }}
          >
            Play Cave Explorer
          </button>
        </div>

        <div style={{
          background: '#f8f9fa',
          borderRadius: '12px',
          padding: '30px',
          marginBottom: '30px'
        }}>
          <h2 style={{
            fontSize: '28px',
            marginBottom: '15px',
            color: '#333'
          }}>
            🟦 Cyan Rectangle
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#666',
            marginBottom: '20px',
            lineHeight: '1.6'
          }}>
            Control a cyan rectangle in an open world!<br />
            Move around and explore the vast 5000x5000 map.<br />
            <strong>Simple and clean.</strong>
          </p>
          <button
            onClick={() => setCurrentPage('cyan-rectangle')}
            style={{
              padding: '15px 40px',
              fontSize: '18px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #00ffff, #00cccc)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0, 255, 255, 0.4)',
              transition: 'all 0.3s',
              fontFamily: 'inherit'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 255, 255, 0.6)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 255, 255, 0.4)';
            }}
          >
            Play Cyan Rectangle
          </button>
        </div>

        <div style={{
          background: '#f8f9fa',
          borderRadius: '12px',
          padding: '30px',
          marginBottom: '30px'
        }}>
          <h2 style={{
            fontSize: '28px',
            marginBottom: '15px',
            color: '#333'
          }}>
            ✊✋✌️ Rock Paper Scissors
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#666',
            marginBottom: '20px',
            lineHeight: '1.6'
          }}>
            Classic 2-player Rock Paper Scissors!<br />
            Player 1 uses W-A-S keys, Player 2 uses arrow keys.<br />
            <strong>Challenge your friend!</strong>
          </p>
          <button
            onClick={() => setCurrentPage('rock-paper-scissors')}
            style={{
              padding: '15px 40px',
              fontSize: '18px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #ff6b6b, #ee5a6f)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(255, 107, 107, 0.4)',
              transition: 'all 0.3s',
              fontFamily: 'inherit'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.6)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 107, 107, 0.4)';
            }}
          >
            Play Rock Paper Scissors
          </button>
        </div>

        <div style={{
          fontSize: '14px',
          color: '#999',
          marginTop: '30px'
        }}>
          <p>Built with Vite + TypeScript + React</p>
          <p>Hosted on Cloudflare Pages</p>
        </div>
      </div>
    </div>
  );
}
