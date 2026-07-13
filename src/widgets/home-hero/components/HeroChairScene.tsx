"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  AmbientLight,
  Box3,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { useI18n } from "@/shared/i18n/I18nProvider";
import { useToast } from "@/shared/ui/Toast";

import styles from "./HeroChairScene.module.css";

type HeroChairSceneProps = {
  className?: string | undefined;
};

type LoadedModelName = "leftChair" | "rightChair" | "mug" | "speechBubble";

type SceneLoadState = "delayed" | "error" | "loading" | "ready";

type SceneModelConfig = {
  floorY: number;
  materialTint?: string;
  rotation: [number, number, number];
  size: number;
  url: string;
  x: number;
  z: number;
};

type SceneModelConfigs = Record<LoadedModelName, SceneModelConfig>;

type NumericConfigField = "floorY" | "size" | "x" | "z";

type PanelSide = "bottom" | "left" | "right";

type RotationAxis = 0 | 1 | 2;

type MotionProfile = {
  bobAmount: number;
  bobPhase: number;
  bobSpeed: number;
  driftX: number;
  driftZ: number;
  mousePitch: number;
  mouseX: number;
  mouseY: number;
  mouseYaw: number;
  mouseZ: number;
  pitchAmount: number;
  rollAmount: number;
  yawAmount: number;
};

const isHeroEditorAllowed = process.env.NODE_ENV !== "production";
const sceneLoadFallbackMs = 6500;
const sceneWarmupFrames = 18;

const modelConfigs = {
  leftChair: {
    floorY: -1.45,
    rotation: [MathUtils.degToRad(-4), MathUtils.degToRad(-23), MathUtils.degToRad(-7)],
    size: 1.72,
    url: "/assets/hero/models/pink-armchair.glb",
    x: -4.68,
    z: 0.12,
  },
  rightChair: {
    floorY: -1.45,
    materialTint: "#f4c8b8",
    rotation: [MathUtils.degToRad(2), MathUtils.degToRad(-162), MathUtils.degToRad(-10)],
    size: 1.78,
    url: "/assets/hero/models/cream-armchair.glb",
    x: 4.5,
    z: 0.2,
  },
  mug: {
    floorY: -1.9,
    rotation: [MathUtils.degToRad(13), MathUtils.degToRad(-14), 0],
    size: 0.58,
    url: "/assets/hero/models/pink-mug.glb",
    x: -5.02,
    z: 0.95,
  },
  speechBubble: {
    floorY: 0.75,
    rotation: [MathUtils.degToRad(10), MathUtils.degToRad(35), MathUtils.degToRad(-2)],
    size: 0.89,
    url: "/assets/hero/models/speech-bubble.glb",
    x: 5.58,
    z: -0.28,
  },
} satisfies SceneModelConfigs;

const modelLabels = {
  leftChair: "Left chair",
  rightChair: "Right chair",
  mug: "Mug",
  speechBubble: "Chat",
} satisfies Record<LoadedModelName, string>;

const fieldSettings = {
  x: { label: "X - left / right", max: 7, min: -7, step: 0.01 },
  floorY: { label: "Y - lower / higher", max: 2, min: -2, step: 0.01 },
  z: { label: "Z - depth", max: 2.5, min: -2.5, step: 0.01 },
  size: { label: "Size", max: 3, min: 0.1, step: 0.01 },
} satisfies Record<NumericConfigField, { label: string; max: number; min: number; step: number }>;

const rotationSettings = [
  { axis: 0, label: "Rotation X - pitch forward / back" },
  { axis: 1, label: "Rotation Y - turn" },
  { axis: 2, label: "Rotation Z - side tilt" },
] satisfies Array<{ axis: RotationAxis; label: string }>;

