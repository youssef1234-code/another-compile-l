import { useOutletContext } from "react-router-dom";

export interface PageMeta {
  title: string;
  description?: string;
}

export interface PageMetaContext {
  setPageMeta: (meta: PageMeta) => void;
}

export function usePageMeta(): PageMetaContext {
  return useOutletContext<PageMetaContext>();
}
