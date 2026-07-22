"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type ToastFn = (msg: string, isErr?: boolean) => void;
const ToastContext = createContext<ToastFn>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const toast = useCallback<ToastFn>((message, isErr = false) => {
    setMsg(message);
    setErr(isErr);
    setShow(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setShow(false), 2600);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className={`toast${show ? " show" : ""}${err ? " err" : ""}`}>{msg}</div>
    </ToastContext.Provider>
  );
}
