import { useRef, useState } from "react";
import { FileText, FileUp, Presentation, ShieldCheck, Trash2, UploadCloud } from "lucide-react";
import { formatFileSize } from "../utils/file";

const MAX_SIZE = 25 * 1024 * 1024;
const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.presentationml.presentation"];

export function FileTypeBadge({ submission }) {
  const pdf = submission?.mimeType === "application/pdf" || String(submission?.fileExtension || submission?.name || "").toLowerCase().endsWith(".pdf");
  return <span className={`file-type-badge ${pdf ? "pdf" : "pptx"}`}>{pdf ? <FileText size={15} /> : <Presentation size={15} />}{pdf ? "PDF" : "PowerPoint"}</span>;
}

export function FileUpload({ file, onChange, progress = 0, uploading = false, maxSize = MAX_SIZE }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const validate = (nextFile) => {
    if (!nextFile) return;
    const validExtension = /\.(pdf|pptx)$/i.test(nextFile.name);
    if (!allowedTypes.includes(nextFile.type) || !validExtension) {
      setError("Archivo no permitido. Selecciona un PDF o PowerPoint (.pptx).");
      return;
    }
    if (nextFile.size > maxSize) {
      setError(`El archivo supera el limite de ${formatFileSize(maxSize)}.`);
      return;
    }
    setError("");
    onChange(nextFile);
  };

  return <div className="file-upload">
    <div className="upload-guidance"><div><FileUp size={20} /><p><strong>PDF o PowerPoint (.pptx)</strong><span>Tamano maximo: {formatFileSize(maxSize)}</span></p></div><div><ShieldCheck size={20} /><p><strong>Entrega protegida</strong><span>Revisaremos el archivo antes de habilitarlo.</span></p></div></div>
    {!file ? <div className={`drop-zone ${dragging ? "dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); validate(event.dataTransfer.files[0]); }}>
      <UploadCloud size={34} aria-hidden="true" /><strong>Arrastra tu archivo aqui</strong><span>o</span><button type="button" onClick={() => inputRef.current?.click()}>Seleccionar archivo</button>
      <input ref={inputRef} type="file" accept=".pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation" onChange={(event) => validate(event.target.files[0])} />
    </div> : <div className="selected-file"><FileTypeBadge submission={file} /><div className="file-details"><strong>{file.name}</strong><span>{formatFileSize(file.size)}</span>{uploading && <div className="progress-track" aria-label={`Subiendo ${progress}%`}><span style={{ width: `${progress}%` }} /></div>}</div><span className="progress-label">{uploading ? `${progress}%` : "Listo para enviar"}</span><button type="button" className="icon-button danger-icon" disabled={uploading} onClick={() => onChange(null)} aria-label="Quitar archivo"><Trash2 size={18} /></button></div>}
    {error && <p className="field-error" role="alert">{error}</p>}
    <p className="file-security-note">No se permiten archivos con macros, ejecutables ni archivos comprimidos.</p>
  </div>;
}
