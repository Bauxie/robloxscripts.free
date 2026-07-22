"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { getCircularCroppedBlob } from "@/lib/cropImage";

export default function AvatarCropModal({
  imageSrc,
  onCancel,
  onCropped,
}: {
  imageSrc: string;
  onCancel: () => void;
  onCropped: (blob: Blob) => void | Promise<void>;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setArea(croppedAreaPixels);
  }, []);

  async function apply() {
    if (!area) return;
    setBusy(true);
    setError("");
    try {
      const blob = await getCircularCroppedBlob(imageSrc, area, 512);
      await onCropped(blob);
    } catch (e) {
      setError((e as Error).message || "Could not crop image");
      setBusy(false);
    }
  }

  return (
    <div className="crop-modal" role="dialog" aria-modal="true" aria-label="Crop profile photo">
      <div className="crop-modal-panel">
        <div className="section-head" style={{ marginTop: 0 }}>
          <div>
            <span className="eyebrow">Profile photo</span>
            <h2>Zoom &amp; crop</h2>
            <p>Drag to reposition, then zoom to frame your face in the circle.</p>
          </div>
        </div>

        <div className="crop-stage">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <label className="crop-zoom">
          <span>Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            disabled={busy}
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="form-actions" style={{ marginTop: 12 }}>
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={apply} disabled={busy || !area}>
            {busy ? "Saving…" : "Save photo"}
          </button>
        </div>
      </div>
    </div>
  );
}
