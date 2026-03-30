'use client';
import React, { useState } from 'react';
import './blendwit.css';

export default function HomePage({ data }: { data: any }) {
    const [viewMode, setViewMode] = useState<'ring' | 'grid'>('ring');

    return (
        <div className="blendwit-theme bg-black min-h-screen text-white overflow-hidden font-sans">
            {/* Hero Section */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black z-10 pointer-events-none" />
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                >
                    <source src="/assets/hero-reel.mp4" type="video/mp4" />
                </video>

                <div className="relative z-20 text-center max-w-5xl px-6">
                    <h1 className="text-7xl md:text-9xl font-bold tracking-tighter mb-8 mix-blend-overlay opacity-90 animate-fade-in-up">
                        ARCHITECTURAL<br />ELEGANCE
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-300 font-light tracking-widest uppercase animate-fade-in-up delay-100">
                        Designing the Future of Spacer
                    </p>
                </div>
            </section>

            {/* Curvy Reel Section */}
            <section className="py-32 relative z-20 overflow-visible">
                <div className="curvy-reel-container">
                    <div className="curvy-track">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="reel-item">
                                <div className="aspect-[9/16] bg-gray-800 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                                    <img src={`/assets/project-${i}.jpg`} alt={`Project ${i}`} className="w-full h-full object-cover" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Portfolio Section */}
            <section className="py-32 px-6 max-w-7xl mx-auto z-20 relative">
                <div className="flex justify-between items-end mb-20">
                    <div>
                        <h2 className="text-5xl font-bold mb-4">Selected Works</h2>
                        <div className="h-1 w-20 bg-white/20" />
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setViewMode('ring')}
                            className={`px-6 py-2 rounded-full border border-white/20 transition-all ${viewMode === 'ring' ? 'bg-white text-black' : 'hover:bg-white/10'}`}
                        >
                            Ring View
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-6 py-2 rounded-full border border-white/20 transition-all ${viewMode === 'grid' ? 'bg-white text-black' : 'hover:bg-white/10'}`}
                        >
                            Grid View
                        </button>
                    </div>
                </div>

                {viewMode === 'ring' ? (
                    <div className="perspective-3d h-[600px] flex items-center justify-center">
                        <div className="ring-container animate-spin-slow">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                <div key={i} className="ring-item" style={{ transform: `rotateY(${i * 45}deg) translateZ(500px)` }}>
                                    <div className="w-[300px] aspect-[4/5] bg-gray-900 border border-white/10 p-4 transition-transform hover:scale-105 hover:border-white/40 cursor-pointer">
                                        <div className="h-full bg-gray-800" />
                                        <div className="mt-4 text-sm font-bold tracking-widest">PROJECT 0{i}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="group cursor-pointer">
                                <div className="aspect-[4/5] bg-gray-900 mb-4 overflow-hidden border border-white/5 group-hover:border-white/20 transition-all">
                                    <div className="w-full h-full bg-gray-800 group-hover:scale-105 transition-transform duration-700" />
                                </div>
                                <h3 className="text-lg font-bold">Project Title {i}</h3>
                                <p className="text-gray-500 text-sm">Category</p>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