const motionProfiles = {
  leftChair: {
    bobAmount: 0.05,
    bobPhase: 0,
    bobSpeed: 0.82,
    driftX: 0.028,
    driftZ: 0.024,
    mousePitch: 0.038,
    mouseX: -0.085,
    mouseY: 0.03,
    mouseYaw: 0.08,
    mouseZ: 0.074,
    pitchAmount: 0.017,
    rollAmount: 0.013,
    yawAmount: 0.016,
  },
  rightChair: {
    bobAmount: 0.048,
    bobPhase: 1.25,
    bobSpeed: 0.86,
    driftX: 0.026,
    driftZ: 0.025,
    mousePitch: 0.036,
    mouseX: 0.08,
    mouseY: 0.028,
    mouseYaw: 0.076,
    mouseZ: 0.07,
    pitchAmount: 0.016,
    rollAmount: 0.013,
    yawAmount: 0.015,
  },
  mug: {
    bobAmount: 0.068,
    bobPhase: 2.1,
    bobSpeed: 1.05,
    driftX: 0.02,
    driftZ: 0.02,
    mousePitch: 0.044,
    mouseX: -0.105,
    mouseY: 0.036,
    mouseYaw: 0.056,
    mouseZ: 0.09,
    pitchAmount: 0.038,
    rollAmount: 0.085,
    yawAmount: 0.025,
  },
  speechBubble: {
    bobAmount: 0.105,
    bobPhase: 0.65,
    bobSpeed: 0.74,
    driftX: 0.04,
    driftZ: 0.028,
    mousePitch: 0.055,
    mouseX: 0.16,
    mouseY: -0.044,
    mouseYaw: 0.16,
    mouseZ: -0.075,
    pitchAmount: 0.032,
    rollAmount: 0.068,
    yawAmount: 0.052,
  },
} satisfies Record<LoadedModelName, MotionProfile>;

function cloneModelConfigs(configs: SceneModelConfigs): SceneModelConfigs {
  return Object.fromEntries(
    (Object.keys(configs) as LoadedModelName[]).map((name) => [
      name,
      {
        ...configs[name],
        rotation: [...configs[name].rotation],
      },
    ]),
  ) as SceneModelConfigs;
}

