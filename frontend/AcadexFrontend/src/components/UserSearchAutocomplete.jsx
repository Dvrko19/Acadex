import { useEffect, useRef, useState } from "react";
import { Check, Search, UserRound, X } from "lucide-react";

import { apiMessage } from "../services/api";
import { userService } from "../services/userService";

const roleLabels = { teacher: "Profesor", student: "Estudiante" };

export function UserSearchAutocomplete({ label, role, value, onChange, placeholder = "Escribe nombre, apellido o correo" }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    const term = query.trim();
    if (value || term.length < 2) {
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError("");
      try {
        const result = await userService.search({ q: term, role, signal: controller.signal });
        setItems(result.items);
        setOpen(true);
      } catch (searchError) {
        if (searchError.code !== "ERR_CANCELED") setError(apiMessage(searchError, "No se pudo realizar la busqueda."));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => { window.clearTimeout(timer); abortRef.current?.abort(); };
  }, [query, role, value]);

  const selectUser = (user) => {
    onChange(user);
    setQuery("");
    setOpen(false);
  };

  return <div className="autocomplete form-field">
    <span>{label}</span>
    {value ? <div className="selected-user"><UserRound size={18} /><div><strong>{value.fullName || `${value.name || ""} ${value.lastName || ""}`.trim()}</strong><small>{value.email}</small></div><Check size={17} className="selected-check" /><button type="button" className="icon-button" onClick={() => onChange(null)} aria-label="Quitar seleccion"><X size={17} /></button></div> : <>
      <div className="input-with-icon"><Search size={17} /><input value={query} onFocus={() => setOpen(true)} onChange={(event) => setQuery(event.target.value)} placeholder={placeholder} autoComplete="off" aria-expanded={open} /></div>
      {query.length > 0 && query.trim().length < 2 && <small className="field-hint">Escribe al menos 2 caracteres.</small>}
      {open && !value && query.trim().length >= 2 && <div className="autocomplete-menu" role="listbox">
        {loading && <p className="autocomplete-message">Buscando...</p>}
        {!loading && error && <p className="autocomplete-message error-text">{error}</p>}
        {!loading && !error && !items.length && <p className="autocomplete-message">No encontramos resultados.</p>}
        {!loading && items.map((item) => <button type="button" role="option" key={item.id} onClick={() => selectUser(item)}>
          <UserRound size={18} /><span><strong>{item.fullName || `${item.name || ""} ${item.lastName || ""}`.trim()}</strong><small>{item.email}</small><small>{item.role === "student" ? `${item.gradeLevel || "Grado sin registrar"} · Seccion ${item.section || "-"}` : `${roleLabels[item.role] || item.role} · ${item.subjectArea || "Area sin registrar"}`}</small></span>
        </button>)}
      </div>}
    </>}
  </div>;
}
