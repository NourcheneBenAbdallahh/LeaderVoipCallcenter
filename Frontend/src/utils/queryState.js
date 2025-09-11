// src/utils/queryState.js
import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";

/** Parseurs/sérialiseurs par défaut */
const defaultSerialize = (v) => (Array.isArray(v) ? v.join(",") : String(v));
const defaultParse = (s, def) => {
  if (Array.isArray(def)) return (s ? s.split(",").filter(Boolean) : []);
  if (typeof def === "number") return s != null ? Number(s) : def;
  if (typeof def === "boolean") return s === "true";
  return s ?? def;
};

/**
 * Hook simple pour synchroniser UNE clé de query (URL) avec un état.
 * - key: "page"
 * - defaultValue: 1
 * - opts: { serialize, parse, replace, storageKey }
 */
export function useQueryState(key, defaultValue, opts = {}) {
  const serialize = opts.serialize ?? defaultSerialize;
  const parse = opts.parse ?? ((s) => defaultParse(s, defaultValue));
  const replace = opts.replace ?? true; // replaceState pour ne pas polluer l'historique
  const storageKey = opts.storageKey || null;

  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // valeur initiale (URL > storage > default)
  const initial = useMemo(() => {
    const fromUrl = params.get(key);
    if (fromUrl != null) return parse(fromUrl);
    if (storageKey) {
      try {
        const raw = sessionStorage.getItem(storageKey);
        if (raw != null) return parse(raw);
      } catch {}
    }
    return defaultValue;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // important: se calcule une seule fois au montage

  // setter qui écrit URL (+ storage optionnel)
  const setValue = useCallback(
    (next) => {
      const val = typeof next === "function" ? next(initial) : next;
      const nextParams = new URLSearchParams(params);
      const str = serialize(val);

      if (str === "" || str == null) nextParams.delete(key);
      else nextParams.set(key, str);

      // n'écrit que si ça change
      if (nextParams.toString() !== params.toString()) {
        setParams(nextParams, { replace });
      }
      if (storageKey) {
        try {
          if (str === "" || str == null) sessionStorage.removeItem(storageKey);
          else sessionStorage.setItem(storageKey, str);
        } catch {}
      }
    },
    [key, params, replace, serialize, setParams, storageKey, initial]
  );

  // expose la valeur courante (recalculée depuis l’URL)
  const value = useMemo(() => parse(params.get(key)), [params, key, parse]);

  // helper pour reset
  const reset = useCallback(() => {
    const nextParams = new URLSearchParams(params);
    nextParams.delete(key);
    setParams(nextParams, { replace });
    if (storageKey) {
      try { sessionStorage.removeItem(storageKey); } catch {}
    }
  }, [key, params, replace, setParams, storageKey]);

  return [value ?? defaultValue, setValue, reset];
}

/**
 * Version "objet" pour synchroniser plusieurs clés d’un coup.
 * mapping = {
 *   page: { def: 1, type: "number" },
 *   sortBy: { def: "Date" },
 *   tags: { def: [], parse: s => s.split("|"), serialize: a => a.join("|") }
 * }
 */
export function useQueryObject(mapping, opts = {}) {
  const [params, setParams] = useSearchParams();
  const replace = opts.replace ?? true;

  // construire l'objet courant depuis l'URL
  const state = useMemo(() => {
    const obj = {};
    for (const [k, conf] of Object.entries(mapping)) {
      const def = conf.def;
      const parse =
        conf.parse ??
        ((s) => defaultParse(s, def));
      obj[k] = parse(params.get(k));
      if (obj[k] == null) obj[k] = def;
    }
    return obj;
  }, [params, mapping]);

  // setter partiel
  const setState = useCallback(
    (patch) => {
      const nextParams = new URLSearchParams(params);
      for (const [k, v] of Object.entries(
        typeof patch === "function" ? patch(state) : patch
      )) {
        const conf = mapping[k] || {};
        const serialize = conf.serialize ?? defaultSerialize;
        const str = serialize(v);
        if (str === "" || str == null) nextParams.delete(k);
        else nextParams.set(k, str);
      }
      if (nextParams.toString() !== params.toString()) {
        setParams(nextParams, { replace });
      }
    },
    [params, setParams, replace, state, mapping]
  );

  const reset = useCallback(() => {
    const nextParams = new URLSearchParams(params);
    for (const k of Object.keys(mapping)) nextParams.delete(k);
    setParams(nextParams, { replace });
  }, [params, setParams, replace, mapping]);

  return [state, setState, reset];
}