function roundValue(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function getRotationDegrees(config: SceneModelConfig, axis: RotationAxis) {
  return roundValue(MathUtils.radToDeg(config.rotation[axis]), 1);
}

function formatConfigValue(value: number) {
  return Number.isInteger(value) ? String(value) : String(roundValue(value, 3));
}

function formatRotation(value: number) {
  const degrees = roundValue(MathUtils.radToDeg(value), 1);

  if (degrees === 0) {
    return "0";
  }

  return `MathUtils.degToRad(${formatConfigValue(degrees)})`;
}

function formatModelConfigs(configs: SceneModelConfigs) {
  const modelBlocks = (Object.keys(configs) as LoadedModelName[]).map((name) => {
    const config = configs[name];
    const materialTint = config.materialTint ? `\n    materialTint: "${config.materialTint}",` : "";

    return `  ${name}: {
    floorY: ${formatConfigValue(config.floorY)},${materialTint}
    rotation: [${formatRotation(config.rotation[0])}, ${formatRotation(config.rotation[1])}, ${formatRotation(config.rotation[2])}],
    size: ${formatConfigValue(config.size)},
    url: "${config.url}",
    x: ${formatConfigValue(config.x)},
    z: ${formatConfigValue(config.z)},
  }`;
  });

  return `const modelConfigs = {\n${modelBlocks.join(",\n")},\n} satisfies SceneModelConfigs;`;
}

function configureRenderer(renderer: WebGLRenderer, width: number, height: number) {
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
  renderer.setSize(width, height, false);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.shadowMap.enabled = false;
}

function createNormalizedModel(source: Group, targetLongestSide: number) {
  const sourceBox = new Box3().setFromObject(source);
  const sourceCenter = sourceBox.getCenter(new Vector3());
  const sourceSize = sourceBox.getSize(new Vector3());
  const longestSide = Math.max(sourceSize.x, sourceSize.y, sourceSize.z) || 1;
  const wrapper = new Group();

  source.position.set(-sourceCenter.x, -sourceCenter.y, -sourceCenter.z);
  wrapper.userData.sourceLongestSide = longestSide;
  wrapper.scale.setScalar(targetLongestSide / longestSide);
  wrapper.add(source);

  return wrapper;
}

function setObjectBaseY(object: Object3D, floorY: number) {
  const box = new Box3().setFromObject(object);
  object.position.y += floorY - box.min.y;
}

function setDecorativeMaterialTuning(object: Object3D, tint?: string) {
  const tintColor = tint ? new Color(tint) : null;

  object.traverse((child) => {
    if (!(child instanceof Mesh)) {
      return;
    }

    child.castShadow = false;
    child.receiveShadow = false;

    const materials = Array.isArray(child.material) ? child.material : [child.material];

    for (const material of materials) {
      if (material instanceof MeshStandardMaterial) {
        if (tintColor) {
          material.color.lerp(tintColor, 0.28);
        }

        material.roughness = Math.max(material.roughness, 0.54);
        material.metalness = Math.min(material.metalness, 0.12);
        material.needsUpdate = true;
      }
    }
  });
}

function disposeObject3D(object: Object3D) {
  object.traverse((child) => {
    if (!(child instanceof Mesh)) {
      return;
    }

    child.geometry.dispose();

    const materials = Array.isArray(child.material) ? child.material : [child.material];

    for (const material of materials) {
      material.dispose();
    }
  });
}

export function disposeHeroRenderer(renderer: Pick<WebGLRenderer, "dispose">) {
  renderer.dispose();
}

function applyModelConfig(object: Object3D, config: SceneModelConfig) {
  const sourceLongestSide = Number(object.userData.sourceLongestSide || 1);

  object.scale.setScalar(config.size / sourceLongestSide);
  object.rotation.set(...config.rotation);
  object.position.set(config.x, 0, config.z);
  setObjectBaseY(object, config.floorY);
  object.userData.baseY = object.position.y;
}

function loadModel(loader: GLTFLoader, config: SceneModelConfig) {
  return new Promise<Group>((resolve, reject) => {
    loader.load(
      config.url,
      (gltf) => {
        const model = createNormalizedModel(gltf.scene as Group, config.size);

        applyModelConfig(model, config);
        setDecorativeMaterialTuning(model, config.materialTint);

        resolve(model);
      },
      undefined,
      reject,
    );
  });
}

function animateModel(
  name: LoadedModelName,
  model: Group,
  config: SceneModelConfig,
  time: number,
  pointer: { x: number; y: number },
  shouldReduceMotion: boolean,
) {
  const baseY = Number(model.userData.baseY ?? model.position.y);

  if (shouldReduceMotion) {
    model.position.set(config.x, baseY, config.z);
    model.rotation.set(...config.rotation);

    return;
  }

  const profile = motionProfiles[name];
  const wave = Math.sin(time * profile.bobSpeed + profile.bobPhase);
  const slowWave = Math.sin(time * 0.46 + profile.bobPhase * 0.7);
  const rollWave = Math.sin(time * 0.72 + profile.bobPhase * 1.2);

  model.position.set(
    config.x + pointer.x * profile.mouseX + slowWave * profile.driftX,
    baseY + (wave + 1) * profile.bobAmount + pointer.y * profile.mouseY,
    config.z + pointer.y * profile.mouseZ + slowWave * profile.driftZ,
  );
  model.rotation.set(
    config.rotation[0] + wave * profile.pitchAmount + pointer.y * profile.mousePitch,
    config.rotation[1] + slowWave * profile.yawAmount + pointer.x * profile.mouseYaw,
    config.rotation[2] + rollWave * profile.rollAmount,
  );
}

export function isHeroEditorSearchEnabled(search: string) {
  const value = new URLSearchParams(search).get("heroEditor");

  return value === "1" || value === "true";
}

function useHeroEditorEnabled() {
  return useSyncExternalStore(
    (callback) => {
      if (!isHeroEditorAllowed) {
        return () => {};
      }

      window.addEventListener("popstate", callback);

      return () => window.removeEventListener("popstate", callback);
    },
    () => isHeroEditorAllowed && isHeroEditorSearchEnabled(window.location.search),
    () => false,
  );
}

function useHeroSceneViewportEnabled() {
  return useSyncExternalStore(
    (callback) => {
      const mediaQuery = window.matchMedia("(min-width: 1101px)");

      mediaQuery.addEventListener("change", callback);

      return () => mediaQuery.removeEventListener("change", callback);
    },
    () => window.matchMedia("(min-width: 1101px)").matches,
    () => false,
  );
}

type HeroSceneEditorProps = {
  activeModel: LoadedModelName;
  configs: SceneModelConfigs;
  onActiveModelChange: (name: LoadedModelName) => void;
  onConfigChange: (name: LoadedModelName, config: SceneModelConfig) => void;
  onResetAll: () => void;
  onResetModel: (name: LoadedModelName) => void;
};

function HeroSceneEditor({
  activeModel,
  configs,
  onActiveModelChange,
  onConfigChange,
  onResetAll,
  onResetModel,
}: HeroSceneEditorProps) {
  const outputRef = useRef<HTMLTextAreaElement | null>(null);
  const [copyState, setCopyState] = useState<"copied" | "failed" | "idle">("idle");
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [panelSide, setPanelSide] = useState<PanelSide>("right");
  const activeConfig = configs[activeModel];
  const configOutput = formatModelConfigs(configs);

  function updateNumericField(field: NumericConfigField, value: number) {
    onConfigChange(activeModel, {
      ...activeConfig,
      [field]: value,
    });
  }

  function updateRotation(axis: RotationAxis, value: number) {
    const nextRotation: [number, number, number] = [...activeConfig.rotation];

    nextRotation[axis] = MathUtils.degToRad(value);

    onConfigChange(activeModel, {
      ...activeConfig,
      rotation: nextRotation,
    });
  }

  function copyConfigFallback() {
    let didCopyFromEvent = false;
    const handleCopy = (event: ClipboardEvent) => {
      event.clipboardData?.setData("text/plain", configOutput);
      event.preventDefault();
      didCopyFromEvent = true;
    };

    document.addEventListener("copy", handleCopy, { once: true });
    const commandCopyResult = document.execCommand("copy");
    document.removeEventListener("copy", handleCopy);

    if (didCopyFromEvent || commandCopyResult) {
      return true;
    }

    if (outputRef.current) {
      outputRef.current.focus({ preventScroll: true });
      outputRef.current.select();
      outputRef.current.setSelectionRange(0, outputRef.current.value.length);

      if (document.execCommand("copy")) {
        return true;
      }
    }

    const copyTarget = document.createElement("textarea");

    copyTarget.value = configOutput;
    copyTarget.setAttribute("readonly", "");
    copyTarget.style.position = "fixed";
    copyTarget.style.top = "0";
    copyTarget.style.left = "0";
    copyTarget.style.width = "1px";
    copyTarget.style.height = "1px";
    copyTarget.style.opacity = "0";
    copyTarget.style.pointerEvents = "none";
    document.body.appendChild(copyTarget);
    copyTarget.focus({ preventScroll: true });
    copyTarget.select();
    copyTarget.setSelectionRange(0, copyTarget.value.length);

    const isCopied = document.execCommand("copy");

    document.body.removeChild(copyTarget);

    return isCopied;
  }

  async function copyConfig() {
    setCopyState("idle");

    if (copyConfigFallback()) {
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);

      return;
    }

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API is unavailable");
      }

      await navigator.clipboard.writeText(configOutput);
      setCopyState("copied");
    } catch {
      outputRef.current?.focus();
      outputRef.current?.select();
      outputRef.current?.setSelectionRange(0, outputRef.current.value.length);
      setCopyState("failed");
    }

    window.setTimeout(() => setCopyState("idle"), 1800);
  }

  return (
    <>
      <button
        className={styles.editorToggle}
        data-panel-visible={isPanelVisible}
        onClick={() => setIsPanelVisible((isVisible) => !isVisible)}
        type="button"
      >
        {isPanelVisible ? "Hide editor" : "Show editor"}
      </button>

      {isPanelVisible ? (
        <aside className={styles.editor} data-side={panelSide} data-testid="hero-scene-editor">
          <div className={styles.editorHeader}>
            <div>
              <p className={styles.editorEyebrow}>Hero 3D editor</p>
              <h2 className={styles.editorTitle}>Object position</h2>
            </div>
            <button className={styles.editorGhostButton} onClick={onResetAll} type="button">
              Reset all
            </button>
          </div>

          <div className={styles.panelDockControls} aria-label="Editor panel position">
            {(["left", "right", "bottom"] satisfies PanelSide[]).map((side) => (
              <button
                className={styles.panelDockButton}
                data-active={panelSide === side}
                key={side}
                onClick={() => setPanelSide(side)}
                type="button"
              >
                {side}
              </button>
            ))}
          </div>

          <div className={styles.modelTabs}>
            {(Object.keys(configs) as LoadedModelName[]).map((name) => (
              <button
                className={styles.modelTab}
                data-active={activeModel === name}
                key={name}
                onClick={() => onActiveModelChange(name)}
                type="button"
              >
                {modelLabels[name]}
              </button>
            ))}
          </div>

          <div className={styles.editorControls}>
            {(Object.keys(fieldSettings) as NumericConfigField[]).map((field) => {
              const setting = fieldSettings[field];
              const value = activeConfig[field];

              return (
                <label className={styles.editorControl} key={field}>
                  <span className={styles.editorControlTop}>
                    <span>{setting.label}</span>
                    <input
                      className={styles.editorNumberInput}
                      max={setting.max}
                      min={setting.min}
                      onChange={(event) => updateNumericField(field, Number(event.target.value))}
                      step={setting.step}
                      type="number"
                      value={roundValue(value, 3)}
                    />
                  </span>
                  <input
                    className={styles.editorRange}
                    max={setting.max}
                    min={setting.min}
                    onChange={(event) => updateNumericField(field, Number(event.target.value))}
                    step={setting.step}
                    type="range"
                    value={value}
                  />
                </label>
              );
            })}

            {rotationSettings.map(({ axis, label }) => {
              const value = getRotationDegrees(activeConfig, axis);

              return (
                <label className={styles.editorControl} key={axis}>
                  <span className={styles.editorControlTop}>
                    <span>{label}</span>
                    <input
                      className={styles.editorNumberInput}
                      max={180}
                      min={-180}
                      onChange={(event) => updateRotation(axis, Number(event.target.value))}
                      step={1}
                      type="number"
                      value={value}
                    />
                  </span>
                  <input
                    className={styles.editorRange}
                    max={180}
                    min={-180}
                    onChange={(event) => updateRotation(axis, Number(event.target.value))}
                    step={1}
                    type="range"
                    value={value}
                  />
                </label>
              );
            })}
          </div>

          <div className={styles.editorActions}>
            <button
              className={styles.editorGhostButton}
              onClick={() => onResetModel(activeModel)}
              type="button"
            >
              Reset object
            </button>
            <button
              className={styles.editorPrimaryButton}
              data-copy-state={copyState}
              onClick={copyConfig}
              type="button"
            >
              {copyState === "copied"
                ? "Copied"
                : copyState === "failed"
                  ? "Press Ctrl+C"
                  : "Copy config"}
            </button>
          </div>

          <textarea className={styles.editorOutput} readOnly ref={outputRef} value={configOutput} />

          <p className={styles.editorHint}>
            X moves left/right, Y places the object lower/higher, Z moves it closer/farther.
            Rotation Y usually turns the object toward the camera.
          </p>
        </aside>
      ) : null}
    </>
  );
}

