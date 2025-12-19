'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';

interface GameStats {
  score: number;
  cupsCompleted: number;
  totalSpilled: number;
  xpEarned: number;
}

export default function PourTeaGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const pouringRef = useRef<boolean>(false);
  const fillLevelRef = useRef<number>(0);
  const pourSpeedRef = useRef<number>(0.5);
  const targetFillRef = useRef<number>(85); // Target fill percentage
  const difficultyRef = useRef<number>(1);
  
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'success' | 'spilled' | 'gameover'>('menu');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    cupsCompleted: 0,
    totalSpilled: 0,
    xpEarned: 0,
  });
  const [currentFill, setCurrentFill] = useState<number>(0);
  const [isPressing, setIsPressing] = useState<boolean>(false);
  
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    return () => window.removeEventListener('resize', resize);
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background
      drawBackground(ctx, canvas.width, canvas.height);

      // Update fill level if pouring
      if (pouringRef.current && fillLevelRef.current < 100) {
        fillLevelRef.current += pourSpeedRef.current;
        setCurrentFill(fillLevelRef.current);

        // Check if spilled (overfilled)
        if (fillLevelRef.current >= 100) {
          setGameState('spilled');
          setStats(prev => ({
            ...prev,
            totalSpilled: prev.totalSpilled + 1,
          }));
          return;
        }
      }

      // Draw teapot
      drawTeapot(ctx, canvas.width, canvas.height, pouringRef.current);

      // Draw cup
      drawCup(ctx, canvas.width, canvas.height, fillLevelRef.current);

      // Draw tea stream if pouring
      if (pouringRef.current) {
        drawTeaStream(ctx, canvas.width, canvas.height);
      }

      // Draw fill indicator
      drawFillIndicator(ctx, canvas.width, canvas.height, fillLevelRef.current, targetFillRef.current);

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState]);

  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#2d3748');
    gradient.addColorStop(1, '#1a202c');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  };

  const drawTeapot = (ctx: CanvasRenderingContext2D, width: number, height: number, pouring: boolean) => {
    const centerX = width / 2 - 150;
    const centerY = height / 3;
    const tilt = pouring ? 45 : 0;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((tilt * Math.PI) / 180);

    // Teapot body
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.ellipse(0, 0, 60, 50, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Teapot spout
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.moveTo(50, 0);
    ctx.lineTo(80, 20);
    ctx.lineTo(80, -20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Teapot lid
    ctx.fillStyle = '#654321';
    ctx.beginPath();
    ctx.ellipse(0, -35, 30, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Lid knob
    ctx.fillStyle = '#D4AF37';
    ctx.beginPath();
    ctx.arc(0, -45, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const drawCup = (ctx: CanvasRenderingContext2D, width: number, height: number, fillLevel: number) => {
    const cupX = width / 2 + 80;
    const cupY = height / 2 + 50;
    const cupWidth = 120;
    const cupHeight = 150;

    // Cup outline (trapezoid shape)
    ctx.fillStyle = '#F5F5DC';
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.moveTo(cupX - cupWidth / 2 + 10, cupY);
    ctx.lineTo(cupX - cupWidth / 2, cupY + cupHeight);
    ctx.lineTo(cupX + cupWidth / 2, cupY + cupHeight);
    ctx.lineTo(cupX + cupWidth / 2 - 10, cupY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tea fill
    if (fillLevel > 0) {
      const teaHeight = (fillLevel / 100) * cupHeight;
      const teaY = cupY + cupHeight - teaHeight;
      
      ctx.fillStyle = fillLevel > 95 ? '#8B0000' : '#D2691E';
      ctx.beginPath();
      ctx.moveTo(cupX - cupWidth / 2 + 5, cupY + cupHeight);
      ctx.lineTo(cupX + cupWidth / 2 - 5, cupY + cupHeight);
      ctx.lineTo(cupX + cupWidth / 2 - 8, teaY);
      ctx.lineTo(cupX - cupWidth / 2 + 8, teaY);
      ctx.closePath();
      ctx.fill();

      // Tea surface shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(cupX - 30, teaY, 60, 5);
    }

    // Cup handle
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cupX + cupWidth / 2 + 10, cupY + cupHeight / 2, 30, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
  };

  const drawTeaStream = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const startX = width / 2 - 90;
    const startY = height / 3 + 20;
    const endX = width / 2 + 80;
    const endY = height / 2 + 50;

    ctx.strokeStyle = '#D2691E';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    
    // Curved stream
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(
      startX + 50, startY + 100,
      endX, endY
    );
    ctx.stroke();
  };

  const drawFillIndicator = (ctx: CanvasRenderingContext2D, width: number, height: number, fillLevel: number, target: number) => {
    const indicatorX = width - 100;
    const indicatorY = 100;
    const indicatorHeight = 300;

    // Background bar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(indicatorX, indicatorY, 40, indicatorHeight);

    // Target zone (green)
    const targetY = indicatorY + indicatorHeight - (target / 100) * indicatorHeight;
    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.fillRect(indicatorX, targetY - 20, 40, 40);

    // Current fill level
    const currentHeight = (fillLevel / 100) * indicatorHeight;
    const fillY = indicatorY + indicatorHeight - currentHeight;
    
    ctx.fillStyle = fillLevel > 95 ? '#FF0000' : fillLevel > target - 5 && fillLevel < target + 5 ? '#00FF00' : '#D2691E';
    ctx.fillRect(indicatorX, fillY, 40, currentHeight);

    // Percentage text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(fillLevel)}%`, indicatorX + 20, indicatorY - 10);
    ctx.fillText(`Target: ${target}%`, indicatorX + 20, indicatorY + indicatorHeight + 30);
  };

  const startPouring = () => {
    pouringRef.current = true;
    setIsPressing(true);
  };

  const stopPouring = () => {
    pouringRef.current = false;
    setIsPressing(false);

    // Check if in target zone
    const fill = fillLevelRef.current;
    const target = targetFillRef.current;
    
    if (fill >= target - 5 && fill <= target + 5) {
      // Perfect pour!
      const points = Math.round(100 * difficultyRef.current);
      const xp = Math.round(20 * difficultyRef.current);
      
      setStats(prev => ({
        score: prev.score + points,
        cupsCompleted: prev.cupsCompleted + 1,
        totalSpilled: prev.totalSpilled,
        xpEarned: prev.xpEarned + xp,
      }));
      
      setGameState('success');
    } else if (fill < target - 5) {
      // Underfilled - try again
      fillLevelRef.current = 0;
      setCurrentFill(0);
    }
  };

  const nextCup = () => {
    fillLevelRef.current = 0;
    setCurrentFill(0);
    difficultyRef.current += 0.1;
    pourSpeedRef.current += 0.05;
    targetFillRef.current = 80 + Math.random() * 10; // Random target 80-90%
    setGameState('playing');
  };

  const startGame = () => {
    fillLevelRef.current = 0;
    pourSpeedRef.current = 0.5;
    difficultyRef.current = 1;
    targetFillRef.current = 85;
    setCurrentFill(0);
    setStats({
      score: 0,
      cupsCompleted: 0,
      totalSpilled: 0,
      xpEarned: 0,
    });
    setGameState('playing');
  };

  const quitGame = () => {
    setGameState('menu');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-800 to-gray-900">
      <Header />
      
      <main id="main-content" className="flex-1 pt-20 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Game Title */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold font-serif text-yellow-400 mb-2">
              🫖 Perfect Pour
            </h1>
            <p className="text-gray-300">
              Fill the cup to perfection without spilling a drop!
            </p>
          </div>

          {/* Game Canvas Container */}
          <div className="relative bg-gradient-to-b from-gray-700 to-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-yellow-600">
            <canvas
              ref={canvasRef}
              onMouseDown={gameState === 'playing' ? startPouring : undefined}
              onMouseUp={gameState === 'playing' ? stopPouring : undefined}
              onMouseLeave={gameState === 'playing' ? stopPouring : undefined}
              onTouchStart={gameState === 'playing' ? startPouring : undefined}
              onTouchEnd={gameState === 'playing' ? stopPouring : undefined}
              className="w-full h-[500px] cursor-pointer touch-none"
              style={{ touchAction: 'none' }}
            />

            {/* Instruction Overlay (during gameplay) */}
            {gameState === 'playing' && (
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-6 py-3 rounded-lg pointer-events-none">
                <div className="text-white text-lg font-bold mb-1">
                  {isPressing ? '🫖 Pouring...' : 'Press & Hold to Pour'}
                </div>
                <div className="text-yellow-400">
                  Score: {stats.score} | Cups: {stats.cupsCompleted}
                </div>
              </div>
            )}

            {/* Menu Overlay */}
            {gameState === 'menu' && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center text-white p-8 max-w-md">
                  <h2 className="text-3xl font-bold mb-4 text-yellow-400">How to Play</h2>
                  <div className="text-left space-y-3 mb-6 text-gray-200">
                    <p>🫖 <strong>Press and hold</strong> to pour tea into the cup</p>
                    <p>🎯 <strong>Release</strong> when the cup is in the green zone</p>
                    <p>⚠️ <strong>Don&apos;t overfill</strong> or you&apos;ll spill!</p>
                    <p>⚡ Each round gets <strong>faster and harder</strong></p>
                    <p>🏆 Perfect pours earn <strong>XP and points</strong></p>
                  </div>

                  <button
                    onClick={startGame}
                    className="ornate-button px-8 py-3 text-black font-bold text-lg rounded-lg w-full mb-3"
                  >
                    🫖 Start Pouring
                  </button>
                  
                  <button
                    onClick={() => router.push('/games/forage')}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ← Play Herbalist&apos;s Run Instead
                  </button>
                </div>
              </div>
            )}

            {/* Success Overlay */}
            {gameState === 'success' && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center text-white p-8">
                  <h2 className="text-4xl font-bold mb-4 text-green-400">Perfect Pour! 🎉</h2>
                  <p className="text-xl mb-6">You filled it just right!</p>
                  
                  <div className="bg-green-900/50 rounded-lg p-6 mb-6">
                    <div className="text-2xl font-bold text-yellow-400 mb-2">
                      Score: {stats.score}
                    </div>
                    <div className="text-lg text-green-300">
                      Cups Completed: {stats.cupsCompleted}
                    </div>
                    {isAuthenticated && (
                      <div className="text-lg text-purple-300 mt-2">
                        XP Earned: {stats.xpEarned}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={nextCup}
                      className="ornate-button px-8 py-3 text-black font-bold text-lg rounded-lg w-full"
                    >
                      ☕ Next Cup (Harder!)
                    </button>
                    <button
                      onClick={quitGame}
                      className="bg-gray-700 hover:bg-gray-600 px-8 py-3 text-white font-bold rounded-lg w-full transition-colors"
                    >
                      🏠 Quit to Menu
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Spilled Overlay */}
            {gameState === 'spilled' && (
              <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center text-white p-8 max-w-md">
                  <h2 className="text-4xl font-bold mb-4 text-red-400">Spilled! 💦</h2>
                  <p className="text-gray-300 mb-6">You overfilled the cup!</p>
                  
                  <div className="bg-red-900/50 rounded-lg p-6 mb-6">
                    <div className="text-2xl font-bold text-yellow-400 mb-2">
                      Final Score: {stats.score}
                    </div>
                    <div className="text-lg text-green-300">
                      ✅ Cups Completed: {stats.cupsCompleted}
                    </div>
                    <div className="text-lg text-red-300">
                      💧 Times Spilled: {stats.totalSpilled}
                    </div>
                    {isAuthenticated && (
                      <div className="text-lg text-purple-300 mt-2">
                        🎁 Total XP: {stats.xpEarned}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={startGame}
                      className="ornate-button px-8 py-3 text-black font-bold text-lg rounded-lg w-full"
                    >
                      🔄 Try Again
                    </button>
                    <button
                      onClick={() => router.push('/')}
                      className="bg-gray-700 hover:bg-gray-600 px-8 py-3 text-white font-bold rounded-lg w-full transition-colors"
                    >
                      🏠 Back to Home
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Instructions Below Canvas */}
          <div className="mt-6 text-center text-gray-300 text-sm">
            <p>💡 Tip: Release early! It&apos;s better to underfill than overfill.</p>
            {!isAuthenticated && (
              <p className="mt-2 text-yellow-300">
                🔐 <a href="/account" className="underline">Sign in</a> to save your XP!
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
