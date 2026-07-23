import { useEffect } from "react";

const BASE = "Ripple";

export const usePageTitle = (title?: string) => {
    useEffect(() => {
        document.title = title ? `${title} • ${BASE}` : BASE;
        return () => { document.title = BASE; };
    }, [title]);
};
