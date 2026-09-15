/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  useEffect,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import type { HandLandmarkerResult } from '../../services/handLandmarkerService.ts';

/**
 * Standard 21 MediaPipe hand connections topology
 * connecting landmark index pairs.
 */
export const HAND_CONNECTIONS: ReadonlyArray<{ readonly start: number; readonly end: number }> = [
  // Thumb
  { start: 0, end: 1 },
  { start: 1, end: 2 },
  { start: 2, end: 3 },
  { start: 3, end: 4 },
  // Index finger
  { start: 0, end: 5 },
  { start: 5, end: 6 },
  { start: 6, end: 7 },
  { start: 7, end: 8 },
  // Middle finger & palm
  { start: 5, end: 9 },
  { start: 9, end: 10 },
  { start: 10, end: 11 },
  { start: 11, end: 12 },
  // Ring finger & palm
  { start: 9, end: 13 },
  { start: 13, end: 14 },
  { start: 14, end: 15 },
  { start: 15, end: 16 },
  // Pinky & palm
  { start: 13, end: 17 },
  { start: 0, end: 17 },
  { start: 17, end: 18 },
  { start: 18, end: 19 },
  { start: 19, end: 20 },
];

export interface HandLandmarkOverlayHandle {
  /**
   * Draws the latest HandLandmarkerResult directly onto the canvas.
   * Accepts optional HTMLVideoElement to calculate exact object-cover aspect mapping.
   */
  draw: (result: HandLandmarkerResult | null | undefined, video?: HTMLVideoElement | null) => void;

  /**
   * Clears the entire canvas.
   */
  clear: () => void;
}

export interface HandLandmarkOverlayProps {
  /**
   * Optional MediaPipe HandLandmarker result for declarative rendering.
   */
  result?: HandLandmarkerResult | null;

  /**
   * Pixel width of the underlying video / canvas coordinate space.
   * Defaults to video dimensions or bounding client rect.
   */
  width?: number;

  /**
   * Pixel height of the underlying video / canvas coordinate space.
   * Defaults to video dimensions or bounding client rect.
   */
  height?: number;

  /**
   * Optional custom CSS classes for the canvas element.
   */
  className?: string;

  /**
   * Unique element ID for accessibility and testing.
   */
  id?: string;
}

/**
 * HandLandmarkOverlay
 * 
 * Reusable visual canvas overlay responsible strictly for rendering
 * MediaPipe 21 hand landmarks and skeleton connections.
 * 
 * - Pointer-events are disabled so it never intercepts user interaction.
 * - Supports high-performance imperative updates via ref to avoid 60fps React state re-renders.
 * - Does not run any inference or animation loops internally.
 * - Clears canvas completely when zero hands are present.
 * - Supports zero, one, or two hands accurately based on input landmarks.
 */
export const HandLandmarkOverlay = forwardRef<
  HandLandmarkOverlayHandle,
  HandLandmarkOverlayProps
>(function HandLandmarkOverlay(
  { result, width, height, className = '', id = 'hand-landmark-overlay-canvas' },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const renderLandmarks = useCallback(
    (
      landmarksResult: HandLandmarkerResult | null | undefined,
      videoElement?: HTMLVideoElement | null
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Determine target canvas pixel dimensions
      const targetWidth =
        width && width > 0 ? width : canvas.clientWidth || 640;
      const targetHeight =
        height && height > 0 ? height : canvas.clientHeight || 480;

      // Adjust internal canvas buffer dimensions to match display container
      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      // Always clear the entire canvas prior to drawing or when no landmarks exist
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // If no landmark result or no detected hands, canvas remains completely blank
      if (!landmarksResult || !landmarksResult.landmarks || landmarksResult.landmarks.length === 0) {
        return;
      }

      // Calculate object-cover aspect ratio mapping to align landmarks with displayed video
      const videoW =
        videoElement && videoElement.videoWidth > 0
          ? videoElement.videoWidth
          : targetWidth;
      const videoH =
        videoElement && videoElement.videoHeight > 0
          ? videoElement.videoHeight
          : targetHeight;

      const scale = Math.max(targetWidth / videoW, targetHeight / videoH);
      const renderedW = videoW * scale;
      const renderedH = videoH * scale;
      const offsetX = (targetWidth - renderedW) / 2;
      const offsetY = (targetHeight - renderedH) / 2;

      // Draw detected hands (supports 0, 1, or 2 hands)
      landmarksResult.landmarks.forEach((handLandmarks, handIndex) => {
        if (!handLandmarks || handLandmarks.length === 0) return;

        // Color scheme: vibrant emerald for hand 0, vibrant sky blue for hand 1
        const connectionColor =
          handIndex === 0 ? 'rgba(16, 185, 129, 0.9)' : 'rgba(14, 165, 233, 0.9)';
        const landmarkFill = handIndex === 0 ? '#10b981' : '#0ea5e9';
        const landmarkStroke = '#ffffff';

        // 1. Draw skeleton connection lines
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = connectionColor;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        HAND_CONNECTIONS.forEach(({ start, end }) => {
          const p1 = handLandmarks[start];
          const p2 = handLandmarks[end];

          if (p1 && p2) {
            const x1 = offsetX + p1.x * renderedW;
            const y1 = offsetY + p1.y * renderedH;
            const x2 = offsetX + p2.x * renderedW;
            const y2 = offsetY + p2.y * renderedH;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        });

        // 2. Draw 21 landmark points
        handLandmarks.forEach((landmark, index) => {
          const x = offsetX + landmark.x * renderedW;
          const y = offsetY + landmark.y * renderedH;

          // Key nodes: Wrist (0) and finger tips (4, 8, 12, 16, 20) slightly larger
          const isFingertip = [0, 4, 8, 12, 16, 20].includes(index);
          const radius = isFingertip ? 4.5 : 3;

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.fillStyle = landmarkFill;
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = landmarkStroke;
          ctx.stroke();
        });
      });
    },
    [width, height]
  );

  // Expose imperative API for direct 60fps rendering without React component re-renders
  useImperativeHandle(
    ref,
    () => ({
      draw: (res, video) => {
        renderLandmarks(res, video);
      },
      clear: () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      },
    }),
    [renderLandmarks]
  );

  // Declarative effect if result prop is supplied
  useEffect(() => {
    if (result !== undefined) {
      renderLandmarks(result);
    }
  }, [result, renderLandmarks]);

  return (
    <canvas
      ref={canvasRef}
      id={id}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 w-full h-full z-10 ${className}`}
    />
  );
});
