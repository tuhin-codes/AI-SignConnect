/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerOptions,
  type HandLandmarkerResult,
} from '@mediapipe/tasks-vision';

export type { HandLandmarkerResult };

export const MEDIAPIPE_WASM_PATH =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm';

export const MEDIAPIPE_HAND_LANDMARKER_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

let landmarkerInstance: HandLandmarker | null = null;
let initializationPromise: Promise<HandLandmarker> | null = null;

export interface HandLandmarkerConfig {
  wasmPath?: string;
  modelAssetPath?: string;
  numHands?: number;
  runningMode?: 'VIDEO' | 'IMAGE';
  minHandDetectionConfidence?: number;
  minHandPresenceConfidence?: number;
  minTrackingConfidence?: number;
}

/**
 * Initializes and returns a singleton instance of MediaPipe HandLandmarker.
 * Reuses existing initialization promise if in flight to prevent duplicate instances.
 */
export async function initializeHandLandmarker(
  config?: HandLandmarkerConfig
): Promise<HandLandmarker> {
  if (landmarkerInstance) {
    return landmarkerInstance;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      const wasmPath = config?.wasmPath || MEDIAPIPE_WASM_PATH;
      const modelAssetPath =
        config?.modelAssetPath || MEDIAPIPE_HAND_LANDMARKER_MODEL_URL;

      const vision = await FilesetResolver.forVisionTasks(wasmPath);

      const options: HandLandmarkerOptions = {
        baseOptions: {
          modelAssetPath,
          delegate: 'GPU',
        },
        runningMode: config?.runningMode || 'VIDEO',
        numHands: config?.numHands ?? 2,
        minHandDetectionConfidence: config?.minHandDetectionConfidence ?? 0.5,
        minHandPresenceConfidence: config?.minHandPresenceConfidence ?? 0.5,
        minTrackingConfidence: config?.minTrackingConfidence ?? 0.5,
      };

      try {
        landmarkerInstance = await HandLandmarker.createFromOptions(
          vision,
          options
        );
      } catch (gpuError) {
        // In environments without WebGL/GPU acceleration, fallback to CPU delegate
        options.baseOptions = {
          modelAssetPath,
          delegate: 'CPU',
        };
        landmarkerInstance = await HandLandmarker.createFromOptions(
          vision,
          options
        );
      }

      return landmarkerInstance;
    } catch (error) {
      landmarkerInstance = null;
      throw new Error(
        `Failed to initialize MediaPipe HandLandmarker: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      initializationPromise = null;
    }
  })();

  return initializationPromise;
}

/**
 * Runs hand landmark detection on a single video frame if the landmarker is ready.
 * Returns null if the landmarker is not initialized or the video frame is not ready.
 */
export function detectVideoFrame(
  video: HTMLVideoElement,
  timestampMs: number
): HandLandmarkerResult | null {
  if (!landmarkerInstance) {
    return null;
  }

  // Ensure video element has valid dimensions and playable frame data
  if (
    video.readyState < 2 ||
    video.videoWidth === 0 ||
    video.videoHeight === 0 ||
    video.paused ||
    video.ended
  ) {
    return null;
  }

  try {
    return landmarkerInstance.detectForVideo(video, timestampMs);
  } catch (error) {
    console.warn('[MediaPipe] detectVideoFrame error:', error);
    return null;
  }
}

/**
 * Disposes the active HandLandmarker instance and releases underlying WebAssembly/GPU resources.
 */
export function disposeHandLandmarker(): void {
  if (landmarkerInstance) {
    try {
      landmarkerInstance.close();
    } catch (err) {
      console.warn('Error while closing HandLandmarker:', err);
    }
    landmarkerInstance = null;
  }
  initializationPromise = null;
}

/**
 * Returns the active HandLandmarker instance or null if not yet initialized.
 */
export function getHandLandmarker(): HandLandmarker | null {
  return landmarkerInstance;
}

/**
 * Returns true if the HandLandmarker instance is initialized and ready.
 */
export function isHandLandmarkerReady(): boolean {
  return landmarkerInstance !== null;
}
