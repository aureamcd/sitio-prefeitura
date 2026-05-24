"use client";
import { useEffect, useState } from "react";

export default function KeyboardShortcuts() {
    const [toastMsg, setToastMsg] = useState("");

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;

        function showFeedback(msg: string) {
            setToastMsg(msg);
            clearTimeout(timeout);
            timeout = setTimeout(() => setToastMsg(""), 2500);
        }

        function handleKeyDown(e: KeyboardEvent) {
            const active = document.activeElement;

            const isTyping =
                active instanceof HTMLInputElement ||
                active instanceof HTMLTextAreaElement ||
                active instanceof HTMLSelectElement ||
                active?.getAttribute("contenteditable") === "true";

            if (isTyping) return;

            if (e.altKey) {
                switch (e.code) {
                    case "Digit1":
                    case "Numpad1": {
                        e.preventDefault();
                        const el1 = document.getElementById("main-content");
                        if (el1) {
                            el1.setAttribute("tabindex", "-1");
                            el1.focus();
                            showFeedback("Foco: Conteúdo Principal");
                        }
                        break;
                    }

                    case "Digit2":
                    case "Numpad2": {
                        e.preventDefault();
                        const el2 = document.getElementById("main-nav");
                        if (el2) {
                            el2.setAttribute("tabindex", "-1");
                            el2.focus();
                            showFeedback("Foco: Menu Principal");
                        }
                        break;
                    }

                    case "Digit3":
                    case "Numpad3": {
                        e.preventDefault();
                        const el3 = document.getElementById("search-input");
                        if (el3) {
                            el3.focus();
                            showFeedback("Foco: Busca");
                        }
                        break;
                    }
                }
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            clearTimeout(timeout);
        };
    }, []);

    if (!toastMsg) return null;

    return (
        <div 
            role="status" 
            aria-live="polite" 
            className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2.5 rounded shadow-lg text-sm z-[9999] pointer-events-none"
        >
            {toastMsg}
        </div>
    );
}