export function HeroChairScene({ className }: HeroChairSceneProps) {
  const toast = useToast();
  const { t } = useI18n();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasFrameRef = useRef<HTMLDivElement | null>(null);
  const loadedModelsRef = useRef<Partial<Record<LoadedModelName, Group>>>({});
  const hasReportedLoadErrorRef = useRef(false);
  const [activeModel, setActiveModel] = useState<LoadedModelName>("leftChair");
  const [configs, setConfigs] = useState<SceneModelConfigs>(() => cloneModelConfigs(modelConfigs));
  const [isSceneContentReady, setIsSceneContentReady] = useState(false);
  const [loadState, setLoadState] = useState<SceneLoadState>("loading");
  const configsRef = useRef(configs);
  const isEditorEnabled = useHeroEditorEnabled();
  const isViewportEnabled = useHeroSceneViewportEnabled();
  const isReady = isViewportEnabled && isSceneContentReady && loadState === "ready";
  const shouldRenderCanvas = isViewportEnabled && loadState !== "error";
  const sceneLoadState = isViewportEnabled ? loadState : "disabled";

  useEffect(() => {
    configsRef.current = configs;

    for (const name of Object.keys(loadedModelsRef.current) as LoadedModelName[]) {
      const model = loadedModelsRef.current[name];

      if (model) {
        applyModelConfig(model, configs[name]);
      }
    }
  }, [configs]);

  function handleConfigChange(name: LoadedModelName, config: SceneModelConfig) {
    setConfigs((currentConfigs) => ({
      ...currentConfigs,
      [name]: config,
    }));
  }

  function handleResetModel(name: LoadedModelName) {
    setConfigs((currentConfigs) => ({
      ...currentConfigs,
      [name]: cloneModelConfigs(modelConfigs)[name],
    }));
  }

  function handleResetAll() {
    setConfigs(cloneModelConfigs(modelConfigs));
  }

  const reportSceneLoadError = useCallback(
    (error: unknown) => {
      console.warn("Hero 3D scene is unavailable, falling back to static state.", error);

      if (hasReportedLoadErrorRef.current) {
        return;
      }

      hasReportedLoadErrorRef.current = true;
      toast.warning(t("home.hero.sceneLoadError"), t("home.hero.sceneLoadErrorDescription"));
    },
    [t, toast],
  );

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const canvasFrame = canvasFrameRef.current;
    const resetStateTimer = window.setTimeout(() => {
      setLoadState("loading");
      setIsSceneContentReady(false);
    }, 0);

    if (!isViewportEnabled) {
      return () => window.clearTimeout(resetStateTimer);
    }

    if (!root || !canvas || !canvasFrame) {
      return () => window.clearTimeout(resetStateTimer);
    }

    const revealFrame = canvasFrame;
    let disposed = false;
    let resourcesReleased = false;
    let animationFrame = 0;
    let renderer: WebGLRenderer | undefined;
    let fallbackTimer = 0;
    let warmupFramesRemaining = 0;
    const loadedModels = loadedModelsRef.current;
    loadedModelsRef.current = loadedModels;
    const container = root;
    const pointer = { targetX: 0, targetY: 0, x: 0, y: 0 };
    const shouldReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new Scene();
    const stage = new Group();
    const camera = new PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0.88, 7.8);
    camera.lookAt(0, -0.1, 0);

    scene.add(stage);
    scene.add(new AmbientLight(0xffffff, 1.45));

    const hemisphere = new HemisphereLight(0xffffff, 0xffd6cd, 1.8);
    scene.add(hemisphere);

    const keyLight = new DirectionalLight(new Color("#fff5f0"), 2.2);
    keyLight.position.set(1.6, 4.6, 4.8);
    scene.add(keyLight);

    const fillLight = new DirectionalLight(new Color("#ffd8d1"), 1.05);
    fillLight.position.set(-3.6, 2.2, 3.4);
    scene.add(fillLight);

    const rimLight = new DirectionalLight(new Color("#ff8f83"), 0.8);
    rimLight.position.set(3.8, 2.5, 2.6);
    scene.add(rimLight);

    try {
      renderer = new WebGLRenderer({
        alpha: true,
        antialias: true,
        canvas,
        powerPreference: "high-performance",
      });
    } catch (error) {
      reportSceneLoadError(error);

      const errorTimer = window.setTimeout(() => setLoadState("error"), 0);

      return () => window.clearTimeout(errorTimer);
    }

    function applyCanvasReveal(progress: number) {
      const easedProgress = 1 - (1 - progress) ** 3;
      const translateY = roundValue((1 - easedProgress) * 22, 3);
      const scale = roundValue(0.975 + easedProgress * 0.025, 4);

      revealFrame.style.opacity = String(roundValue(easedProgress, 3));
      revealFrame.style.transform = `translateY(${translateY}px) scale(${scale})`;
    }

    applyCanvasReveal(0);

    fallbackTimer = window.setTimeout(() => {
      if (!disposed) {
        setLoadState((currentState) => (currentState === "ready" ? currentState : "delayed"));
      }
    }, sceneLoadFallbackMs);

    function resize() {
      if (!renderer) {
        return;
      }

      const { height, width } = container.getBoundingClientRect();
      const safeHeight = Math.max(height, 1);
      const safeWidth = Math.max(width, 1);

      const isCompact = safeWidth < 640;

      configureRenderer(renderer, safeWidth, safeHeight);
      stage.scale.setScalar(isCompact ? 0.56 : 1);
      camera.aspect = safeWidth / safeHeight;
      camera.position.set(0, isCompact ? 0.68 : 0.88, isCompact ? 9.6 : 7.8);
      camera.lookAt(0, -0.1, 0);
      camera.updateProjectionMatrix();
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    function releaseSceneResources() {
      if (resourcesReleased) {
        return;
      }

      resourcesReleased = true;
      window.clearTimeout(resetStateTimer);
      cancelAnimationFrame(animationFrame);
      window.clearTimeout(fallbackTimer);
      window.removeEventListener("pointermove", handlePointerMove);
      resizeObserver.disconnect();

      for (const model of Object.values(loadedModels)) {
        if (model) {
          stage.remove(model);
          disposeObject3D(model);
        }
      }

      loadedModelsRef.current = {};
      if (renderer) {
        disposeHeroRenderer(renderer);
      }
      renderer = undefined;
    }

    const loader = new GLTFLoader();

    Promise.all(
      (Object.keys(modelConfigs) as LoadedModelName[]).map(async (name) => {
        const model = await loadModel(loader, configsRef.current[name]);

        if (disposed) {
          disposeObject3D(model);

          return;
        }

        loadedModels[name] = model;
        stage.add(model);
      }),
    )
      .then(() => {
        if (!disposed) {
          window.clearTimeout(fallbackTimer);
          renderer?.compile(scene, camera);
          warmupFramesRemaining = sceneWarmupFrames;
        }
      })
      .catch((error) => {
        if (!disposed) {
          reportSceneLoadError(error);
          setLoadState("error");
          disposed = true;
          releaseSceneResources();
        }
      });

    function handlePointerMove(event: PointerEvent) {
      const viewportWidth = window.innerWidth || 1;
      const viewportHeight = window.innerHeight || 1;

      pointer.targetX = (event.clientX / viewportWidth - 0.5) * 2;
      pointer.targetY = (event.clientY / viewportHeight - 0.5) * 2;
    }

    window.addEventListener("pointermove", handlePointerMove);

    const startTime = performance.now();

    function tick(now: number) {
      if (disposed || !renderer) {
        return;
      }

      if (document.hidden) {
        animationFrame = requestAnimationFrame(tick);

        return;
      }

      const time = (now - startTime) / 1000;

      pointer.x += (pointer.targetX - pointer.x) * 0.16;
      pointer.y += (pointer.targetY - pointer.y) * 0.16;

      for (const name of Object.keys(loadedModels) as LoadedModelName[]) {
        const model = loadedModels[name];

        if (model) {
          animateModel(name, model, configsRef.current[name], time, pointer, shouldReduceMotion);
        }
      }

      renderer.render(scene, camera);

      if (warmupFramesRemaining > 0) {
        warmupFramesRemaining -= 1;

        if (warmupFramesRemaining === 0) {
          applyCanvasReveal(1);
          setIsSceneContentReady(true);
          setLoadState("ready");
        }
      }

      animationFrame = requestAnimationFrame(tick);
    }

    animationFrame = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      releaseSceneResources();
    };
  }, [isViewportEnabled, reportSceneLoadError]);

  return (
    <>
      <div
        aria-hidden
        className={className}
        data-load-state={sceneLoadState}
        data-ready={isReady ? "true" : "false"}
        ref={rootRef}
      >
        {shouldRenderCanvas ? (
          <div
            className={styles.sceneCanvasFrame}
            data-ready={isReady ? "true" : "false"}
            data-scene-canvas-frame="true"
            ref={canvasFrameRef}
          >
            <canvas ref={canvasRef} />
          </div>
        ) : null}
      </div>

      {isEditorEnabled ? (
        <HeroSceneEditor
          activeModel={activeModel}
          configs={configs}
          onActiveModelChange={setActiveModel}
          onConfigChange={handleConfigChange}
          onResetAll={handleResetAll}
          onResetModel={handleResetModel}
        />
      ) : null}
    </>
  );
}
