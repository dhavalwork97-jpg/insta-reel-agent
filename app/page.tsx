"use client";

import { useState, useRef, useCallback } from "react";
import { editVideo, extractFrame, Template } from "@/lib/ffmpeg";

interface Song {
  title: string;
  artist: string;
  reason: string;
  pixabayKeyword: string;
  bpm: "slow" | "medium" | "fast";
}

interface Analysis {
  vibe: string;
  energy: "low" | "medium" | "high";
  mood: string;
  songs: Song[];
  templateTips: string[];
  hashtags: string[];
}

interface PixabayTrack {
  id: number;
  title: string;
  artist: string;
  duration: number;
  audioUrl: string;
  pageUrl: string;
}

const TEMPLATES: { id: Template; label: string; icon: string; desc: string }[] = [
  { id: "reels-crop", label: "Clean Reels", icon: "▯", desc: "9:16 crop, Instagram ready" },
  { id: "zoom-pulse", label: "Zoom Pulse", icon: "◎", desc: "Rhythmic zoom in/out" },
  { id: "glitch", label: "Glitch FX", icon: "⌁", desc: "RGB split distortion" },
  { id: "beat-sync", label: "Beat Sync", icon: "◈", desc: "Flash on the beat" },
];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [template, setTemplate] = useState<Template>("reels-crop");
  const [step, setStep] = useState<"upload" | "edit" | "result">("upload");
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [pixabayTracks, setPixabayTracks] = useState<PixabayTrack[]>([]);
  const [activeSong, setActiveSong] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingMusic, setLoadingMusic] = useState<string | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setVideoUrl(URL.createObjectURL(f));
    setStep("edit");
    setAnalysis(null);
    setOutputUrl(null);
    setPixabayTracks([]);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("video/")) handleFile(f);
  }, []);

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    try {
      const frameBase64 = await extractFrame(file);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frameBase64, template }),
      });
      const data = await res.json();
      setAnalysis(data);
    } catch (e) {
      console.error(e);
    }
    setIsAnalyzing(false);
  };

  const handleEdit = async () => {
    if (!file) return;
    setIsEditing(true);
    setProgress(0);
    try {
      const blob = await editVideo({
        template,
        inputFile: file,
        onProgress: setProgress,
      });
      setOutputUrl(URL.createObjectURL(blob));
      setStep("result");
    } catch (e) {
      console.error(e);
    }
    setIsEditing(false);
  };

  const fetchPixabay = async (keyword: string, songIdx: number) => {
    setLoadingMusic(keyword);
    setActiveSong(songIdx);
    try {
      const res = await fetch(`/api/music?q=${encodeURIComponent(keyword)}`);
      const data = await res.json();
      setPixabayTracks(data.tracks || []);
    } catch (e) {
      console.error(e);
    }
    setLoadingMusic(null);
  };

  const playTrack = (url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (playingUrl === url) {
      setPlayingUrl(null);
      return;
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play();
    setPlayingUrl(url);
    audio.onended = () => setPlayingUrl(null);
  };

  const energyColor = {
    low: "#64b5f6",
    medium: "#ffb74d",
    high: "#ef5350",
  };

  return (
    <main className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <span className="logo-icon">⬡</span>
          <span className="logo-text">REELCRAFT</span>
        </div>
        <p className="logo-sub">AI-powered Instagram Reel Editor</p>
      </header>

      {/* Step: Upload */}
      {step === "upload" && (
        <section className="upload-section">
          <div
            ref={dropRef}
            className="drop-zone"
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => document.getElementById("fileInput")?.click()}
          >
            <div className="drop-icon">⬆</div>
            <p className="drop-label">Drop your video here</p>
            <p className="drop-sub">MP4, MOV, WEBM · Any length</p>
            <input
              id="fileInput"
              type="file"
              accept="video/*"
              hidden
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
          <div className="feature-pills">
            <span className="pill">✦ 9:16 Auto-crop</span>
            <span className="pill">✦ Glitch & Zoom FX</span>
            <span className="pill">✦ AI Music Match</span>
            <span className="pill">✦ Free Pixabay Tracks</span>
          </div>
        </section>
      )}

      {/* Step: Edit */}
      {step === "edit" && videoUrl && (
        <section className="edit-section">
          <div className="two-col">
            {/* Left: Preview + controls */}
            <div className="left-panel">
              <div className="video-preview-wrap">
                <video src={videoUrl} controls className="video-preview" />
              </div>
              <p className="file-name">📁 {file?.name}</p>

              <h3 className="section-title">Choose Template</h3>
              <div className="template-grid">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    className={`template-card ${template === t.id ? "active" : ""}`}
                    onClick={() => setTemplate(t.id)}
                  >
                    <span className="t-icon">{t.icon}</span>
                    <span className="t-label">{t.label}</span>
                    <span className="t-desc">{t.desc}</span>
                  </button>
                ))}
              </div>

              <div className="action-row">
                <button
                  className="btn-primary"
                  onClick={handleEdit}
                  disabled={isEditing}
                >
                  {isEditing ? `Processing… ${progress}%` : "▶ Apply & Export"}
                </button>
                <button
                  className="btn-secondary"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? "Analyzing…" : "✦ AI Analyze"}
                </button>
              </div>

              {isEditing && (
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
              )}
            </div>

            {/* Right: Analysis */}
            <div className="right-panel">
              {!analysis && !isAnalyzing && (
                <div className="analysis-placeholder">
                  <p>Click <strong>✦ AI Analyze</strong> to get</p>
                  <ul>
                    <li>🎵 5 trending song matches</li>
                    <li>🎧 Free Pixabay music links</li>
                    <li>💡 Editing tips for your template</li>
                    <li>#️⃣ Hashtag pack</li>
                  </ul>
                </div>
              )}

              {isAnalyzing && (
                <div className="analyzing-state">
                  <div className="spinner" />
                  <p>Claude is reading your video vibe…</p>
                </div>
              )}

              {analysis && (
                <div className="analysis-results">
                  {/* Vibe card */}
                  <div className="vibe-card">
                    <div className="vibe-top">
                      <span
                        className="energy-badge"
                        style={{ background: energyColor[analysis.energy] }}
                      >
                        {analysis.energy.toUpperCase()} ENERGY
                      </span>
                      <span className="mood-tag">#{analysis.mood}</span>
                    </div>
                    <p className="vibe-text">{analysis.vibe}</p>
                  </div>

                  {/* Songs */}
                  <h3 className="section-title">🎵 Trending Song Matches</h3>
                  <div className="songs-list">
                    {analysis.songs.map((song, i) => (
                      <div key={i} className="song-card">
                        <div className="song-info">
                          <div className="song-meta">
                            <span className="song-title">{song.title}</span>
                            <span className="song-artist">by {song.artist}</span>
                          </div>
                          <span className={`bpm-tag bpm-${song.bpm}`}>{song.bpm}</span>
                        </div>
                        <p className="song-reason">{song.reason}</p>
                        <button
                          className="pixabay-btn"
                          onClick={() => fetchPixabay(song.pixabayKeyword, i)}
                          disabled={loadingMusic === song.pixabayKeyword}
                        >
                          {loadingMusic === song.pixabayKeyword
                            ? "Searching…"
                            : `🎧 Find free: "${song.pixabayKeyword}"`}
                        </button>

                        {/* Pixabay results for this song */}
                        {activeSong === i && pixabayTracks.length > 0 && (
                          <div className="pixabay-tracks">
                            {pixabayTracks.map((track) => (
                              <div key={track.id} className="track-row">
                                <button
                                  className="play-btn"
                                  onClick={() => playTrack(track.audioUrl)}
                                >
                                  {playingUrl === track.audioUrl ? "⏸" : "▶"}
                                </button>
                                <div className="track-meta">
                                  <span className="track-title">{track.title}</span>
                                  <span className="track-artist">{track.artist} · {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, "0")}</span>
                                </div>
                                <a
                                  href={track.pageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="download-link"
                                >
                                  ↓
                                </a>
                              </div>
                            ))}
                          </div>
                        )}

                        {activeSong === i && pixabayTracks.length === 0 && !loadingMusic && (
                          <p className="no-tracks">No tracks found — try a different keyword</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Template Tips */}
                  <h3 className="section-title">💡 Editing Tips</h3>
                  <ul className="tips-list">
                    {analysis.templateTips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>

                  {/* Hashtags */}
                  <h3 className="section-title">#️⃣ Hashtag Pack</h3>
                  <div className="hashtag-cloud">
                    {analysis.hashtags.map((tag, i) => (
                      <span
                        key={i}
                        className="hashtag"
                        onClick={() => navigator.clipboard.writeText(tag)}
                        title="Click to copy"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="copy-hint">Tap a hashtag to copy it</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Step: Result */}
      {step === "result" && outputUrl && (
        <section className="result-section">
          <div className="result-header">
            <span className="result-badge">✦ Reel Ready</span>
            <h2>Your edited video</h2>
          </div>
          <div className="result-wrap">
            <div className="reel-frame">
              <video src={outputUrl} controls autoPlay loop className="output-video" />
            </div>
            <div className="result-actions">
              <a href={outputUrl} download="reel.mp4" className="btn-primary">
                ↓ Download Reel
              </a>
              <button
                className="btn-secondary"
                onClick={() => { setStep("edit"); setOutputUrl(null); }}
              >
                ← Try another template
              </button>
              <button
                className="btn-ghost"
                onClick={() => { setStep("upload"); setFile(null); setVideoUrl(null); setAnalysis(null); setOutputUrl(null); }}
              >
                Upload new video
              </button>
            </div>
          </div>
        </section>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #080b0f;
          color: #e8eaf0;
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
        }

        .app {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px 16px 80px;
        }

        /* Header */
        .header {
          display: flex;
          align-items: baseline;
          gap: 16px;
          padding: 0 0 32px;
          border-bottom: 1px solid #1a1f2b;
          margin-bottom: 40px;
        }
        .logo { display: flex; align-items: center; gap: 10px; }
        .logo-icon { font-size: 28px; color: #ff6b35; }
        .logo-text {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 32px;
          letter-spacing: 4px;
          color: #fff;
        }
        .logo-sub { color: #4a5568; font-size: 13px; font-weight: 300; }

        /* Upload */
        .upload-section { display: flex; flex-direction: column; align-items: center; gap: 32px; padding: 60px 0; }
        .drop-zone {
          width: 100%;
          max-width: 520px;
          border: 2px dashed #2a3040;
          border-radius: 20px;
          padding: 64px 32px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: #0d1117;
        }
        .drop-zone:hover { border-color: #ff6b35; background: #0f1520; }
        .drop-icon { font-size: 48px; margin-bottom: 16px; color: #ff6b35; }
        .drop-label { font-size: 22px; font-weight: 600; margin-bottom: 8px; }
        .drop-sub { color: #4a5568; font-size: 14px; }

        .feature-pills { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
        .pill {
          padding: 8px 16px;
          border-radius: 100px;
          border: 1px solid #2a3040;
          font-size: 13px;
          color: #8892a4;
          background: #0d1117;
        }

        /* Edit layout */
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
        @media (max-width: 800px) { .two-col { grid-template-columns: 1fr; } }

        .left-panel, .right-panel { display: flex; flex-direction: column; gap: 20px; }

        .video-preview-wrap {
          border-radius: 16px;
          overflow: hidden;
          background: #0d1117;
          border: 1px solid #1a1f2b;
        }
        .video-preview { width: 100%; max-height: 320px; object-fit: contain; display: block; }
        .file-name { font-size: 12px; color: #4a5568; }

        .section-title {
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #ff6b35;
          margin-top: 4px;
        }

        .template-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .template-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 16px 12px;
          border-radius: 14px;
          border: 1.5px solid #1a1f2b;
          background: #0d1117;
          cursor: pointer;
          transition: all 0.15s;
          text-align: center;
        }
        .template-card:hover { border-color: #ff6b35; }
        .template-card.active { border-color: #ff6b35; background: #1a0f08; }
        .t-icon { font-size: 24px; color: #ff6b35; }
        .t-label { font-size: 13px; font-weight: 600; }
        .t-desc { font-size: 11px; color: #4a5568; }

        .action-row { display: flex; gap: 12px; }
        .btn-primary {
          flex: 1;
          padding: 14px;
          background: #ff6b35;
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
          text-align: center;
          text-decoration: none;
          display: inline-block;
        }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-primary:hover:not(:disabled) { opacity: 0.88; }

        .btn-secondary {
          flex: 1;
          padding: 14px;
          background: transparent;
          color: #ff6b35;
          border: 1.5px solid #ff6b35;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-secondary:hover:not(:disabled) { background: #1a0f08; }

        .btn-ghost {
          padding: 14px 20px;
          background: transparent;
          color: #4a5568;
          border: 1px solid #2a3040;
          border-radius: 12px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-ghost:hover { color: #e8eaf0; border-color: #4a5568; }

        .progress-bar {
          height: 4px;
          background: #1a1f2b;
          border-radius: 2px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: #ff6b35;
          border-radius: 2px;
          transition: width 0.3s;
        }

        /* Analysis */
        .analysis-placeholder {
          border: 1px dashed #2a3040;
          border-radius: 16px;
          padding: 32px;
          color: #4a5568;
          font-size: 14px;
          line-height: 1.8;
        }
        .analysis-placeholder strong { color: #ff6b35; }
        .analysis-placeholder ul { padding-left: 20px; margin-top: 12px; }

        .analyzing-state { text-align: center; padding: 60px 0; color: #4a5568; }
        .spinner {
          width: 40px; height: 40px;
          border: 3px solid #1a1f2b;
          border-top-color: #ff6b35;
          border-radius: 50%;
          margin: 0 auto 16px;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .vibe-card {
          background: #0d1117;
          border: 1px solid #1a1f2b;
          border-radius: 16px;
          padding: 20px;
        }
        .vibe-top { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; }
        .energy-badge {
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 700;
          color: #fff;
          letter-spacing: 1px;
        }
        .mood-tag { color: #4a5568; font-size: 13px; }
        .vibe-text { font-size: 14px; line-height: 1.6; color: #b0bac8; }

        .songs-list { display: flex; flex-direction: column; gap: 12px; }
        .song-card {
          background: #0d1117;
          border: 1px solid #1a1f2b;
          border-radius: 14px;
          padding: 16px;
        }
        .song-info { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
        .song-meta { display: flex; flex-direction: column; gap: 2px; }
        .song-title { font-size: 14px; font-weight: 600; }
        .song-artist { font-size: 12px; color: #4a5568; }
        .bpm-tag {
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .bpm-slow { background: #1a2a3a; color: #64b5f6; }
        .bpm-medium { background: #2a1f0a; color: #ffb74d; }
        .bpm-fast { background: #2a0f0f; color: #ef5350; }
        .song-reason { font-size: 12px; color: #8892a4; margin-bottom: 10px; line-height: 1.5; }

        .pixabay-btn {
          font-size: 12px;
          color: #ff6b35;
          background: transparent;
          border: 1px solid #2a1a10;
          border-radius: 8px;
          padding: 6px 12px;
          cursor: pointer;
          transition: all 0.15s;
          width: 100%;
          text-align: left;
        }
        .pixabay-btn:hover { background: #1a0f08; }
        .pixabay-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .pixabay-tracks {
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          border-top: 1px solid #1a1f2b;
          padding-top: 10px;
        }
        .track-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .play-btn {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: #ff6b35;
          color: #fff;
          border: none;
          cursor: pointer;
          font-size: 12px;
          flex-shrink: 0;
          transition: opacity 0.2s;
        }
        .play-btn:hover { opacity: 0.8; }
        .track-meta { flex: 1; min-width: 0; }
        .track-title { display: block; font-size: 12px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .track-artist { font-size: 11px; color: #4a5568; }
        .download-link {
          color: #ff6b35;
          font-size: 16px;
          text-decoration: none;
          flex-shrink: 0;
          padding: 4px 8px;
          border: 1px solid #2a1a10;
          border-radius: 6px;
          transition: background 0.15s;
        }
        .download-link:hover { background: #1a0f08; }
        .no-tracks { font-size: 12px; color: #4a5568; margin-top: 8px; }

        .tips-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .tips-list li {
          font-size: 13px;
          color: #b0bac8;
          padding: 10px 14px;
          background: #0d1117;
          border-left: 3px solid #ff6b35;
          border-radius: 0 10px 10px 0;
          line-height: 1.5;
        }

        .hashtag-cloud { display: flex; flex-wrap: wrap; gap: 8px; }
        .hashtag {
          padding: 6px 12px;
          background: #0d1117;
          border: 1px solid #2a3040;
          border-radius: 8px;
          font-size: 12px;
          color: #64b5f6;
          cursor: pointer;
          transition: all 0.15s;
        }
        .hashtag:hover { background: #1a2030; border-color: #64b5f6; }
        .copy-hint { font-size: 11px; color: #4a5568; }

        /* Result */
        .result-section { display: flex; flex-direction: column; gap: 32px; }
        .result-header { text-align: center; }
        .result-badge {
          display: inline-block;
          padding: 6px 16px;
          background: #1a0f08;
          border: 1px solid #ff6b35;
          color: #ff6b35;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 2px;
          margin-bottom: 12px;
        }
        .result-header h2 { font-family: 'Bebas Neue', sans-serif; font-size: 40px; letter-spacing: 3px; }

        .result-wrap { display: flex; gap: 40px; justify-content: center; align-items: flex-start; }
        @media (max-width: 700px) { .result-wrap { flex-direction: column; align-items: center; } }

        .reel-frame {
          width: 280px;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid #2a3040;
          flex-shrink: 0;
          box-shadow: 0 20px 60px rgba(255,107,53,0.15);
        }
        .output-video { width: 100%; display: block; }

        .result-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-top: 20px;
          min-width: 200px;
        }
      `}</style>
    </main>
  );
}
