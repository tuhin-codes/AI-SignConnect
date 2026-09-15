/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  AlertCircle,
  Loader2,
  Shield,
  RefreshCw,
} from 'lucide-react';
import {
  initializeHandLandmarker,
  detectVideoFrame,
  disposeHandLandmarker,
  type HandLandmarkerResult,
} from '../../services/handLandmarkerService.ts';
import {
  HandLandmarkOverlay,
  type HandLandmarkOverlayHandle,
} from './HandLandmarkOverlay.tsx';

export type CameraStatus = 'idle' | 'starting' | 'active' | 'error';
export type MediaPipeStatus = 'idle' | 'loading' | 'ready' | 'error';

export function CameraCapture() {
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mediaPipeStatus, setMediaPipeStatus] = useState<MediaPipeStatus>('idle');
  const [detectedHandsCount, setDetectedHandsCount] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const overlayRef = useRef<HandLandmarkOverlayHandle | null>(null);

  // References for strict single inference loop management
  const requestAnimationRef = useRef<number | null>(null);
  const isLoopRunningRef = useRef<boolean>(false);
  const lastTimestampRef = useRef<number>(0);
  const lastLogTimeRef = useRef<number>(0);
  const lastHandsCountRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const fpsStartTimeRef = useRef<number>(0);
  const lastInferenceDurationRef = useRef<number>(0);

  const stopCamera = useCallback(() => {
    // Immediately halt inference loop
    isLoopRunningRef.current = false;
    if (requestAnimationRef.current !== null) {
      cancelAnimationFrame(requestAnimationRef.current);
      requestAnimationRef.current = null;
    }

    // Clear landmark overlay
    if (overlayRef.current) {
      overlayRef.current.clear();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setDetectedHandsCount(0);
    setStatus('idle');
  }, []);

  const startCamera = async () => {
    if (status === 'starting' || status === 'active') return;

    // Release any previous stream references before acquiring a new one
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setStatus('starting');
    setErrorMessage(null);

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setStatus('error');
      setErrorMessage('Your browser does not support camera access.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {
          // Play request handled safely
        }
      }

      setStatus('active');
    } catch (err: unknown) {
      // Clean up stream if failure occurs mid-initialization
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setStatus('error');

      if (err instanceof DOMException) {
        if (
          err.name === 'NotAllowedError' ||
          err.name === 'PermissionDeniedError'
        ) {
          setErrorMessage(
            'Camera permission was denied. Please allow camera access in your browser settings.'
          );
        } else if (
          err.name === 'NotFoundError' ||
          err.name === 'DevicesNotFoundError'
        ) {
          setErrorMessage('No camera was detected on this device.');
        } else if (
          err.name === 'NotReadableError' ||
          err.name === 'TrackStartError'
        ) {
          setErrorMessage(
            'Camera is currently in use by another application or unavailable.'
          );
        } else if (err.name === 'OverconstrainedError') {
          setErrorMessage(
            'Requested camera settings are not supported by your device camera.'
          );
        } else {
          setErrorMessage('Unable to access the camera. Please try again.');
        }
      } else {
        setErrorMessage('Unable to access the camera. Please try again.');
      }
    }
  };

  // Manage MediaPipe HandLandmarker inference loop tied strictly to active camera state
  useEffect(() => {
    if (status !== 'active') {
      isLoopRunningRef.current = false;
      if (requestAnimationRef.current !== null) {
        cancelAnimationFrame(requestAnimationRef.current);
        requestAnimationRef.current = null;
      }
      if (overlayRef.current) {
        overlayRef.current.clear();
      }
      setDetectedHandsCount(0);
      setMediaPipeStatus('idle');
      return;
    }

    let isMounted = true;
    isLoopRunningRef.current = true;
    setMediaPipeStatus('loading');

    const startInference = async () => {
      try {
        await initializeHandLandmarker();
        if (!isMounted || !isLoopRunningRef.current) return;

        setMediaPipeStatus('ready');
        console.log('[MediaPipe] HandLandmarker ready. Commencing video inference loop.');

        fpsStartTimeRef.current = performance.now();
        frameCountRef.current = 0;

        const loop = () => {
          if (!isLoopRunningRef.current) return;

          const video = videoRef.current;
          if (video && video.readyState >= 2 && video.videoWidth > 0) {
            const now = performance.now();
            const timestamp = Math.max(now, (lastTimestampRef.current || 0) + 1);
            lastTimestampRef.current = timestamp;

            const inferStart = performance.now();
            const result: HandLandmarkerResult | null = detectVideoFrame(video, timestamp);
            const inferDuration = performance.now() - inferStart;
            lastInferenceDurationRef.current = inferDuration;

            // Draw landmarks directly onto canvas overlay
            if (overlayRef.current) {
              overlayRef.current.draw(result, video);
            }

            frameCountRef.current++;

            if (result) {
              const handsCount = result.landmarks ? result.landmarks.length : 0;
              if (handsCount !== lastHandsCountRef.current) {
                lastHandsCountRef.current = handsCount;
                setDetectedHandsCount(handsCount);
              }

              // Throttled debug log: every 2 seconds or on detected hand count change
              if (now - lastLogTimeRef.current > 2000 || handsCount !== lastHandsCountRef.current) {
                const elapsedSec = (now - fpsStartTimeRef.current) / 1000;
                const fps = elapsedSec > 0 ? Math.round(frameCountRef.current / elapsedSec) : 0;
                lastLogTimeRef.current = now;
                fpsStartTimeRef.current = now;
                frameCountRef.current = 0;

                console.log(
                  `[MediaPipe] FPS: ~${fps} | Latency: ${inferDuration.toFixed(1)}ms | t=${Math.round(timestamp)}ms — ${handsCount} hand(s)`
                );
              }
            }
          }

          if (isLoopRunningRef.current) {
            requestAnimationRef.current = requestAnimationFrame(loop);
          }
        };

        requestAnimationRef.current = requestAnimationFrame(loop);
      } catch (err) {
        if (!isMounted) return;
        console.warn('[MediaPipe] HandLandmarker initialization error:', err);
        setMediaPipeStatus('error');
      }
    };

    startInference();

    return () => {
      isMounted = false;
      isLoopRunningRef.current = false;
      if (requestAnimationRef.current !== null) {
        cancelAnimationFrame(requestAnimationRef.current);
        requestAnimationRef.current = null;
      }
      if (overlayRef.current) {
        overlayRef.current.clear();
      }
    };
  }, [status]);

  // Ensure stream tracks and inference loop are stopped, and resources released on unmount
  useEffect(() => {
    return () => {
      isLoopRunningRef.current = false;
      if (requestAnimationRef.current !== null) {
        cancelAnimationFrame(requestAnimationRef.current);
        requestAnimationRef.current = null;
      }
      if (overlayRef.current) {
        overlayRef.current.clear();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      disposeHandLandmarker();
    };
  }, []);

  return (
    <section
      id="camera-capture-card"
      aria-label="SignConnect Camera Capture"
      className="w-full bg-white rounded-xl shadow-xs border border-slate-200 p-5 text-left"
    >
      {/* Header with Title & Status Badge */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2
            id="camera-capture-title"
            className="text-base font-semibold text-slate-900"
          >
            Camera Feed
          </h2>
          <p id="camera-capture-subtitle" className="text-xs text-slate-500">
            Sign language capture foundation
          </p>
        </div>

        <div
          id="camera-status-badge"
          aria-live="polite"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              status === 'active'
                ? 'bg-emerald-500 animate-pulse'
                : status === 'starting'
                ? 'bg-amber-500 animate-pulse'
                : status === 'error'
                ? 'bg-rose-500'
                : 'bg-slate-400'
            }`}
          />
          <span id="camera-status-text">
            {status === 'active' && 'Camera active'}
            {status === 'starting' && 'Starting...'}
            {status === 'idle' && 'Camera is off'}
            {status === 'error' && 'Error'}
          </span>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div
          id="camera-error-banner"
          role="alert"
          className="mb-4 flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
          <div className="flex-1">
            <p id="camera-error-text" className="leading-relaxed">
              {errorMessage}
            </p>
          </div>
          <button
            id="camera-retry-button"
            type="button"
            onClick={startCamera}
            className="inline-flex items-center gap-1 font-semibold text-rose-700 hover:text-rose-900 hover:underline cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Camera Video Viewport Area */}
      <div
        id="camera-preview-container"
        className="relative w-full aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner"
      >
        <video
          id="camera-video-element"
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            status === 'active' ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
          }`}
        />

        {/* MediaPipe 21 Hand Landmark Canvas Overlay */}
        <HandLandmarkOverlay
          ref={overlayRef}
          id="camera-hand-landmark-overlay"
          className={`transition-opacity duration-300 ${
            status === 'active' ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Inactive or Loading Overlay */}
        {status !== 'active' && (
          <div
            id="camera-placeholder-overlay"
            className="flex flex-col items-center justify-center text-center p-6 text-slate-400 select-none"
          >
            {status === 'starting' ? (
              <>
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-2" />
                <p id="camera-loading-text" className="text-sm font-medium text-slate-200">
                  Requesting camera access...
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Please allow camera permission in your browser prompt.
                </p>
              </>
            ) : status === 'error' ? (
              <>
                <CameraOff className="w-8 h-8 text-slate-500 mb-2" />
                <p className="text-sm font-medium text-slate-300">Camera unavailable</p>
                <p className="text-xs text-slate-500 mt-1">
                  Click &apos;Start Camera&apos; or retry after checking browser permissions.
                </p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mb-2">
                  <Camera className="w-6 h-6" />
                </div>
                <p id="camera-off-text" className="text-sm font-medium text-slate-200">
                  Camera is off
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Click &quot;Start Camera&quot; below to grant permission and start the local video stream.
                </p>
              </>
            )}
          </div>
        )}

        {/* Live indicator overlay when camera is active */}
        {status === 'active' && (
          <div
            id="camera-live-overlay-tag"
            className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium border border-white/10"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="font-semibold uppercase tracking-wider">LIVE</span>
            <span className="text-white/30">|</span>
            <span id="mediapipe-inference-status" className="text-slate-200">
              {mediaPipeStatus === 'loading'
                ? 'Initializing MediaPipe...'
                : mediaPipeStatus === 'ready'
                ? `MediaPipe: ${detectedHandsCount} hand${detectedHandsCount === 1 ? '' : 's'}`
                : mediaPipeStatus === 'error'
                ? 'MediaPipe unavailable'
                : 'MediaPipe standby'}
            </span>
          </div>
        )}
      </div>

      {/* Camera Controls */}
      <div id="camera-controls-container" className="mt-4 flex items-center gap-3">
        {status === 'active' ? (
          <button
            id="stop-camera-button"
            type="button"
            onClick={stopCamera}
            className="flex-1 py-2.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 cursor-pointer shadow-xs"
          >
            <CameraOff className="w-4 h-4" />
            <span>Stop Camera</span>
          </button>
        ) : (
          <button
            id="start-camera-button"
            type="button"
            onClick={startCamera}
            disabled={status === 'starting'}
            className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-xs"
          >
            {status === 'starting' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Starting Camera...</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>Start Camera</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Privacy Notice */}
      <div
        id="camera-privacy-notice"
        className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-2 text-slate-500 text-xs"
      >
        <Shield className="w-3.5 h-3.5 shrink-0 text-slate-400" />
        <span id="camera-privacy-text" className="leading-tight">
          Video remains local to your browser. No frames or recordings are stored or transmitted.
        </span>
      </div>
    </section>
  );
}
