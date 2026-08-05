import { useCallback, useEffect, useState } from "react";
import { apiMessage } from "../services/api";

export function useAsyncResource(loader, fallbackMessage = "No se pudo cargar la informacion.") {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) { setLoading(true); setError(""); }
      return loader();
    }).then((result) => { if (active) setData(result); }).catch((loadError) => { if (active) setError(apiMessage(loadError, fallbackMessage)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fallbackMessage, loader, revision]);

  return { data, error, loading, reload, setData };
}
