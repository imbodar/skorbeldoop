import React, { useState } from 'react';
import { CaveExplorer } from './cave-explorer';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'game'>('home');

  if (currentPage === 'game') {
    return <CaveExplorer />;
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
            onClick={() => setCurrentPage('game')}
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
